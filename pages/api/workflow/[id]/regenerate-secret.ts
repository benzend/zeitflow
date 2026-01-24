import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { db } from "@/lib/db";
import { workflowsTable, usersTable } from "@/schema";
import { eq, and } from "drizzle-orm";
import { generateWebhookSecret } from "@/lib/webhook-utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed`
    });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({
      success: false,
      message: "You must be signed in to regenerate webhook secrets"
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

  try {
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

    // Generate new webhook secret
    const newSecret = generateWebhookSecret();

    // Update workflow with new secret
    await db
      .update(workflowsTable)
      .set({ webhookSecret: newSecret })
      .where(eq(workflowsTable.id, workflowId));

    return res.status(200).json({
      success: true,
      webhookSecret: newSecret,
      message: "Webhook secret regenerated successfully"
    });

  } catch (error) {
    console.error("Regenerate secret error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}
