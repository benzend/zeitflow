import { db } from "@/lib/db";
import { chainsTable, chainStepsTable } from "@/schema";
import { extractVariablesFromPrompts } from "@/lib/variables";
import { eq } from "drizzle-orm";
import { apiHandler, sendError } from "@/lib/api-handler";
import { validationError, notFoundError, authorizationError } from "@/lib/errors";

export default apiHandler({
  GET: async (req, res, { userId }) => {
    const chainId = req.query.id ? parseInt(req.query.id as string, 10) : null;

    if (!chainId) {
      return sendError(res, validationError('Chain ID is required'));
    }

    const chain = await db
      .select()
      .from(chainsTable)
      .where(eq(chainsTable.id, chainId))
      .limit(1);

    if (chain.length === 0) {
      return sendError(res, notFoundError('Chain'));
    }

    if (chain[0].userId !== userId) {
      return sendError(res, authorizationError('Not authorized to access this chain'));
    }

    const chainSteps = await db
      .select()
      .from(chainStepsTable)
      .where(eq(chainStepsTable.chainId, chain[0].id));

    const allPrompts = chainSteps.map((step) => step.prompt);
    const variables = extractVariablesFromPrompts(allPrompts);

    return res.status(200).json({
      success: true,
      message: "Variables retrieved successfully",
      variables,
    });
  },
});
