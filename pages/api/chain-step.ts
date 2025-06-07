import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { db } from '@/lib/db';
import { chainStepsTable, chainsTable, SelectChainStep, usersTable } from '@/schema';
import { isRateLimited } from '@/lib/rate-limit';
import { eq } from 'drizzle-orm';

type ResponseData = {
  success: boolean;
  message: string;
  chainStepId?: number;
  chainSteps?: SelectChainStep[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (!req.method || !['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' });
  }

  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res
      .status(401)
      .json({ success: false, message: 'Unauthorized' });
  }

  const user = await db.select()
    .from(usersTable)
    .where(eq(usersTable.email, session.user.email))
    .limit(1);

  if (user.length === 0) {
    return res
      .status(401)
      .json({ success: false, message: 'Unauthorized' });
  }

  // Get client IP for rate limiting
  const ip = req.headers['x-forwarded-for'] ||
    req.socket.remoteAddress ||
    'unknown-ip';

  const clientIp = Array.isArray(ip) ? ip[0] : ip;

  const methodAsLower = req.method.toLowerCase();

  const windowMs = (() => {
    switch (req.method) {
      case 'POST':
      case 'PUT':
      case 'DELETE':
        return 60 * 60 * 1000; // 1 hour in milliseconds
      default:
        throw new Error(`${req.method} somehow got throuhg`);
    }
  })();

  const isLimited = await isRateLimited({
    key: `queue::${methodAsLower}:${clientIp}`,
    windowMs,
    maxRequests: 1000
  });

  if (isLimited) {
    return res
      .status(429)
      .json({ success: false, message: 'Too many requests. Please try again later.' });
  }

  try {
    switch (req.method) {
      case 'POST':
        return handlePost(req, res, user[0].id);
      case 'PUT':
        return handlePut(req, res);
      case 'DELETE':
        return handleDelete(req, res);
    }
  } catch (error) {
    console.error('Chain operation error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to process request' });
  }
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
  userId: string,
) {
  if (!req.body.prompt) {
    console.error('Missing prompt param from request body:', req.body);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to create chain step' });
  }

  if (!req.body.chainId) {
    console.error('Missing chainId param from request body:', req.body);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to create chain step' });
  }

  if (!req.body.position) {
    console.error('Missing position param from request body:', req.body);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to create chain step' });
  }

  // Verify the chain belongs to the authenticated user
  const chain = await db.select()
    .from(chainsTable)
    .where(eq(chainsTable.id, req.body.chainId))
    .limit(1);

  if (chain.length === 0) {
    return res.status(404)
      .json({ success: false, message: 'Chain not found' });
  }

  if (chain[0].userId !== userId) {
    return res.status(403)
      .json({ success: false, message: 'Not authorized to add steps to this chain' });
  }

  const chainSteps = await db.select()
    .from(chainStepsTable)
    .where(eq(chainStepsTable.chainId, req.body.chainId))
    .orderBy(chainStepsTable.position);

  if (chainSteps.some((cs) => cs.position === req.body.position)) {
    return res.status(400)
      .json({ success: false, message: 'Position already taken' });
  }

  const chainStepCreateResponse = await db.insert(chainStepsTable).values({
    chainId: req.body.chainId,
    prompt: req.body.prompt,
    cycleCount: req.body.cycleCount || 1,
    position: req.body.position || 0,
  }).returning({ id: chainStepsTable.id });

  const chainStepId = chainStepCreateResponse[0].id;

  return res
    .status(200)
    .json({ success: true, message: 'Successfully created chain step!', chainStepId });
}

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  const chainStepId = req.query.id ? parseInt(req.query.id as string, 10) : null;

  if (!chainStepId) {
    return res.status(400)
      .json({ success: false, message: 'Chain Step ID is required' });
  }

  if (!req.body.prompt && !req.body.cycleCount && req.body.cycle_count === undefined) {
    return res.status(400)
      .json({ success: false, message: 'At least one field (prompt or cycleCount) must be provided for update' });
  }

  // Verify the chain exists and belongs to the user
  const existingChainStep = await db.select()
    .from(chainStepsTable)
    .where(eq(chainStepsTable.id, chainStepId))
    .limit(1);

  if (existingChainStep.length === 0) {
    return res.status(404)
      .json({ success: false, message: 'Chain step not found' });
  }

  // Update the chain
  const updateData: Partial<typeof chainStepsTable.$inferInsert> = {};

  if (req.body.prompt !== undefined) {
    updateData.prompt = req.body.prompt;
  }

  if (req.body.cycle_count !== undefined) {
    updateData.cycleCount = req.body.cycle_count;
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400)
      .json({ success: false, message: 'No valid fields to update' });
  }

  await db.update(chainStepsTable)
    .set(updateData)
    .where(eq(chainStepsTable.id, chainStepId));

  return res.status(200)
    .json({ success: true, message: 'Successfully updated chain step!', chainStepId });
}

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  const chainStepId = req.query.id ? parseInt(req.query.id as string, 10) : null;

  if (!chainStepId) {
    return res.status(400)
      .json({ success: false, message: 'Chain step ID is required' });
  }

  // Verify the chain exists and belongs to the user
  const existingChainStep = await db.select()
    .from(chainStepsTable)
    .where(eq(chainStepsTable.id, chainStepId))
    .limit(1);

  if (existingChainStep.length === 0) {
    return res.status(404)
      .json({ success: false, message: 'Chain not found' });
  }

  // Delete the chain
  await db.delete(chainStepsTable)
    .where(eq(chainStepsTable.id, chainStepId));

  return res.status(200)
    .json({ success: true, message: 'Successfully deleted chain!' });
}
