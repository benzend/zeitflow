import { db } from "@/lib/db";
import { workflowExecutionsTable, workflowsTable } from "@/schema";
import { eq, and } from "drizzle-orm";
import { apiHandler, sendError } from "@/lib/api-handler";
import { validationError, notFoundError } from "@/lib/errors";

export default apiHandler({
  rateLimitKey: 'execution-details',
  rateLimitMax: 200,

  GET: async (req, res, { userId }) => {
    const executionId = parseInt(req.query.id as string, 10);

    if (isNaN(executionId)) {
      return sendError(res, validationError('Invalid execution ID'));
    }

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
      return sendError(res, notFoundError('Execution'));
    }

    let inputData = null;
    let outputData = null;
    let logs = null;

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

    try {
      logs = execution.execution.logs ? JSON.parse(execution.execution.logs) : null;
    } catch (e) {
      console.warn('Failed to parse logs for execution', executionId, e);
    }

    return res.status(200).json({
      success: true,
      execution: {
        id: execution.execution.id,
        workflowId: execution.execution.workflowId,
        status: execution.execution.status,
        inputData,
        outputData,
        logs,
        error: execution.execution.error,
        startedAt: execution.execution.startedAt,
        completedAt: execution.execution.completedAt,
        createdAt: execution.execution.createdAt
      },
      workflow: execution.workflow
    });
  },
});
