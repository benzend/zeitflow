import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { queuedChainStepsTable, chainStepsTable, queuedChainsTable } from '@/schema';
import { isRateLimited } from '@/lib/rate-limit';
import { and, eq, inArray } from 'drizzle-orm';
import { config } from 'dotenv';

config({ path: '.env.local' });

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
    const queuedChain = await db.select()
      .from(queuedChainsTable)
      .where(eq(queuedChainsTable.id, queuedChainId))
      .limit(1);

    // If the chain is not found, return a 404 error
    if (queuedChain.length === 0) {
      return res.status(404)
        .json({ success: false, message: 'Queued chain not found' });
    }

    // If the chain has already been completed, return a 400 error
    if (queuedChain[0].status === 'completed') {
      return res.status(400)
        .json({ success: false, message: 'Chain already completed' });
    }

    const processingChainSteps = await db.select()
      .from(queuedChainStepsTable)
      .where(and(
        eq(queuedChainStepsTable.queuedChainId, queuedChain[0].id),
        eq(queuedChainStepsTable.status, 'processing')
      ))

    // If there are already max of 5 running chain steps, return a 400 error
    if (processingChainSteps.length >= 5) {
      return res.status(400)
        .json({ success: false, message: 'Chain already running at max capacity' });
    }

    console.debug('processing chain steps count', processingChainSteps.length);

    // check for the non running queued chain steps to run next
    const queuedChainStepsNotRunning = await db.select()
      .from(queuedChainStepsTable)
      .where(and(
        eq(queuedChainStepsTable.status, 'pending'),
        eq(queuedChainStepsTable.queuedChainId, queuedChain[0].id),
      )).limit(5 - processingChainSteps.length);

    console.debug('queued chain steps not running count', queuedChainStepsNotRunning.length);

    // If there are no queued chain steps, mark the chain as completed and return a 200 status
    if (queuedChainStepsNotRunning.length === 0) {
      queuedChain[0].status = 'completed';
      await db.update(queuedChainsTable)
        .set({ status: 'completed' })
        .where(eq(queuedChainsTable.id, queuedChain[0].id));

      return res.status(200)
        .json({ success: true, message: 'Finished running chain steps' });
    }

    // Pull from the source of truth for the chain steps to pull out prompt and cycle data
    const chainSteps = await db.select()
      .from(chainStepsTable)
      .where(inArray(chainStepsTable.id, queuedChainStepsNotRunning.map(cs => cs.chainStepId)));

    console.debug('chain steps count', chainSteps.length);

    // Run the chain steps in parallel
    const promises = chainSteps.map(async (chainStep, index) => {
      const queuedChainStep = queuedChainStepsNotRunning[index];

      // Let the system know that the chain step is running (processing)
      await db.update(queuedChainStepsTable)
        .set({ status: 'processing' })
        .where(eq(queuedChainStepsTable.id, queuedChainStep.id));

      try {
        const response = await chat(chainStep.prompt);

        // Let the system know that the chain step is completed
        await db.update(queuedChainStepsTable)
          .set({ status: 'completed', response: response.choices[0].message.content })
          .where(eq(queuedChainStepsTable.id, queuedChainStep.id));

        console.debug('completed chain step created', queuedChainStep.id);

        // Recursively run the next chain step
        console.debug('starting next process');
        await fetch(`${process.env.HOST}/api/process-queued-chain?id=${queuedChain[0].id}`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Chain operation error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);

        await db.update(queuedChainStepsTable)
          .set({ status: 'error', error: errorMessage })
          .where(eq(queuedChainStepsTable.id, queuedChainStep.id));

        // Recursively keep the process running
        console.debug('starting next process');
        await fetch(`${process.env.HOST}/api/process-queued-chain?id=${queuedChain[0].id}`, {
          method: 'POST',
        });
      }
    });

    await Promise.all(promises).catch(async (error) => {
      console.error('uncaught error in Promise.all', error);

      // Stop the chain from running
      await db.update(queuedChainsTable)
        .set({ status: 'error', error: `Failed to run chain step: ${String(error)}` })
        .where(eq(queuedChainsTable.id, queuedChain[0].id));

      // Rethrow the error to be caught by the main catch block
      throw error;
    });

    console.debug('finished running chain steps');
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
      Authorization: 'Bearer ' + process.env.OPENROUTER_API_KEY,
      'HTTP-Referer': 'https://jjoist.com', // Optional. Site URL for rankings on openrouter.ai.
      'X-Title': 'jjoist', // Optional. Site title for rankings on openrouter.ai.
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

  if (response.status !== 200) {
    throw new Error(`OpenAI API returned an error: ${response.statusText}`);
  }

  return response.json();
}
