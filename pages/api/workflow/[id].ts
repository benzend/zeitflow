import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { db } from "@/lib/db";
import { workflowsTable, workflowNodesTable, workflowConnectionsTable, usersTable } from "@/schema";
import { eq, and } from "drizzle-orm";
import { isRateLimited } from "@/lib/rate-limit";
import { serializeNodeConfigsToJSON } from "@/lib/node-utils";
import { ALL_CONFIG_KEYS } from "@/lib/node-registry";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ 
      success: false, 
      message: "You must be signed in to access workflows" 
    });
  }

  // Get client IP for rate limiting
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
  const clientIp = Array.isArray(ip) ? ip[0] : ip;

  const isLimited = await isRateLimited({
    key: `workflow:${clientIp}`,
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
      // Get workflow with nodes and connections
      const nodes = await db
        .select()
        .from(workflowNodesTable)
        .where(eq(workflowNodesTable.workflowId, workflowId));

      const connections = await db
        .select()
        .from(workflowConnectionsTable)
        .where(eq(workflowConnectionsTable.workflowId, workflowId));

      return res.status(200).json({ 
        success: true, 
        workflow,
        nodes,
        connections
      });

    } else if (req.method === "PUT") {
      // Update workflow name/description
      const { name, description, status } = req.body;

      const updateData: {
        name?: string;
        description?: string | null;
        status?: string;
      } = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (status) updateData.status = status;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "No fields to update" 
        });
      }

      await db
        .update(workflowsTable)
        .set(updateData)
        .where(eq(workflowsTable.id, workflowId));

      return res.status(200).json({ 
        success: true, 
        message: "Workflow updated successfully" 
      });

    } else if (req.method === "POST") {
      // Save workflow nodes and connections
      const { nodes, connections } = req.body;

      if (!nodes || !Array.isArray(nodes)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid nodes data" 
        });
      }

      // Start transaction - delete existing nodes/connections and insert new ones
      await db.transaction(async (tx) => {
        // Delete existing connections first (foreign key constraint)
        await tx.delete(workflowConnectionsTable)
          .where(eq(workflowConnectionsTable.workflowId, workflowId));

        // Delete existing nodes
        await tx.delete(workflowNodesTable)
          .where(eq(workflowNodesTable.workflowId, workflowId));

        // Insert new nodes
        if (nodes.length > 0) {
          const nodeInserts = nodes.map((node: {
            id: string;
            type: string;
            x: number;
            y: number;
            label: string;
            entryType?: string;
            [key: string]: unknown; // Allow any config properties
          }) => {
            // Build config object with all possible configs automatically
            const config: Record<string, unknown> = {};

            // Add fields for entry nodes
            if (node.fields) {
              config.fields = node.fields;
            }

            // Add all config types from registry
            ALL_CONFIG_KEYS.forEach(configKey => {
              if (node[configKey]) {
                config[configKey] = node[configKey];
              }
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

        // Insert new connections
        if (connections && Array.isArray(connections) && connections.length > 0) {
          const connectionInserts = connections.map((conn: {
            from: string;
            to: string;
          }) => ({
            workflowId,
            fromNodeId: conn.from,
            toNodeId: conn.to
          }));

          await tx.insert(workflowConnectionsTable).values(connectionInserts);
        }
      });

      return res.status(200).json({ 
        success: true, 
        message: "Workflow saved successfully" 
      });

    } else if (req.method === "DELETE") {
      // Delete workflow and all related data
      await db.transaction(async (tx) => {
        // Delete connections first
        await tx.delete(workflowConnectionsTable)
          .where(eq(workflowConnectionsTable.workflowId, workflowId));

        // Delete nodes
        await tx.delete(workflowNodesTable)
          .where(eq(workflowNodesTable.workflowId, workflowId));

        // Delete workflow
        await tx.delete(workflowsTable)
          .where(eq(workflowsTable.id, workflowId));
      });

      return res.status(200).json({
        success: true,
        message: "Workflow deleted successfully"
      });

      return res.status(200).json({
        success: true,
        message: "Workflow deleted successfully"
      });

    } else {
      res.setHeader("Allow", ["GET", "PUT", "POST", "DELETE"]);
      return res.status(405).json({ 
        success: false, 
        message: `Method ${req.method} not allowed` 
      });
    }
  } catch (error) {
    console.error("Workflow API error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
}
