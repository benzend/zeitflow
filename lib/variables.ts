import { db } from "@/lib/db";
import { queuedChainVariablesTable } from "@/schema";
import { eq } from "drizzle-orm";

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
): Promise<string> {
  const variables = await db
    .select()
    .from(queuedChainVariablesTable)
    .where(eq(queuedChainVariablesTable.queuedChainId, queuedChainId));

  let processedPrompt = prompt;

  variables.forEach((variable) => {
    const regex = new RegExp(`\\{\\{${variable.variableName}\\}\\}`, "g");
    processedPrompt = processedPrompt.replace(regex, variable.variableValue);
  });

  return processedPrompt;
}
