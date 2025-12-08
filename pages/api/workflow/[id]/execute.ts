import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { db } from "@/lib/db";
import { workflowsTable, workflowNodesTable, workflowConnectionsTable, workflowExecutionsTable, usersTable } from "@/schema";
import { eq } from "drizzle-orm";
import { CalendarService } from "@/lib/calendar";
import { chat } from "@/lib/openrouter";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const workflowId = parseInt(req.query.id as string, 10);

  if (isNaN(workflowId)) {
    return res.status(400).json({ error: 'Invalid workflow ID' });
  }

  // Get workflow nodes and connections
  const nodes = await db
    .select()
    .from(workflowNodesTable)
    .where(eq(workflowNodesTable.workflowId, workflowId));

  if (nodes.length === 0) {
    return res.status(404).json({ error: 'Invalid workflow. No nodes found' });
  }

  // Verify workflow exists and belongs to user
  const [workflow] = await db
    .select()
    .from(workflowsTable)
    .where(
      eq(workflowsTable.id, workflowId),
    )
    .limit(1);

  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  let userId: string = '';

  if (nodes[0].type === 'entry' && nodes[0].entryType === 'api') {
    userId = workflow.userId; // we'll need to authenticate endpoints differently in the future
  } else {
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

    userId = user[0].id;
  }

  if (workflow.userId !== userId.toString()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get workflow nodes and connections
    const connections = await db
      .select()
      .from(workflowConnectionsTable)
      .where(eq(workflowConnectionsTable.workflowId, workflowId));

    // Create execution record
    const [execution] = await db.insert(workflowExecutionsTable).values({
      workflowId,
      userId: userId.toString(),
      status: 'running',
      inputData: JSON.stringify(req.body.inputData || {}),
    }).returning();

    // Simple execution logic - process nodes in order
    // This is a basic implementation; in production, you'd want proper workflow engine
    let currentNodeId = connections.find(c => !connections.some(other => other.toNodeId === c.fromNodeId))?.fromNodeId;

    let outputData: Record<string, any> = {};

    while (currentNodeId) {
      const node = nodes.find(n => n.id === currentNodeId);
      if (!node) break;

      const config = JSON.parse(node.config || '{}');

      switch (node.type) {
        case 'entry':
          switch (node.entryType) {
            case 'api':
              console.warn('API call not implemented yet');
              break;
            case 'form':
              outputData['userInput'] = req.body;
              break;
             default:
               // TODO: Implement API call
               break;
           }
           break;
        case 'ai':
          if (!outputData['userInput']) {
            console.warn('AI call requires user input');
            break;
          }

          const aiConfig = config.aiConfig || {};

          const aiResponse = await chat(outputData['userInput'], aiConfig.model, { systemPrompt: aiConfig.systemPrompt });

          if ('error' in aiResponse && aiResponse.error) {
            outputData[node.id] = { error: aiResponse.error };
            console.error('AI call error:', aiResponse.error);
            break;
          }
          outputData[node.id] = { response: aiResponse.text };
          break;
        case 'scheduler':
          // TODO: Implement scheduler call
          break;
        case 'review':
          // TODO: Implement review call
          break;
        case 'slack':
          // TODO: Implement slack call
          break;
      }

      // Move to next node
      const nextConnection = connections.find(c => c.fromNodeId === currentNodeId);
      currentNodeId = nextConnection?.toNodeId;
    }

    // Update execution status
    await db.update(workflowExecutionsTable)
      .set({
        status: 'completed',
        completedAt: new Date(),
        outputData: JSON.stringify(outputData),
      })
      .where(eq(workflowExecutionsTable.id, execution.id));

    res.status(200).json({ success: true, executionId: execution.id });
  } catch (error) {
    console.error('Workflow execution error:', error);
    res.status(500).json({ error: 'Failed to execute workflow' });
  }
}
