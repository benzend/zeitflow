import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { db } from "@/lib/db";
import { usersTable, chatMessagesTable, chatThreadsTable } from "@/schema";
import { eq, desc } from "drizzle-orm";
import { agenticChat } from "@/lib/agentic-chat";
import { isRateLimited } from "@/lib/rate-limit";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ 
      success: false, 
      message: "You must be signed in to access workflow chat" 
    });
  }

  // Get client IP for rate limiting
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
  const clientIp = Array.isArray(ip) ? ip[0] : ip;

  const isLimited = await isRateLimited({
    key: `chat:workflow::${clientIp}`,
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100
  });

  if (isLimited) {
    return res.status(429).json({ 
      success: false, 
      message: "Rate limit exceeded. Please try again later." 
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
      const { prompt, model, systemPrompt, history, workflowId, threadId } = req.body;

      if (!prompt || !prompt.trim()) {
        return res.status(400).json({
          success: false,
          message: "Prompt is required"
        });
      }

      if (!model) {
        return res.status(400).json({
          success: false,
          message: "Model is required"
        });
      }

      let currentThreadId = threadId ? parseInt(threadId) : null;

      // If no threadId provided, create a new thread
      if (!currentThreadId) {
        const newThread = await db.insert(chatThreadsTable).values({
          userId: user[0].id,
          title: prompt.trim().slice(0, 50) + (prompt.length > 50 ? '...' : ''), // Use first 50 chars as title
        }).returning();

        currentThreadId = newThread[0].id;
      }

      // Save user message to database
      await db.insert(chatMessagesTable).values({
        threadId: currentThreadId,
        userId: user[0].id,
        workflowId: workflowId ? parseInt(workflowId) : null,
        role: 'user',
        content: prompt.trim(),
      });

      // Use agentic chat with tools
      const response = await agenticChat(prompt, model, {
        systemPrompt,
        history,
        userId: user[0].id,
        threadId: currentThreadId,
      });

      if (response.error) {
        return res.status(500).json({
          success: false,
          message: response.text || "AI service error"
        });
      }

      // Save AI response to database
      await db.insert(chatMessagesTable).values({
        threadId: currentThreadId,
        userId: user[0].id,
        workflowId: workflowId ? parseInt(workflowId) : null,
        role: 'assistant',
        content: response.text,
      });

      // Update thread's last message timestamp
      await db.update(chatThreadsTable)
        .set({ lastMessageAt: new Date() })
        .where(eq(chatThreadsTable.id, currentThreadId));

      return res.status(200).json({
        success: true,
        response: response.text,
        threadId: currentThreadId,
        toolCalls: response.toolCalls,
        proposedWorkflow: response.proposedWorkflow,
        proposedPlan: response.proposedPlan,
      });

    } else if (req.method === "GET") {
      const { threadId } = req.query;

      if (threadId) {
        // Get messages for a specific thread
        const messages = await db.select()
          .from(chatMessagesTable)
          .where(eq(chatMessagesTable.threadId, parseInt(threadId as string)))
          .orderBy(chatMessagesTable.createdAt);

        return res.status(200).json({
          success: true,
          messages: messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: msg.createdAt,
          }))
        });
      } else {
        // Get all threads for the user
        const threads = await db.select()
          .from(chatThreadsTable)
          .where(eq(chatThreadsTable.userId, user[0].id))
          .orderBy(desc(chatThreadsTable.lastMessageAt));

        return res.status(200).json({
          success: true,
          threads: threads.map(thread => ({
            id: thread.id,
            title: thread.title,
            lastMessageAt: thread.lastMessageAt,
            createdAt: thread.createdAt,
          }))
        });
      }

    } else {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed`
      });
    }
  } catch (error) {
    console.error("Chat Workflow API error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}
