import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { db } from "@/lib/db";
import { workflowsTable, usersTable, workflowExecutionsTable, workflowNodesTable } from "@/schema";
import { eq, sql } from "drizzle-orm";
import { isRateLimited } from "@/lib/rate-limit";

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
    key: `workflows:${clientIp}`,
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100
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

  try {
    if (req.method === "GET") {
      // Get all workflows for the user
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

      return res.status(200).json({ 
        success: true, 
        workflows 
      });

    } else if (req.method === "POST") {
      // Create a new workflow
      const { name, description } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ 
          success: false, 
          message: "Workflow name is required" 
        });
      }

      const [workflow] = await db
        .insert(workflowsTable)
        .values({
          userId,
          name: name.trim(),
          description: description?.trim() || null,
          status: 'draft'
        })
        .returning();

      // Create default entry node
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

      return res.status(201).json({ 
        success: true, 
        workflow 
      });

    } else {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).json({ 
        success: false, 
        message: `Method ${req.method} not allowed` 
      });
    }
  } catch (error) {
    console.error("Workflows API error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
}
