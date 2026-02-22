import { db } from "@/lib/db";
import { workflowExecutionsTable, workflowsTable } from "@/schema";
import { eq, and, desc } from "drizzle-orm";
import { apiHandler, sendError } from "@/lib/api-handler";
import { validationError, notFoundError } from "@/lib/errors";

export default apiHandler({
  rateLimitKey: 'workflow-stats',
  rateLimitMax: 200,

  GET: async (req, res, { userId }) => {
    const workflowId = parseInt(req.query.id as string, 10);

    if (isNaN(workflowId)) {
      return sendError(res, validationError('Invalid workflow ID'));
    }

    const [workflow] = await db
      .select()
      .from(workflowsTable)
      .where(and(
        eq(workflowsTable.id, workflowId),
        eq(workflowsTable.userId, userId)
      ))
      .limit(1);

    if (!workflow) {
      return sendError(res, notFoundError('Workflow'));
    }

    const executions = await db
      .select()
      .from(workflowExecutionsTable)
      .where(eq(workflowExecutionsTable.workflowId, workflowId))
      .orderBy(desc(workflowExecutionsTable.createdAt));

    const totalExecutions = executions.length;
    const completedExecutions = executions.filter(e => e.status === 'completed');
    const failedExecutions = executions.filter(e => e.status === 'failed');

    let averageDuration = 0;
    if (completedExecutions.length > 0) {
      const durations = completedExecutions
        .filter(e => e.startedAt && e.completedAt)
        .map(e => Math.abs(new Date(e.startedAt!).getTime() - new Date(e.completedAt!).getTime()));
      if (durations.length > 0) {
        averageDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
      }
    }

    const recentExecutions = executions.slice(0, 10).map(execution => ({
      id: execution.id,
      status: execution.status,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      error: execution.error,
      duration: execution.startedAt && execution.completedAt
        ? Math.abs(new Date(execution.startedAt).getTime() - new Date(execution.completedAt).getTime())
        : null,
      url: `/workflow/execution/${execution.id}`
    }));

    return res.status(200).json({
      success: true,
      stats: {
        totalExecutions,
        completedExecutions: completedExecutions.length,
        failedExecutions: failedExecutions.length,
        averageDuration,
        successRate: totalExecutions > 0 ? (completedExecutions.length / totalExecutions) * 100 : 0
      },
      recentExecutions
    });
  },
});
