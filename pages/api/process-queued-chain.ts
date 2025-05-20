import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { queuedChainStepsTable, chainStepsTable, completedChainsTable, completedChainStepsTable, queuedChainsTable, responsesTable } from '@/schema';
import { isRateLimited } from '@/lib/rate-limit';
import { and, eq, inArray } from 'drizzle-orm';

type ResponseData = {
  success: boolean;
  message: string;
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

  // Get client IP for rate limiting
  const ip = req.headers['x-forwarded-for'] ||
    req.socket.remoteAddress ||
    'unknown-ip';

  const clientIp = Array.isArray(ip) ? ip[0] : ip;

  // Check rate limit (20 requests per IP address per hour)
  const isLimited = await isRateLimited({
    key: `process_chain:${clientIp}`,
    windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
    maxRequests: 20
  });

  if (isLimited) {
    return res
      .status(429)
      .json({ success: false, message: 'Too many requests. Please try again later.' });
  }

  try {
    const queuedChainId = req.query.id ? parseInt(req.query.id as string, 10) : null;

    if (!queuedChainId) {
      return res.status(400)
        .json({ success: false, message: 'Queued chain ID is required' });
    }

    // Get a specific chain
    const queuedChains = await db.select()
      .from(queuedChainsTable)
      .where(eq(queuedChainsTable.id, queuedChainId))
      .limit(1);

    // If the chain is not found, return a 404 error
    if (queuedChains.length === 0) {
      return res.status(404)
        .json({ success: false, message: 'Queued chain not found' });
    }

    const queuedChain = queuedChains[0];

    // Check if the chain has already been completed
    const completedChains = await db.select()
      .from(completedChainsTable)
      .where(eq(completedChainsTable.queuedChainId, queuedChain.id))
      .limit(1);

    // If the chain has already been completed, return a 400 error
    if (completedChains.length > 0) {
      return res.status(400)
        .json({ success: false, message: 'Chain already completed' });
    }

    const runningChainSteps = await db.select()
      .from(queuedChainStepsTable)
      .where(and(
        eq(queuedChainStepsTable.queuedChainId, queuedChain.id),
        eq(queuedChainStepsTable.status, 'running')
      )).limit(5);

    // If there are already max of 5 running chain steps, return a 400 error
    if (runningChainSteps.length >= 5) {
      return res.status(400)
        .json({ success: false, message: 'Chain already running at max capacity' });
    }

    const queuedChainSteps = await db.select()
      .from(queuedChainStepsTable)
      .where(and(
        eq(queuedChainStepsTable.queuedChainId, queuedChain.id),
        eq(queuedChainStepsTable.status, 'pending')
      )).limit(5);

    // If there are no queued chain steps, mark the chain as completed and return a 200 status
    if (queuedChainSteps.length === 0) {
      await db.insert(completedChainsTable).values({
        queuedChainId: queuedChain.id,
      })

      await db.update(queuedChainsTable)
        .set({ status: 'completed' })
        .where(eq(queuedChainsTable.id, queuedChain.id));

      return res.status(200)
        .json({ success: true, message: 'Finished running chain steps' });
    }

    const chainSteps = await db.select()
      .from(chainStepsTable)
      .where(inArray(chainStepsTable.id, queuedChainSteps.map(cs => cs.chainStepId)));

    const promises = chainSteps.map(async (chainStep, index) => {
      const queuedChainStep = queuedChainSteps[index];
      try {
        const response = await chat(chainStep.prompt);

        const completedChainSteps = await db.insert(completedChainStepsTable).values({
          queuedChainStepId: queuedChainStep.id,
        }).returning({ id: completedChainStepsTable.id });

        await db.insert(responsesTable).values({
          completedChainStepId: completedChainSteps[0].id,
          response: response.choices[0].message.content,
        })

        await db.update(queuedChainStepsTable)
          .set({ status: 'completed' })
          .where(eq(queuedChainStepsTable.id, queuedChainStep.id));

        // Recursively run the next chain step
        await fetch(`/api/process-chain?id=${queuedChain.id}`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Chain operation error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        await db.insert(completedChainStepsTable).values({
          queuedChainStepId: queuedChainStep.id,
          error: errorMessage
        })
      }
    });

    await Promise.all(promises).catch(async (error) => {
      // Stop the chain from running
      await db.insert(completedChainStepsTable).values({
        queuedChainStepId: queuedChainSteps[0].id,
        error: `Failed to run chain step: ${error}`
      })

      // Rethrow the error to be caught by the main catch block
      throw error;
    });

    await db.update(queuedChainsTable)
      .set({ status: 'running' })
      .where(eq(queuedChainsTable.id, queuedChainId));

    await db.update(queuedChainStepsTable)
      .set({ status: 'running' })
      .where(inArray(queuedChainStepsTable.id, queuedChainSteps.map(cs => cs.id)));

    return res.status(200)
      .json({ success: true, message: 'Successfully ran chain steps!' });

  } catch (error) {
    console.error('Chain operation error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to process request' });
  }
}

async function chat(prompt: string) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer <OPENROUTER_API_KEY>',
      'HTTP-Referer': '<YOUR_SITE_URL>', // Optional. Site URL for rankings on openrouter.ai.
      'X-Title': '<YOUR_SITE_NAME>', // Optional. Site title for rankings on openrouter.ai.
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  return response.json();
}
