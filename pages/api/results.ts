import { db } from '@/lib/db';
import {
  chainsTable,
  chainStepsTable,
  queuedChainStepsTable,
  queuedChainsTable,
  SelectQueuedChainVariables,
  queuedChainVariablesTable
} from '@/schema';
import { eq } from 'drizzle-orm';
import { generateAiDescription } from '@/pages/api/chain-step';
import { apiHandler, sendError } from '@/lib/api-handler';
import { validationError, notFoundError, authorizationError } from '@/lib/errors';

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

export default apiHandler({
  rateLimitKey: 'results',
  rateLimitWindowMs: 60 * 1000,
  rateLimitMax: 1000,

  GET: async (req, res, { userId }) => {
    const queuedChainId = req.query.id ? parseInt(req.query.id as string, 10) : null;

    if (!queuedChainId) {
      return sendError(res, validationError('Queued chain ID is required'));
    }

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
      return sendError(res, notFoundError('Queued chain'));
    }

    if (queuedChain[0].chainUserId !== userId) {
      return sendError(res, authorizationError('Not authorized to view this chain'));
    }

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
  },
});
