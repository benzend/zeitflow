import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { generateAiDescription } from '@/pages/api/chain-step';
import { db } from '@/lib/db';
import { 
  chainsTable, 
  chainStepsTable, 
  queuedChainStepsTable, 
  queuedChainsTable, 
  SelectQueuedChainVariables,
  usersTable, 
  queuedChainVariablesTable
} from '@/schema';
import { isRateLimited } from '@/lib/rate-limit';
import { eq } from 'drizzle-orm';

type QueuedChainStepWithDetails = {
  id: number;
  queuedChainId: number;
  chainStepId: number;
  position: number;
  response: string | null;
  aiDescription: string | null;
  status: string;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
  prompt: string;
  cycleCount: number;
};

type ResponseData = {
  success: boolean;
  message: string;
  queuedChain?: {
    id: number;
    chainId: number;
    status: string;
    error: string | null;
    createdAt: Date;
    updatedAt: Date;
    chainName: string | null;
  };
  queuedChainSteps?: QueuedChainStepWithDetails[];
  queuedChainVariables?: SelectQueuedChainVariables[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
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

  // Check rate limit
  const isLimited = await isRateLimited({
    key: `results:${clientIp}`,
    windowMs: 60 * 1000, // 1 minute in milliseconds
    maxRequests: 1000
  });

  if (isLimited) {
    return res
      .status(429)
      .json({ success: false, message: 'Too many requests. Please try again later.' });
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
    const queuedChainId = req.query.id ? parseInt(req.query.id as string, 10) : null;

    if (!queuedChainId) {
      return res.status(400)
        .json({ success: false, message: 'Queued chain ID is required' });
    }

    // Get the queued chain with chain details
    const queuedChain = await db
      .select({
        id: queuedChainsTable.id,
        chainId: queuedChainsTable.chainId,
        status: queuedChainsTable.status,
        error: queuedChainsTable.error,
        createdAt: queuedChainsTable.createdAt,
        updatedAt: queuedChainsTable.updatedAt,
        chainName: chainsTable.name,
        chainUserId: chainsTable.userId,
      })
      .from(queuedChainsTable)
      .innerJoin(chainsTable, eq(queuedChainsTable.chainId, chainsTable.id))
      .where(eq(queuedChainsTable.id, queuedChainId))
      .limit(1);

    if (queuedChain.length === 0) {
      return res.status(404)
        .json({ success: false, message: 'Queued chain not found' });
    }

    // Check if user owns this chain
    if (queuedChain[0].chainUserId !== user[0].id) {
      return res.status(403)
        .json({ success: false, message: 'Not authorized to view this chain' });
    }

    // Get all queued chain steps with their original prompts
    const queuedChainSteps = await db
      .select({
        id: queuedChainStepsTable.id,
        queuedChainId: queuedChainStepsTable.queuedChainId,
        chainStepId: queuedChainStepsTable.chainStepId,
        response: queuedChainStepsTable.response,
        position: queuedChainStepsTable.position,
        status: queuedChainStepsTable.status,
        aiDescription: queuedChainStepsTable.aiDescription,
        model: queuedChainStepsTable.model,
        error: queuedChainStepsTable.error,
        createdAt: queuedChainStepsTable.createdAt,
        updatedAt: queuedChainStepsTable.updatedAt,
        prompt: chainStepsTable.prompt,
        cycleCount: chainStepsTable.cycleCount,
      })
      .from(queuedChainStepsTable)
      .innerJoin(chainStepsTable, eq(queuedChainStepsTable.chainStepId, chainStepsTable.id))
      .where(eq(queuedChainStepsTable.queuedChainId, queuedChainId))
      .orderBy(queuedChainStepsTable.position);

    if (queuedChainSteps.length > 0 && queuedChainSteps.some((step) => step.aiDescription === null)) {
      await Promise.all(queuedChainSteps.map(async (step) => {
        step.aiDescription = await generateAiDescription(step.prompt);
        await db.update(queuedChainStepsTable)
          .set({ aiDescription: step.aiDescription })
          .where(eq(queuedChainStepsTable.id, step.id));
      }));
    }

    const queuedChainVariables = await db
      .select({
        variableName: queuedChainVariablesTable.variableName,
        variableValue: queuedChainVariablesTable.variableValue,
      })
      .from(queuedChainVariablesTable)
      .where(eq(queuedChainVariablesTable.queuedChainId, queuedChainId))
      .orderBy(queuedChainVariablesTable.variableName);

    return res.status(200).json({
      success: true,
      message: 'Successfully retrieved results!',
      queuedChain: {
        id: queuedChain[0].id,
        chainId: queuedChain[0].chainId,
        status: queuedChain[0].status,
        error: queuedChain[0].error,
        createdAt: queuedChain[0].createdAt,
        updatedAt: queuedChain[0].updatedAt,
        chainName: queuedChain[0].chainName,
      },
      queuedChainSteps: queuedChainSteps as QueuedChainStepWithDetails[],
      queuedChainVariables: queuedChainVariables as SelectQueuedChainVariables[],
    });

  } catch (error) {
    console.error('Results operation error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to process request' });
  }
}
