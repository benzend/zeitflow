import { db } from "@/lib/db";
import { queuedChainVariablesTable, queuedChainStepsTable } from "@/schema";
import { and, eq } from "drizzle-orm";

// Re-export client-safe functions
export {
  extractVariables,
  extractVariablesFromPrompts,
  validateVariables,
  hasVariables,
  extractVariablesFromChainSteps
} from "./variables-client";

/**
 * Substitutes variables in a prompt with their values from the database
 * Server-side only function that requires database access
 */
export async function substituteVariables(
  prompt: string,
  queuedChainId: number,
  queuedChainStepId: number,
): Promise<string> {
  const variables = await db
    .select()
    .from(queuedChainVariablesTable)
    .where(eq(queuedChainVariablesTable.queuedChainId, queuedChainId));

  let processedPrompt = prompt;

  for (const variable of variables) {
    const regex = new RegExp(`\\{\\{${variable.variableName}\\}\\}`, "g");
    processedPrompt = processedPrompt.replace(regex, variable.variableValue);
  };

  const hasPreviousOutputVariable = processedPrompt.includes('{{previousOutput}}');

  if (hasPreviousOutputVariable) {
    const previousResponse = await getPreviousResponse(queuedChainStepId);
    if (previousResponse) {
      processedPrompt = processedPrompt.replaceAll('{{previousOutput}}', previousResponse);
    } else {
      console.warn("Previous response not found for queued chain step: " + queuedChainStepId);
    }
  }

  return processedPrompt;
}

async function getPreviousResponse(queuedChainStepId: number) {
  const queuedChainStep = await db
    .select()
    .from(queuedChainStepsTable)
    .where(
      eq(queuedChainStepsTable.id, queuedChainStepId),
    )
    .limit(1);

  if (queuedChainStep.length === 0) {
    console.warn("Queued chain step not found: " + queuedChainStepId);
    return null;
  }

  if (queuedChainStep[0].position === 0) {
    console.warn("Previous response not found for queued chain step: " + queuedChainStepId);
    return null;
  }

  let previousQueuedChainStep = null;

  const prev = await db
    .select()
    .from(queuedChainStepsTable)
    .where(
      and(
        eq(
          queuedChainStepsTable.queuedChainId,
          queuedChainStep[0].queuedChainId,
        ),
        eq(queuedChainStepsTable.status, "completed"),
      ),
    )
    .limit(1);

  if (prev.length > 0) {
    previousQueuedChainStep = prev[0];
  } else {
    console.warn("Previous queued chain step not found: " + queuedChainStepId);
    return null;
  }

  let previousResponse = null;
  if (previousQueuedChainStep) {
    console.debug("found previous step", previousQueuedChainStep.id);
    previousResponse = previousQueuedChainStep.response;
  } else {
    console.warn("no previous step found: " + queuedChainStepId);
    return null;
  }

  return previousResponse;
}
