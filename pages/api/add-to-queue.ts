import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { db } from '@/lib/db';
import { queuedChainStepsTable, chainsTable, chainStepsTable, queuedChainsTable, queuesTable, usersTable } from '@/schema';
import { isRateLimited } from '@/lib/rate-limit';
import { eq } from 'drizzle-orm';

type ResponseData = {
  success: boolean;
  message: string;
  queuedChainId?: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
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

  // Check rate limit (10 requests per IP address per hour)
  const isLimited = await isRateLimited({
    key: `add_to_queue:${clientIp}`,
    windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
    maxRequests: 20
  });

  if (isLimited) {
    return res
      .status(429)
      .json({ success: false, message: 'Too many requests. Please try again later.' });
  }

  try {
    const chainId = req.query.id ? parseInt(req.query.id as string, 10) : null;

    if (!chainId) {
      return res.status(400)
        .json({ success: false, message: 'Chain ID is required' });
    }

    // Get a specific chain
    const chain = await db.select()
      .from(chainsTable)
      .where(eq(chainsTable.id, chainId))
      .limit(1);

    if (chain.length === 0) {
      return res.status(404)
        .json({ success: false, message: 'Chain not found' });
    }

    // Verify the chain belongs to the authenticated user
    if (chain[0].userId !== user[0].id) {
      return res.status(403)
        .json({ success: false, message: 'Not authorized to queue this chain' });
    }

    let queue = await db.select()
      .from(queuesTable)
      .where(eq(queuesTable.userId, user[0].id))
      .limit(1);

    if (queue.length === 0) {
      queue = await db.insert(queuesTable).values({
        userId: user[0].id,
      }).returning();
    }

    const chainSteps = await db.select()
      .from(chainStepsTable)
      .where(eq(chainStepsTable.chainId, chain[0].id));

    const queuedChain = await db.insert(queuedChainsTable).values({
      queueId: queue[0].id,
      chainId: chain[0].id,
      status: 'pending',
    }).returning({ id: queuedChainsTable.id });

    await db.insert(queuedChainStepsTable).values(chainSteps.map(cs => ({
      queuedChainId: queuedChain[0].id,
      chainStepId: cs.id,
      status: 'pending',
    })));

    return res.status(200)
      .json({ success: true, message: 'Successfully queued chain!', queuedChainId: queuedChain[0].id });

  } catch (error) {
    console.error('Chain operation error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to process request' });
  }
}
