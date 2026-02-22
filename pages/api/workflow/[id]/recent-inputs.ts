import { db } from "@/lib/db";
import { workflowExecutionsTable, workflowsTable } from "@/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { apiHandler, sendError } from "@/lib/api-handler";
import { validationError, notFoundError } from "@/lib/errors";

export default apiHandler({
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
      .limit(50);

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
        const inputHash = JSON.stringify(inputData);

        if (!seen.has(inputHash)) {
          seen.add(inputHash);
          uniqueInputs.push({
            executionId: execution.id,
            inputData,
            startedAt: execution.startedAt.toISOString(),
            status: execution.status,
          });
        }

        if (uniqueInputs.length >= 10) break;
      } catch {
        continue;
      }
    }

    return res.status(200).json({
      success: true,
      recentInputs: uniqueInputs
    });
  },
});
