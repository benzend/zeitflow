import { db } from "@/lib/db";
import { workflowsTable } from "@/schema";
import { eq, and } from "drizzle-orm";
import { generateWebhookSecret } from "@/lib/webhook-utils";
import { apiHandler, sendError } from "@/lib/api-handler";
import { validationError, notFoundError } from "@/lib/errors";
import { encrypt } from "@/lib/encryption";

export default apiHandler({
  POST: async (req, res, { userId }) => {
    const workflowId = parseInt(req.query.id as string, 10);

    if (isNaN(workflowId)) {
      return sendError(res, validationError('Invalid workflow ID'));
    }

    const [workflow] = await db
      .select()
      .from(workflowsTable)
      .where(and(
        eq(workflowsTable.id, workflowId),
        eq(workflowsTable.userId, userId)
      ))
      .limit(1);

    if (!workflow) {
      return sendError(res, notFoundError('Workflow'));
    }

    const newSecret = generateWebhookSecret();

    await db
      .update(workflowsTable)
      .set({ webhookSecret: encrypt(newSecret) })
      .where(eq(workflowsTable.id, workflowId));

    return res.status(200).json({
      success: true,
      webhookSecret: newSecret,
      message: "Webhook secret regenerated successfully"
    });
  },
});
