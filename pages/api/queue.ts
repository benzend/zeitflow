import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { chainsTable, chainStepsTable, SelectChain, SelectChainStep } from '@/schema';
import { isRateLimited } from '@/lib/rate-limit';
import { eq } from 'drizzle-orm';

type ResponseData = {
  success: boolean;
  message: string;
  chainId?: number;
  chains?: SelectChain[];
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
      case 'GET':
        return handleGet(req, res);
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
    const fakeUserId = 3;

    if (!req.body.name) {
      console.error('Missing name param from request body:', req.body);
      return res
        .status(500)
        .json({ success: false, message: 'Failed to create queue' });
    }

    // Add new subscriber
    const chainCreateResponse = await db.insert(chainsTable).values({
      userId: fakeUserId,
      name: req.body.name,
      cycleCount: req.body.cycle_count || 1,
      currentCycle: 0,
    }).returning({ id: chainsTable.id });
    
    const chainId = chainCreateResponse[0].id;

    return res
      .status(200)
      .json({ success: true, message: 'Successfully created chain!', chainId });
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
    const fakeUserId = 3;
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
        .where(eq(chainStepsTable.chainId, chain[0].id));

      return res.status(200)
        .json({ success: true, message: 'Successfully retrieved chain!', chains: chain, chainSteps });
    } else {
      // Get all chains for the user
      const chains = await db.select()
        .from(chainsTable)
        .where(eq(chainsTable.userId, fakeUserId));

      const chainSteps = await db.select()
        .from(chainStepsTable)
        .where(eq(chainStepsTable.chainId, chains[0].id));

      return res.status(200)
        .json({ success: true, message: 'Successfully grabbed chains!', chains, chainSteps });
    }
}

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
    const fakeUserId = 3;
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

    if (existingChain[0].userId !== fakeUserId) {
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
    
    if (req.body.current_cycle !== undefined) {
      updateData.currentCycle = req.body.current_cycle;
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
) {
    const fakeUserId = 3;
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

    if (existingChain[0].userId !== fakeUserId) {
      return res.status(403)
        .json({ success: false, message: 'Not authorized to delete this chain' });
    }

    // Delete the chain
    await db.delete(chainsTable)
      .where(eq(chainsTable.id, chainId));

    return res.status(200)
      .json({ success: true, message: 'Successfully deleted chain!', chainId });
}
