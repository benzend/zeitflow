/**
 * Application Error Types
 *
 * Typed error hierarchy for consistent error handling across the application.
 * Used with neverthrow Result types for explicit error propagation.
 */

export type ErrorCategory =
  | 'VALIDATION'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'NOT_FOUND'
  | 'RATE_LIMIT'
  | 'INTEGRATION'
  | 'CONFIGURATION'
  | 'INTERNAL';

export interface AppError {
  category: ErrorCategory;
  message: string;
  /** HTTP status code to use when this error surfaces in an API response */
  statusCode: number;
  /** Machine-readable error code for programmatic handling */
  code: string;
  /** Additional context for logging/debugging (not exposed to clients) */
  context?: Record<string, unknown>;
}

// --- Factory functions ---

export function validationError(
  message: string,
  context?: Record<string, unknown>
): AppError {
  return {
    category: 'VALIDATION',
    message,
    statusCode: 400,
    code: 'VALIDATION_ERROR',
    context,
  };
}

export function authenticationError(
  message = 'You must be signed in to access this resource'
): AppError {
  return {
    category: 'AUTHENTICATION',
    message,
    statusCode: 401,
    code: 'AUTHENTICATION_REQUIRED',
  };
}

export function authorizationError(
  message = 'You do not have permission to perform this action'
): AppError {
  return {
    category: 'AUTHORIZATION',
    message,
    statusCode: 403,
    code: 'FORBIDDEN',
  };
}

export function notFoundError(
  resource: string,
  context?: Record<string, unknown>
): AppError {
  return {
    category: 'NOT_FOUND',
    message: `${resource} not found`,
    statusCode: 404,
    code: 'NOT_FOUND',
    context,
  };
}

export function rateLimitError(
  message = 'Rate limit exceeded. Please try again later.'
): AppError {
  return {
    category: 'RATE_LIMIT',
    message,
    statusCode: 429,
    code: 'RATE_LIMIT_EXCEEDED',
  };
}

export function integrationError(
  integration: string,
  message: string,
  context?: Record<string, unknown>
): AppError {
  return {
    category: 'INTEGRATION',
    message,
    statusCode: 502,
    code: `INTEGRATION_${integration.toUpperCase()}_ERROR`,
    context,
  };
}

export function configurationError(
  message: string,
  context?: Record<string, unknown>
): AppError {
  return {
    category: 'CONFIGURATION',
    message,
    statusCode: 500,
    code: 'CONFIGURATION_ERROR',
    context,
  };
}

export function internalError(
  message = 'Internal server error',
  context?: Record<string, unknown>
): AppError {
  return {
    category: 'INTERNAL',
    message,
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    context,
  };
}

/**
 * Convert an unknown caught value into an AppError.
 * Preserves AppError instances, wraps everything else as INTERNAL.
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;

  const message = error instanceof Error ? error.message : String(error);
  return internalError(message, {
    originalError: error instanceof Error ? error.stack : undefined,
  });
}

/**
 * Type guard for AppError
 */
export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'category' in value &&
    'statusCode' in value &&
    'code' in value &&
    'message' in value
  );
}
