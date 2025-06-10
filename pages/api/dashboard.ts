import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { db } from '@/lib/db';
import { chainsTable, chainStepsTable, queuedChainsTable, queuedChainStepsTable, SelectChain, SelectChainStep, SelectQueuedChain, SelectQueuedChainStep, usersTable } from '@/schema';
import { isRateLimited, isRateLimitedWithSubscription } from '@/lib/rate-limit';
import { eq, inArray } from 'drizzle-orm';

type ResponseData = {
  success: boolean;
  message: string;
  chainId?: number;
  chains?: SelectChain[];
  chainSteps?: SelectChainStep[];
  queuedChains?: (SelectQueuedChain & { steps?: SelectQueuedChainStep[] })[];
  usage?: {
    callsUsed: number;
    callsLimit: number;
    tier: string;
  };
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

  // Get client IP for rate limiting
  const ip = req.headers['x-forwarded-for'] ||
    req.socket.remoteAddress ||
    'unknown-ip';

  const clientIp = Array.isArray(ip) ? ip[0] : ip;

  const methodAsLower = req.method.toLowerCase();

  const windowMs = (() => {
    switch (req.method) {
      case 'GET':
        return 60 * 1000; // 1 minute in milliseconds
      case 'POST':
      case 'PUT':
      case 'DELETE':
        return 60 * 60 * 1000; // 1 hour in milliseconds
      default:
        throw new Error(`${req.method} somehow got throuhg`);
    }
  })();

  // Check rate limit (5 requests per IP address per hour)
  const isLimited = await isRateLimited({
    key: `dashboard::${methodAsLower}:${clientIp}`,
    windowMs,
    maxRequests: 1000
  });

  if (isLimited) {
    return res
      .status(429)
      .json({ success: false, message: 'Too many requests. Please try again later.' });
  }

  if (!session.user?.email) {
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

  try {
    switch (req.method) {
      case 'POST':
        return handlePost(req, res, user[0].id);
      case 'GET':
        return handleGet(req, res, user[0].id);
      case 'PUT':
        return handlePut(req, res, user[0].id);
      case 'DELETE':
        return handleDelete(req, res, user[0].id);
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

  if (!req.body.name) {
    console.error('Missing name param from request body:', req.body);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to create queue' });
  }

  // Add new subscriber
  const chainCreateResponse = await db.insert(chainsTable).values({
    userId: userId,
    name: req.body.name,
    cycleCount: req.body.cycle_count || 1,
  }).returning({ id: chainsTable.id });

  const chainId = chainCreateResponse[0].id;

  return res
    .status(200)
    .json({ success: true, message: 'Successfully created chain!', chainId });
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
  userId: string,
) {
  const chainId = req.query.id ? parseInt(req.query.id as string, 10) : null;

  if (chainId) {
    // Get a specific chain
    const chain = await db.select()
      .from(chainsTable)
      .where(eq(chainsTable.id, chainId))
      .limit(1);

    if (chain.length === 0) {
      return res.status(404)
        .json({ success: false, message: 'Chain not found' });
    }

    const chainSteps = await db.select()
      .from(chainStepsTable)
      .where(eq(chainStepsTable.chainId, chain[0].id))
      .orderBy(chainStepsTable.position);

    return res.status(200)
      .json({ success: true, message: 'Successfully retrieved chain!', chains: chain, chainSteps });
  } else {
    // Get all chains for the user
    const chains = await db.select()
      .from(chainsTable)
      .where(eq(chainsTable.userId, userId));

    // Get chain step counts for all chains
    const chainStepCounts = chains.length > 0
      ? await db.select()
          .from(chainStepsTable)
          .where(inArray(chainStepsTable.chainId, chains.map(c => c.id)))
      : [];

    // Add step count to each chain
    const chainsWithStepCounts = chains.map(chain => ({
      ...chain,
      stepCount: chainStepCounts.filter(step => step.chainId === chain.id).length
    }));

    // Get usage data
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const usageData = await isRateLimitedWithSubscription(
      user[0].email,
      `add_to_queue:${user[0].email}`,
      60 * 60 * 1000, // 1 hour window
      true
    );

    const usage = {
      callsUsed: usageData.limit - usageData.remaining,
      callsLimit: usageData.limit,
      tier: usageData.tier
    };

    if (chains.length === 0) {
      return res.status(200)
        .json({ success: true, message: 'Successfully grabbed chains!', chains: [], chainSteps: [], usage });
    }

    const queuedChains = await db.select()
      .from(queuedChainsTable)
      .where(inArray(queuedChainsTable.chainId, chains.map(c => c.id)));

    // Get queued chain steps for progress tracking
    const queuedChainSteps = queuedChains.length > 0 
      ? await db.select()
          .from(queuedChainStepsTable)
          .where(inArray(queuedChainStepsTable.queuedChainId, queuedChains.map(qc => qc.id)))
      : [];

    // Group steps by queued chain ID
    const queuedChainsWithSteps = queuedChains.map(qc => ({
      ...qc,
      steps: queuedChainSteps.filter(step => step.queuedChainId === qc.id)
    }));

    return res.status(200)
      .json({ success: true, message: 'Successfully grabbed chains!', chains: chainsWithStepCounts, queuedChains: queuedChainsWithSteps, usage });
  }
}

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
  userId: string,
) {
  const chainId = req.query.id ? parseInt(req.query.id as string, 10) : null;

  if (!chainId) {
    return res.status(400)
      .json({ success: false, message: 'Chain ID is required' });
  }

  // Verify the chain exists and belongs to the user
  const existingChain = await db.select()
    .from(chainsTable)
    .where(eq(chainsTable.id, chainId))
    .limit(1);

  if (existingChain.length === 0) {
    return res.status(404)
      .json({ success: false, message: 'Chain not found' });
  }

  if (existingChain[0].userId !== userId) {
    return res.status(403)
      .json({ success: false, message: 'Not authorized to update this chain' });
  }

  // Update the chain
  const updateData: Partial<typeof chainsTable.$inferInsert> = {};

  if (req.body.name !== undefined) {
    updateData.name = req.body.name;
  }

  if (req.body.cycle_count !== undefined) {
    updateData.cycleCount = req.body.cycle_count;
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400)
      .json({ success: false, message: 'No valid fields to update' });
  }

  await db.update(chainsTable)
    .set(updateData)
    .where(eq(chainsTable.id, chainId));

  return res.status(200)
    .json({ success: true, message: 'Successfully updated chain!', chainId });
}

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
  userId: string,
) {
  const chainId = req.query.id ? parseInt(req.query.id as string, 10) : null;

  if (!chainId) {
    return res.status(400)
      .json({ success: false, message: 'Chain ID is required' });
  }

  // Verify the chain exists and belongs to the user
  const existingChain = await db.select()
    .from(chainsTable)
    .where(eq(chainsTable.id, chainId))
    .limit(1);

  if (existingChain.length === 0) {
    return res.status(404)
      .json({ success: false, message: 'Chain not found' });
  }

  if (existingChain[0].userId !== userId) {
    return res.status(403)
      .json({ success: false, message: 'Not authorized to delete this chain' });
  }

  // Delete the chain
  await db.delete(chainsTable)
    .where(eq(chainsTable.id, chainId));

  return res.status(200)
    .json({ success: true, message: 'Successfully deleted chain!', chainId });
}
