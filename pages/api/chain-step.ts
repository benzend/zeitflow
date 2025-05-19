import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { chainStepsTable, SelectChainStep } from '@/schema';
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
        return handlePost(req, res);
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

  const chainStepCreateResponse = await db.insert(chainStepsTable).values({
    chainId: req.body.chainId,
    prompt: req.body.prompt,
    cycleCount: req.body.cycleCount || 1,
    currentCycle: 0,
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

  if (!req.body.prompt || !req.body.cycleCount) {
    return res.status(400)
      .json({ success: false, message: 'Need to update something, no paramaters provided' });
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

  if (req.body.current_cycle !== undefined) {
    updateData.currentCycle = req.body.current_cycle;
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
