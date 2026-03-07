/**
 * Centralized API Route Handler
 *
 * Provides a typed wrapper around Next.js API routes with:
 * - Automatic session/auth checking
 * - Rate limiting
 * - Method routing
 * - Consistent error responses via AppError
 * - neverthrow Result integration
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { db } from '@/lib/db';
import { usersTable } from '@/schema';
import { eq } from 'drizzle-orm';
import { isRateLimited } from '@/lib/rate-limit';
import { Result, ok, err } from 'neverthrow';
import {
  AppError,
  authenticationError,
  rateLimitError,
  notFoundError,
  internalError,
  toAppError,
} from '@/lib/errors';

export interface AuthenticatedContext {
  session: Session;
  userId: string;
  userEmail: string;
}

type MethodHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  ctx: AuthenticatedContext
) => Promise<void>;

interface ApiHandlerOptions {
  /** Rate limit key prefix (combined with client IP) */
  rateLimitKey?: string;
  /** Rate limit window in ms (default: 1 hour) */
  rateLimitWindowMs?: number;
  /** Max requests per window (default: 100) */
  rateLimitMax?: number;
  /** Set to true if route does not require authentication */
  public?: boolean;
  /** Method handlers */
  GET?: MethodHandler;
  POST?: MethodHandler;
  PUT?: MethodHandler;
  DELETE?: MethodHandler;
  PATCH?: MethodHandler;
}

/**
 * Send a consistent error response from an AppError.
 */
export function sendError(res: NextApiResponse, error: AppError): void {
  // Log server errors with full context, client errors at debug level
  if (error.statusCode >= 500) {
    console.error(`[${error.code}] ${error.message}`, error.context ?? '');
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    code: error.code,
  });
}

/**
 * Handle a neverthrow Result in an API route.
 * On Ok, calls the success handler. On Err, sends the error response.
 */
export function handleResult<T>(
  res: NextApiResponse,
  result: Result<T, AppError>,
  onSuccess: (value: T) => void
): void {
  result.match(
    (value) => onSuccess(value),
    (error) => sendError(res, error)
  );
}

/**
 * Authenticate the request and resolve the user.
 * Supports both Bearer token auth (CLI/MCP) and NextAuth session cookies (browser).
 * Returns a Result so callers can use neverthrow chaining.
 */
export async function authenticateRequest(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<Result<AuthenticatedContext, AppError>> {
  // Try Bearer token auth first (for CLI / MCP clients)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.apiToken, token))
      .limit(1);

    if (users.length > 0 && users[0].email) {
      return ok({
        session: { user: { email: users[0].email } } as Session,
        userId: users[0].id,
        userEmail: users[0].email,
      });
    }
    // Invalid token — fall through to session auth
  }

  // Fall back to NextAuth session cookies (browser clients)
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return err(authenticationError());
  }

  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, session.user.email))
    .limit(1);

  if (users.length === 0) {
    return err(notFoundError('User'));
  }

  return ok({
    session,
    userId: users[0].id,
    userEmail: session.user.email,
  });
}

/**
 * Create a centralized API route handler with auth, rate limiting,
 * and method routing built in.
 *
 * @example
 * export default apiHandler({
 *   rateLimitKey: 'workflows',
 *   GET: async (req, res, { userId }) => {
 *     const workflows = await getWorkflows(userId);
 *     res.status(200).json({ success: true, workflows });
 *   },
 *   POST: async (req, res, { userId }) => {
 *     // ...
 *   },
 * });
 */
export function apiHandler(options: ApiHandlerOptions) {
  const allowedMethods = (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const).filter(
    (m) => options[m]
  );

  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Method check
    const method = req.method as keyof ApiHandlerOptions;
    const handler = options[method] as MethodHandler | undefined;

    if (!handler) {
      res.setHeader('Allow', allowedMethods);
      return sendError(res, {
        category: 'VALIDATION',
        message: `Method ${req.method} not allowed`,
        statusCode: 405,
        code: 'METHOD_NOT_ALLOWED',
      });
    }

    // Rate limiting
    if (options.rateLimitKey) {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
      const clientIp = Array.isArray(ip) ? ip[0] : ip;

      const isLimited = await isRateLimited({
        key: `${options.rateLimitKey}:${clientIp}`,
        windowMs: options.rateLimitWindowMs ?? 60 * 60 * 1000,
        maxRequests: options.rateLimitMax ?? 100,
      });

      if (isLimited) {
        return sendError(res, rateLimitError());
      }
    }

    // Authentication
    if (!options.public) {
      const authResult = await authenticateRequest(req, res);

      if (authResult.isErr()) {
        return sendError(res, authResult.error);
      }

      try {
        await handler(req, res, authResult.value);
      } catch (error) {
        return sendError(res, toAppError(error));
      }
    } else {
      try {
        await handler(req, res, {
          session: {} as Session,
          userId: '',
          userEmail: '',
        });
      } catch (error) {
        return sendError(res, toAppError(error));
      }
    }
  };
}
