import { db } from "@/lib/db";
import { workflowsTable, workflowNodesTable, workflowExecutionsTable } from "@/schema";
import { eq, sql } from "drizzle-orm";
import { apiHandler, sendError } from "@/lib/api-handler";
import { validationError } from "@/lib/errors";
import { generateWebhookSecret } from "@/lib/webhook-utils";

export default apiHandler({
  rateLimitKey: 'workflows',
  rateLimitMax: 100,

  GET: async (req, res, { userId }) => {
    const workflows = await db
      .select({
        id: workflowsTable.id,
        name: workflowsTable.name,
        description: workflowsTable.description,
        status: workflowsTable.status,
        executionCount: sql<number>`cast(count(${workflowExecutionsTable.id}) as int)`,
        createdAt: workflowsTable.createdAt,
        updatedAt: workflowsTable.updatedAt,
      })
      .from(workflowsTable)
      .where(eq(workflowsTable.userId, userId))
      .groupBy(workflowsTable.id)
      .orderBy(workflowsTable.updatedAt);

    return res.status(200).json({ success: true, workflows });
  },

  POST: async (req, res, { userId }) => {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return sendError(res, validationError('Workflow name is required'));
    }

    const [workflow] = await db
      .insert(workflowsTable)
      .values({
        userId,
        name: name.trim(),
        description: description?.trim() || null,
        status: 'draft',
        webhookSecret: generateWebhookSecret()
      })
      .returning();

    const entryNodeId = crypto.randomUUID();
    await db
      .insert(workflowNodesTable)
      .values({
        id: entryNodeId,
        workflowId: workflow.id,
        type: 'entry',
        positionX: 100,
        positionY: 100,
        label: 'Entry',
        entryType: 'api',
        config: JSON.stringify({})
      });

    return res.status(201).json({ success: true, workflow });
  },
});
