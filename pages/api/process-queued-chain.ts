import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { queuedChainStepsTable, queuedChainsTable } from "@/schema";
import { isRateLimited } from "@/lib/rate-limit";
import { substituteVariables } from "@/lib/variables";
import { and, asc, eq } from "drizzle-orm";
import { config } from "dotenv";
import { chat } from "./utils/openrouter";

config({ path: ".env.local" });

type ResponseData = {
  success: boolean;
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  // Get client IP for rate limiting
  const ip =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown-ip";

  const clientIp = Array.isArray(ip) ? ip[0] : ip;

  // Check rate limit (20 requests per IP address per hour)
  const isLimited = await isRateLimited({
    key: `process_chain:${clientIp}`,
    windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
    maxRequests: 100,
  });

  if (isLimited) {
    return res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  }

  try {
    const queuedChainId = req.query.id
      ? parseInt(req.query.id as string, 10)
      : null;

    if (!queuedChainId) {
      return res
        .status(400)
        .json({ success: false, message: "Queued chain ID is required" });
    }

    // Get a specific chain
    const queuedChain = await db
      .select()
      .from(queuedChainsTable)
      .where(eq(queuedChainsTable.id, queuedChainId))
      .limit(1);

    // If the chain is not found, return a 404 error
    if (queuedChain.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Queued chain not found" });
    }

    // If the chain has already been completed, return a 400 error
    if (queuedChain[0].status === "completed") {
      return res
        .status(400)
        .json({ success: false, message: "Chain already completed" });
    }

    if (queuedChain[0].status === "stopped") {
      return res
        .status(400)
        .json({ success: false, message: "Chain has been manually stopped" });
    }

    const processingChainSteps = await db
      .select()
      .from(queuedChainStepsTable)
      .where(
        and(
          eq(queuedChainStepsTable.queuedChainId, queuedChain[0].id),
          eq(queuedChainStepsTable.status, "processing"),
        ),
      )
      .orderBy(queuedChainStepsTable.position);

    // If there are already max of 5 running chain steps, return a 400 error
    if (processingChainSteps.length >= 5) {
      return res.status(400).json({
        success: false,
        message: "Chain already running at max capacity",
      });
    }

    // check for the non running queued chain steps to run next
    const queuedChainStepsNotRunning = await db
      .select()
      .from(queuedChainStepsTable)
      .where(
        and(
          eq(queuedChainStepsTable.status, "pending"),
          eq(queuedChainStepsTable.queuedChainId, queuedChain[0].id),
        ),
      )
      .orderBy(queuedChainStepsTable.position)
      .limit(1);

    // If there are no queued chain steps, mark the chain as completed and return a 200 status
    if (queuedChainStepsNotRunning.length === 0) {
      queuedChain[0].status = "completed";
      await db
        .update(queuedChainsTable)
        .set({ status: "completed" })
        .where(eq(queuedChainsTable.id, queuedChain[0].id));

      // Since this queued chain is completed, we can check if there are any queued chains that are next in line
      const queuedChains = await db
        .select()
        .from(queuedChainsTable)
        .where(eq(queuedChainsTable.status, "pending"))
        // we should check the oldest queued chain first
        .orderBy(asc(queuedChainsTable.createdAt))
        .limit(1);

      if (queuedChains.length > 0) {
        console.debug("found next queued chain", queuedChains[0].id);
        fetch(
          `${process.env.HOST}/api/process-queued-chain?id=${queuedChains[0].id}`,
          {
            method: "POST",
          },
        );
      } else {
        console.debug("no next queued chain found");
      }

      return res
        .status(200)
        .json({ success: true, message: "Finished running chain steps" });
    }

    if (queuedChain[0].status !== "processing") {
      queuedChain[0].status = "processing";
      await db
        .update(queuedChainsTable)
        .set({ status: "processing" })
        .where(eq(queuedChainsTable.id, queuedChain[0].id));
    }

    const queuedChainStep = queuedChainStepsNotRunning[0];

    // Let the system know that the chain step is running (processing)
    await db
      .update(queuedChainStepsTable)
      .set({ status: "processing" })
      .where(eq(queuedChainStepsTable.id, queuedChainStep.id));

    try {
      // Substitute variables in the prompt
      const processedPrompt = await substituteVariables(
        queuedChainStep.prompt,
        queuedChainStep.queuedChainId,
        queuedChainStep.id
      );

      const { text: response } = await chat(
        processedPrompt,
        queuedChainStep.model,
      );

      // Let the system know that the chain step is completed
      await db
        .update(queuedChainStepsTable)
        .set({
          status: "completed",
          response: response,
        })
        .where(eq(queuedChainStepsTable.id, queuedChainStep.id));

      console.debug("completed chain step created", queuedChainStep.id);

      // Recursively run the next chain step
      console.debug("starting next process");
      fetch(
        `${process.env.HOST}/api/process-queued-chain?id=${queuedChain[0].id}`,
        {
          method: "POST",
        },
      );
    } catch (error) {
      console.error("Chain operation error:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      await db
        .update(queuedChainStepsTable)
        .set({ status: "error", error: errorMessage })
        .where(eq(queuedChainStepsTable.id, queuedChainStep.id));

      // Recursively keep the process running
      console.debug("starting next process");
      await fetch(
        `${process.env.HOST}/api/process-queued-chain?id=${queuedChain[0].id}`,
        {
          method: "POST",
        },
      );
    }

    console.debug("finished running chain steps");
    return res
      .status(200)
      .json({ success: true, message: "Successfully ran chain steps!" });
  } catch (error) {
    console.error("Chain operation error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to process request" });
  }
}
