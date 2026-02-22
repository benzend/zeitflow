import { db } from "@/lib/db";
import { workflowsTable, workflowNodesTable, workflowConnectionsTable } from "@/schema";
import { eq, and } from "drizzle-orm";
import { apiHandler, sendError } from "@/lib/api-handler";
import { validationError, notFoundError } from "@/lib/errors";
import { serializeNodeConfigsToJSON } from "@/lib/node-utils";
import { ALL_CONFIG_KEYS } from "@/lib/node-registry";

async function resolveWorkflow(workflowId: number, userId: string) {
  if (isNaN(workflowId)) return null;

  const [workflow] = await db
    .select()
    .from(workflowsTable)
    .where(and(
      eq(workflowsTable.id, workflowId),
      eq(workflowsTable.userId, userId)
    ))
    .limit(1);

  return workflow ?? null;
}

export default apiHandler({
  rateLimitKey: 'workflow',
  rateLimitMax: 200,

  GET: async (req, res, { userId }) => {
    const workflowId = parseInt(req.query.id as string, 10);
    const workflow = await resolveWorkflow(workflowId, userId);

    if (!workflow) {
      return sendError(res, isNaN(workflowId) ? validationError('Invalid workflow ID') : notFoundError('Workflow'));
    }

    const nodes = await db
      .select()
      .from(workflowNodesTable)
      .where(eq(workflowNodesTable.workflowId, workflowId));

    const connections = await db
      .select()
      .from(workflowConnectionsTable)
      .where(eq(workflowConnectionsTable.workflowId, workflowId));

    return res.status(200).json({ success: true, workflow, nodes, connections });
  },

  PUT: async (req, res, { userId }) => {
    const workflowId = parseInt(req.query.id as string, 10);
    const workflow = await resolveWorkflow(workflowId, userId);

    if (!workflow) {
      return sendError(res, isNaN(workflowId) ? validationError('Invalid workflow ID') : notFoundError('Workflow'));
    }

    const { name, description, status } = req.body;

    const updateData: { name?: string; description?: string | null; status?: string } = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return sendError(res, validationError('No fields to update'));
    }

    await db.update(workflowsTable).set(updateData).where(eq(workflowsTable.id, workflowId));

    return res.status(200).json({ success: true, message: "Workflow updated successfully" });
  },

  POST: async (req, res, { userId }) => {
    const workflowId = parseInt(req.query.id as string, 10);
    const workflow = await resolveWorkflow(workflowId, userId);

    if (!workflow) {
      return sendError(res, isNaN(workflowId) ? validationError('Invalid workflow ID') : notFoundError('Workflow'));
    }

    const { nodes, connections } = req.body;

    if (!nodes || !Array.isArray(nodes)) {
      return sendError(res, validationError('Invalid nodes data'));
    }

    await db.transaction(async (tx) => {
      await tx.delete(workflowConnectionsTable).where(eq(workflowConnectionsTable.workflowId, workflowId));
      await tx.delete(workflowNodesTable).where(eq(workflowNodesTable.workflowId, workflowId));

      if (nodes.length > 0) {
        const nodeInserts = nodes.map((node: {
          id: string;
          type: string;
          x: number;
          y: number;
          label: string;
          entryType?: string;
          [key: string]: unknown;
        }) => {
          const config: Record<string, unknown> = {};
          if (node.fields) config.fields = node.fields;
          ALL_CONFIG_KEYS.forEach(configKey => {
            if (node[configKey]) config[configKey] = node[configKey];
          });

          return {
            id: node.id,
            workflowId,
            type: node.type,
            positionX: Math.round(node.x),
            positionY: Math.round(node.y),
            label: node.label,
            config: JSON.stringify(config),
            entryType: node.entryType
          };
        });

        await tx.insert(workflowNodesTable).values(nodeInserts);
      }

      if (connections && Array.isArray(connections) && connections.length > 0) {
        const connectionInserts = connections.map((conn: {
          from: string;
          to: string;
          sourceHandle?: string;
          targetHandle?: string;
        }) => ({
          workflowId,
          fromNodeId: conn.from,
          toNodeId: conn.to,
          sourceHandle: conn.sourceHandle || null,
          targetHandle: conn.targetHandle || null
        }));

        await tx.insert(workflowConnectionsTable).values(connectionInserts);
      }
    });

    return res.status(200).json({ success: true, message: "Workflow saved successfully" });
  },

  DELETE: async (req, res, { userId }) => {
    const workflowId = parseInt(req.query.id as string, 10);
    const workflow = await resolveWorkflow(workflowId, userId);

    if (!workflow) {
      return sendError(res, isNaN(workflowId) ? validationError('Invalid workflow ID') : notFoundError('Workflow'));
    }

    await db.transaction(async (tx) => {
      await tx.delete(workflowConnectionsTable).where(eq(workflowConnectionsTable.workflowId, workflowId));
      await tx.delete(workflowNodesTable).where(eq(workflowNodesTable.workflowId, workflowId));
      await tx.delete(workflowsTable).where(eq(workflowsTable.id, workflowId));
    });

    return res.status(200).json({ success: true, message: "Workflow deleted successfully" });
  },
});
