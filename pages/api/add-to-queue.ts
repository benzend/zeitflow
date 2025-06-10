import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { db } from '@/lib/db';
import {
  queuedChainStepsTable,
  chainsTable,
  chainStepsTable,
  queuedChainsTable,
  queuesTable,
  usersTable,
} from '@/schema';
import { isRateLimitedWithSubscription } from '@/lib/rate-limit';
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
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, session.user.email))
    .limit(1);

  if (user.length === 0) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Note: No longer using IP-based rate limiting, using user email instead

  // Check rate limit based on user subscription
  const rateLimitResult = await isRateLimitedWithSubscription(
    session.user.email,
    `add_to_queue:${session.user.email}`,
    60 * 60 * 1000 // 1 hour
  );

  if (rateLimitResult.isLimited) {
    return res
      .status(429)
      .json({
        success: false,
        message: `Rate limit exceeded. You are on the ${rateLimitResult.tier} plan with ${rateLimitResult.limit} requests per hour. Upgrade your subscription for higher limits.`,
      });
  }

  try {
    const chainId = req.query.id ? parseInt(req.query.id as string, 10) : null;

    if (!chainId) {
      return res
        .status(400)
        .json({ success: false, message: 'Chain ID is required' });
    }

    // Get a specific chain
    const chain = await db
      .select()
      .from(chainsTable)
      .where(eq(chainsTable.id, chainId))
      .limit(1);

    if (chain.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Chain not found' });
    }

    // Verify the chain belongs to the authenticated user
    if (chain[0].userId !== user[0].id) {
      return res
        .status(403)
        .json({
          success: false,
          message: 'Not authorized to queue this chain',
        });
    }

    let queue = await db
      .select()
      .from(queuesTable)
      .where(eq(queuesTable.userId, user[0].id))
      .limit(1);

    if (queue.length === 0) {
      queue = await db
        .insert(queuesTable)
        .values({
          userId: user[0].id,
        })
        .returning();
    }

    const chainSteps = await db
      .select()
      .from(chainStepsTable)
      .where(eq(chainStepsTable.chainId, chain[0].id));

    if (chainSteps.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Cannot queue chain with no steps' });
    }

    const queuedChain = await db
      .insert(queuedChainsTable)
      .values({
        name: chain[0].name,
        queueId: queue[0].id,
        chainId: chain[0].id,
        status: 'pending',
        userId: user[0].id,
      })
      .returning({ id: queuedChainsTable.id });

    await db.insert(queuedChainStepsTable).values(
      chainSteps.map((cs) => ({
        prompt: cs.prompt,
        position: cs.position,
        queuedChainId: queuedChain[0].id,
        chainStepId: cs.id,
        status: 'pending',
        userId: user[0].id,
      }))
    );

    const runningChains = await db
      .select()
      .from(queuedChainsTable)
      .where(eq(queuedChainsTable.status, 'running'));

    if (runningChains.length < 5) {
      console.debug(`found freed space while adding queuedChain(${queuedChain[0].id}) to queue. processing now`)
      fetch(
        `${process.env.HOST}/api/process-queued-chain?id=${queuedChain[0].id}`,
        {
          method: 'POST',
        }
      );
    }

    return res
      .status(200)
      .json({
        success: true,
        message: 'Successfully queued chain!',
        queuedChainId: queuedChain[0].id,
      });
  } catch (error) {
    console.error('Chain operation error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to process request' });
  }
}
