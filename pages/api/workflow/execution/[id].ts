import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { db } from "@/lib/db";
import { workflowExecutionsTable, workflowsTable, usersTable } from "@/schema";
import { eq, and } from "drizzle-orm";
import { isRateLimited } from "@/lib/rate-limit";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({
      success: false,
      message: "You must be signed in to access execution details"
    });
  }

  // Get client IP for rate limiting
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
  const clientIp = Array.isArray(ip) ? ip[0] : ip;

  const isLimited = await isRateLimited({
    key: `execution-details:${clientIp}`,
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 200
  });

  if (isLimited) {
    return res.status(429).json({
      success: false,
      message: "Rate limit exceeded. Please try again later."
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
  const executionId = parseInt(req.query.id as string, 10);

  if (isNaN(executionId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid execution ID"
    });
  }

  try {
    if (req.method === "GET") {
      // Get execution details with workflow info
      const [execution] = await db
        .select({
          execution: workflowExecutionsTable,
          workflow: {
            id: workflowsTable.id,
            name: workflowsTable.name,
            description: workflowsTable.description
          }
        })
        .from(workflowExecutionsTable)
        .innerJoin(workflowsTable, eq(workflowExecutionsTable.workflowId, workflowsTable.id))
        .where(and(
          eq(workflowExecutionsTable.id, executionId),
          eq(workflowExecutionsTable.userId, userId)
        ))
        .limit(1);

      if (!execution) {
        return res.status(404).json({
          success: false,
          message: "Execution not found"
        });
      }

      // Parse JSON data
      let inputData = null;
      let outputData = null;

      try {
        inputData = execution.execution.inputData ? JSON.parse(execution.execution.inputData) : null;
      } catch (e) {
        console.warn('Failed to parse inputData for execution', executionId, e);
      }

      try {
        outputData = execution.execution.outputData ? JSON.parse(execution.execution.outputData) : null;
      } catch (e) {
        console.warn('Failed to parse outputData for execution', executionId, e);
      }

      return res.status(200).json({
        success: true,
        execution: {
          id: execution.execution.id,
          workflowId: execution.execution.workflowId,
          status: execution.execution.status,
          inputData,
          outputData,
          error: execution.execution.error,
          startedAt: execution.execution.startedAt,
          completedAt: execution.execution.completedAt,
          createdAt: execution.execution.createdAt
        },
        workflow: execution.workflow
      });

    } else {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed`
      });
    }
  } catch (error) {
    console.error("Execution details API error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}