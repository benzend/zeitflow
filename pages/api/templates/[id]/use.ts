import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { db } from "@/lib/db";
import {
  workflowTemplatesTable,
  usersTable,
  workflowsTable,
  workflowNodesTable,
  workflowConnectionsTable,
} from "@/schema";
import { eq, and } from "drizzle-orm";
import { isRateLimited } from "@/lib/rate-limit";
import { cloneWorkflow } from "@/lib/template-utils";
import { NodeData, Connection } from "@/lib/workflow-types";
import { generateWebhookSecret } from "@/lib/webhook-utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  let userId: string | null = null;

  // Support both session auth and API token auth (for CLI/MCP)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const apiToken = authHeader.substring(7);
    const tokenUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.apiToken, apiToken))
      .limit(1);
    if (tokenUser.length > 0) {
      userId = tokenUser[0].id;
    }
  } else {
    const session = await getServerSession(req, res, authOptions);
    if (session?.user?.email) {
      const sessionUser = await db.select()
        .from(usersTable)
        .where(eq(usersTable.email, session.user.email))
        .limit(1);
      if (sessionUser.length > 0) {
        userId = sessionUser[0].id;
      }
    }
  }

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "You must be signed in to use templates"
    });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      message: "Invalid template ID"
    });
  }

  const templateId = parseInt(id, 10);

  if (isNaN(templateId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid template ID"
    });
  }

  // Get client IP for rate limiting
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
  const clientIp = Array.isArray(ip) ? ip[0] : ip;

  const isLimited = await isRateLimited({
    key: `template-use:${clientIp}`,
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50
  });

  if (isLimited) {
    return res.status(429).json({
      success: false,
      message: "Rate limit exceeded. Please try again later."
    });
  }

  try {
    // Get template
    const templates = await db
      .select()
      .from(workflowTemplatesTable)
      .where(eq(workflowTemplatesTable.id, templateId))
      .limit(1);

    if (templates.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Template not found"
      });
    }

    const template = templates[0];

    // Check access permissions
    if (template.visibility === 'private' && template.authorId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this template"
      });
    }

    // Get workflow name from request or use template name
    const { workflowName } = req.body;
    const finalWorkflowName = workflowName?.trim() || template.name;

    // Parse template nodes and connections
    const templateNodes: NodeData[] = JSON.parse(template.nodes);
    const templateConnections: Connection[] = JSON.parse(template.connections);

    // Clone workflow with new IDs
    const { nodes: clonedNodes, connections: clonedConnections } = cloneWorkflow(
      templateNodes,
      templateConnections
    );

    // Create new workflow
    const [workflow] = await db
      .insert(workflowsTable)
      .values({
        userId,
        name: finalWorkflowName,
        description: template.description,
        status: 'draft',
        webhookSecret: generateWebhookSecret(),
      })
      .returning();

    // Insert nodes
    const nodeInsertPromises = clonedNodes.map(node => {
      const { id, type, x, y, label, entryType, ...config } = node;

      return db.insert(workflowNodesTable).values({
        id: id,
        workflowId: workflow.id,
        type: type,
        positionX: x,
        positionY: y,
        label: label,
        entryType: entryType || null,
        config: Object.keys(config).length > 0 ? JSON.stringify(config) : null,
      });
    });

    await Promise.all(nodeInsertPromises);

    // Insert connections
    const connectionInsertPromises = clonedConnections.map(conn =>
      db.insert(workflowConnectionsTable).values({
        workflowId: workflow.id,
        fromNodeId: conn.from,
        toNodeId: conn.to,
        sourceHandle: conn.sourceHandle || null,
        targetHandle: conn.targetHandle || null,
      })
    );

    await Promise.all(connectionInsertPromises);

    // Update template usage stats
    await db
      .update(workflowTemplatesTable)
      .set({
        useCount: template.useCount + 1,
        lastUsedAt: new Date(),
      })
      .where(eq(workflowTemplatesTable.id, templateId));

    return res.status(201).json({
      success: true,
      workflow: {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        status: workflow.status,
      },
      message: "Workflow created successfully from template"
    });
  } catch (error) {
    console.error("Template use API error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create workflow from template"
    });
  }
}
