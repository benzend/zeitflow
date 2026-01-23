import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { db } from "@/lib/db";
import { usersTable, chatEventsTable, chatThreadsTable } from "@/schema";
import { eq, and, desc } from "drizzle-orm";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({
      success: false,
      message: "You must be signed in to access chat events"
    });
  }

  // Verify user exists
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

  try {
    if (req.method === "POST") {
      const { threadId, eventType, workflowId, proposalData, metadata } = req.body;

      if (!threadId) {
        return res.status(400).json({
          success: false,
          message: "threadId is required"
        });
      }

      if (!eventType) {
        return res.status(400).json({
          success: false,
          message: "eventType is required"
        });
      }

      // Validate eventType
      const validEventTypes = ['workflow_proposed', 'workflow_approved', 'workflow_rejected'];
      if (!validEventTypes.includes(eventType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid eventType. Must be one of: ${validEventTypes.join(', ')}`
        });
      }

      // Verify thread belongs to user
      const thread = await db.select()
        .from(chatThreadsTable)
        .where(and(
          eq(chatThreadsTable.id, parseInt(threadId)),
          eq(chatThreadsTable.userId, user[0].id)
        ))
        .limit(1);

      if (thread.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Thread not found"
        });
      }

      // Create the event
      const newEvent = await db.insert(chatEventsTable).values({
        threadId: parseInt(threadId),
        userId: user[0].id,
        eventType,
        workflowId: workflowId ? parseInt(workflowId) : null,
        proposalData: proposalData ? JSON.stringify(proposalData) : null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      }).returning();

      return res.status(201).json({
        success: true,
        event: {
          id: newEvent[0].id,
          threadId: newEvent[0].threadId,
          eventType: newEvent[0].eventType,
          workflowId: newEvent[0].workflowId,
          createdAt: newEvent[0].createdAt,
        }
      });

    } else if (req.method === "GET") {
      const { threadId } = req.query;

      if (!threadId) {
        return res.status(400).json({
          success: false,
          message: "threadId is required"
        });
      }

      // Verify thread belongs to user
      const thread = await db.select()
        .from(chatThreadsTable)
        .where(and(
          eq(chatThreadsTable.id, parseInt(threadId as string)),
          eq(chatThreadsTable.userId, user[0].id)
        ))
        .limit(1);

      if (thread.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Thread not found"
        });
      }

      // Get events for the thread
      const events = await db.select()
        .from(chatEventsTable)
        .where(eq(chatEventsTable.threadId, parseInt(threadId as string)))
        .orderBy(desc(chatEventsTable.createdAt));

      return res.status(200).json({
        success: true,
        events: events.map(event => ({
          id: event.id,
          threadId: event.threadId,
          eventType: event.eventType,
          workflowId: event.workflowId,
          proposalData: event.proposalData ? JSON.parse(event.proposalData) : null,
          metadata: event.metadata ? JSON.parse(event.metadata) : null,
          createdAt: event.createdAt,
        }))
      });

    } else {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed`
      });
    }
  } catch (error) {
    console.error("Chat Events API error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}
