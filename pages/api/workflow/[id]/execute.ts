import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { db } from "@/lib/db";
import { workflowsTable, workflowNodesTable, workflowConnectionsTable, workflowExecutionsTable, usersTable } from "@/schema";
import { eq, and } from "drizzle-orm";
import { CalendarService } from "@/lib/calendar";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await db.select()
    .from(usersTable)
    .where(eq(usersTable.email, session.user.email))
    .limit(1);

  if (user.length === 0) {
    return res.status(401).json({ error: 'User not found' });
  }

  const userId = user[0].id;
  const workflowId = parseInt(req.query.id as string, 10);

  if (isNaN(workflowId)) {
    return res.status(400).json({ error: 'Invalid workflow ID' });
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
    return res.status(404).json({ error: 'Workflow not found' });
  }

  try {
    // Get workflow nodes and connections
    const nodes = await db
      .select()
      .from(workflowNodesTable)
      .where(eq(workflowNodesTable.workflowId, workflowId));

    const connections = await db
      .select()
      .from(workflowConnectionsTable)
      .where(eq(workflowConnectionsTable.workflowId, workflowId));

    // Create execution record
    const [execution] = await db.insert(workflowExecutionsTable).values({
      workflowId,
      userId,
      status: 'running',
      inputData: JSON.stringify(req.body.inputData || {}),
    }).returning();

    // Simple execution logic - process nodes in order
    // This is a basic implementation; in production, you'd want proper workflow engine
    let currentNodeId = connections.find(c => !connections.some(other => other.toNodeId === c.fromNodeId))?.fromNodeId;

    while (currentNodeId) {
      const node = nodes.find(n => n.id === currentNodeId);
      if (!node) break;

      const config = JSON.parse(node.config || '{}');

      if (node.type === 'review') {
        // For review nodes, check if meeting creation is confirmed
        if (config.reviewConfig?.meetingConfirmed && config.schedulerConfig) {
          try {
            // Find available slots
            const slots = await CalendarService.findAvailableSlots(
              userId,
              config.schedulerConfig.people || [],
              parseInt(config.schedulerConfig.minTimeRequirement) || 60
            );

            // In a real implementation, you'd return slots to frontend for user selection
            // For now, auto-select first slot
            if (slots.length > 0) {
              const selectedSlot = slots[0];
              await CalendarService.createMeeting(
                userId,
                `Meeting from workflow: ${workflow.name}`,
                selectedSlot.start,
                selectedSlot.end,
                config.schedulerConfig.people || []
              );
            }
          } catch (error) {
            console.error('Calendar integration error:', error);
            // Continue execution even if calendar fails
          }
        }
      }

      // Move to next node
      const nextConnection = connections.find(c => c.fromNodeId === currentNodeId);
      currentNodeId = nextConnection?.toNodeId;
    }

    // Update execution status
    await db.update(workflowExecutionsTable)
      .set({ status: 'completed', completedAt: new Date() })
      .where(eq(workflowExecutionsTable.id, execution.id));

    res.status(200).json({ success: true, executionId: execution.id });
  } catch (error) {
    console.error('Workflow execution error:', error);
    res.status(500).json({ error: 'Failed to execute workflow' });
  }
}