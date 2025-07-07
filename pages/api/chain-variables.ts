import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { db } from "@/lib/db";
import { chainsTable, chainStepsTable, usersTable } from "@/schema";
import { extractVariablesFromPrompts } from "@/lib/variables";
import { eq } from "drizzle-orm";

type ResponseData = {
  success: boolean;
  message: string;
  variables?: string[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, session.user.email))
    .limit(1);

  if (user.length === 0) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const chainId = req.query.id ? parseInt(req.query.id as string, 10) : null;

    if (!chainId) {
      return res
        .status(400)
        .json({ success: false, message: "Chain ID is required" });
    }

    // Get the chain and verify ownership
    const chain = await db
      .select()
      .from(chainsTable)
      .where(eq(chainsTable.id, chainId))
      .limit(1);

    if (chain.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Chain not found" });
    }

    if (chain[0].userId !== user[0].id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this chain",
      });
    }

    // Get all chain steps
    const chainSteps = await db
      .select()
      .from(chainStepsTable)
      .where(eq(chainStepsTable.chainId, chain[0].id));

    // Extract variables from all prompts
    const allPrompts = chainSteps.map((step) => step.prompt);
    const variables = extractVariablesFromPrompts(allPrompts);

    return res.status(200).json({
      success: true,
      message: "Variables retrieved successfully",
      variables,
    });
  } catch (error) {
    console.error("Chain variables error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to get chain variables" });
  }
}
