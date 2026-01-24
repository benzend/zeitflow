import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { db } from "@/lib/db";
import { workflowExecutionsTable, workflowsTable, usersTable } from "@/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed`
    });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({
      success: false,
      message: "You must be signed in to access recent inputs"
    });
  }

  // Get user from database
  const user = await db.select()
    .from(usersTable)
    .where(eq(usersTable.email, session.user.email))
    .limit(1);

  if (user.length === 0) {
    return res.status(401).json({
      success: false,
      message: "User not found"
    });
  }

  const userId = user[0].id;
  const workflowId = parseInt(req.query.id as string, 10);

  if (isNaN(workflowId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid workflow ID"
    });
  }

  // Verify workflow exists and belongs to user
  const [workflow] = await db
    .select()
    .from(workflowsTable)
    .where(and(
      eq(workflowsTable.id, workflowId),
      eq(workflowsTable.userId, userId)
    ))
    .limit(1);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      message: "Workflow not found"
    });
  }

  try {
    // Get recent executions with input data
    const executions = await db
      .select({
        id: workflowExecutionsTable.id,
        inputData: workflowExecutionsTable.inputData,
        startedAt: workflowExecutionsTable.startedAt,
        status: workflowExecutionsTable.status,
      })
      .from(workflowExecutionsTable)
      .where(and(
        eq(workflowExecutionsTable.workflowId, workflowId),
        inArray(workflowExecutionsTable.status, ['completed', 'failed'])
      ))
      .orderBy(desc(workflowExecutionsTable.startedAt))
      .limit(50); // Fetch more to allow for deduplication

    // Deduplicate by inputData content
    const seen = new Set<string>();
    const uniqueInputs: Array<{
      executionId: number;
      inputData: Record<string, unknown>;
      startedAt: string;
      status: string;
    }> = [];

    for (const execution of executions) {
      if (!execution.inputData) continue;

      try {
        const inputData = JSON.parse(execution.inputData);
        const inputHash = JSON.stringify(inputData); // Simple hash via JSON stringification

        if (!seen.has(inputHash)) {
          seen.add(inputHash);
          uniqueInputs.push({
            executionId: execution.id,
            inputData,
            startedAt: execution.startedAt.toISOString(),
            status: execution.status,
          });
        }

        // Stop after 10 unique inputs
        if (uniqueInputs.length >= 10) break;
      } catch {
        // Skip invalid JSON
        continue;
      }
    }

    return res.status(200).json({
      success: true,
      recentInputs: uniqueInputs
    });

  } catch (error) {
    console.error("Recent inputs API error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}
