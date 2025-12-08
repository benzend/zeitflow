import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { db } from "@/lib/db";
import { workflowExecutionsTable, workflowsTable, usersTable } from "@/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { isRateLimited } from "@/lib/rate-limit";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({
      success: false,
      message: "You must be signed in to access workflow stats"
    });
  }

  // Get client IP for rate limiting
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
  const clientIp = Array.isArray(ip) ? ip[0] : ip;

  const isLimited = await isRateLimited({
    key: `workflow-stats:${clientIp}`,
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
    if (req.method === "GET") {
      // Get execution statistics
      const executions = await db
        .select()
        .from(workflowExecutionsTable)
        .where(eq(workflowExecutionsTable.workflowId, workflowId))
        .orderBy(desc(workflowExecutionsTable.createdAt));

      // Calculate statistics
      const totalExecutions = executions.length;
      const completedExecutions = executions.filter(e => e.status === 'completed');
      const failedExecutions = executions.filter(e => e.status === 'failed');

      // Calculate average duration for completed executions
      let averageDuration = 0;
      if (completedExecutions.length > 0) {
        const durations = completedExecutions
          .filter(e => e.startedAt && e.completedAt)
          .map(e => new Date(e.startedAt!).getTime() - new Date(e.completedAt!).getTime());
        if (durations.length > 0) {
          averageDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
        }
      }

      // Get recent executions (last 10)
      const recentExecutions = executions.slice(0, 10).map(execution => ({
        id: execution.id,
        status: execution.status,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        error: execution.error,
        duration: execution.startedAt && execution.completedAt
          ? new Date(execution.startedAt).getTime() - new Date(execution.completedAt).getTime()
          : null
      }));

      return res.status(200).json({
        success: true,
        stats: {
          totalExecutions,
          completedExecutions: completedExecutions.length,
          failedExecutions: failedExecutions.length,
          averageDuration, // in milliseconds
          successRate: totalExecutions > 0 ? (completedExecutions.length / totalExecutions) * 100 : 0
        },
        recentExecutions
      });

    } else {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed`
      });
    }
  } catch (error) {
    console.error("Workflow stats API error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}
