import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { queuedChainStepsTable, chainStepsTable, completedChainsTable, completedChainStepsTable, queuedChainsTable, responsesTable, processingChainsTable, processingChainStepsTable } from '@/schema';
import { isRateLimited } from '@/lib/rate-limit';
import { and, eq, inArray, notInArray } from 'drizzle-orm';

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

    const processingChains = await db.select()
      .from(processingChainsTable)
      .where(eq(processingChainsTable.queuedChainId, queuedChain.id))
      .limit(1);

    // need processing chain to check for completed chain
    if (processingChains.length > 0) {
      const completedChains = await db.select()
        .from(completedChainsTable)
        .where(eq(completedChainsTable.processingChainId, processingChains[0].id))
        .limit(1);

      // If the chain has already been completed, return a 400 error
      if (completedChains.length > 0) {
        return res.status(400)
          .json({ success: false, message: 'Chain already completed' });
      }
    } else {
      // If the process hasn't been setup yet, let the system know by creating a processing chain
      await db.insert(processingChainsTable).values({
        queuedChainId: queuedChain.id,
      })
    }

    const processingChainSteps = await db.select()
      .from(processingChainStepsTable)
      .where(eq(processingChainStepsTable.queuedChainStepId, queuedChain.id))
      .limit(5);

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
        notInArray(queuedChainStepsTable.id, processingChainSteps.map(cs => cs.id)),
        eq(queuedChainStepsTable.queuedChainId, queuedChain.id),
      )).limit(5 - processingChainSteps.length);

    console.debug('queued chain steps not running count', queuedChainStepsNotRunning.length);

    // If there are no queued chain steps, mark the chain as completed and return a 200 status
    if (queuedChainStepsNotRunning.length === 0) {
      await db.insert(completedChainsTable).values({
        processingChainId: processingChains[0].id,
      })

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
      const processingChainStep = await db.insert(processingChainStepsTable).values({
        queuedChainStepId: queuedChainStep.id,
      }).returning({ id: processingChainStepsTable.id });

      try {
        const response = await chat(chainStep.prompt);

        // Let the system know that the chain step is completed
        const completedChainSteps = await db.insert(completedChainStepsTable).values({
          processingChainStepsId: processingChainStep[0].id,
        }).returning({ id: completedChainStepsTable.id });

        console.debug('completed chain step created', completedChainSteps[0].id);

        await db.insert(responsesTable).values({
          completedChainStepId: completedChainSteps[0].id,
          response: response.choices[0].message.content,
        })

        console.debug('response created', response.choices[0].message.content);

        // Recursively run the next chain step
        console.debug('starting next process');
        await fetch(`${process.env.HOST}/api/process-queued-chain?id=${queuedChain.id}`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Chain operation error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);

        await db.insert(completedChainStepsTable).values({
          processingChainStepsId: processingChainStep[0].id,
          error: errorMessage
        })

        console.debug('completed chain step error', errorMessage);

        // Recursively keep the process running
        console.debug('starting next process');
        await fetch(`${process.env.HOST}/api/process-queued-chain?id=${queuedChain.id}`, {
          method: 'POST',
        });
      }
    });

    await Promise.all(promises).catch(async (error) => {
      console.error('uncaught error in Promise.all', error);

      // Stop the chain from running
      await db.insert(completedChainsTable).values({
        processingChainId: processingChains[0].id,
        error: `Failed to run chain step: ${String(error)}`
      })

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
      Authorization: 'Bearer <OPENROUTER_API_KEY>',
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
