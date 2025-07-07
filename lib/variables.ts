import { db } from "@/lib/db";
import { queuedChainVariablesTable } from "@/schema";
import { eq } from "drizzle-orm";

/**
 * Extracts variable names from a prompt string
 * Variables are defined as {{variableName}}
 */
export function extractVariables(prompt: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables = [];
  let match;

  while ((match = regex.exec(prompt)) !== null) {
    variables.push(match[1]);
  }

  // Remove duplicates and return
  return [...new Set(variables)];
}

/**
 * Extracts all unique variables from an array of prompts
 */
export function extractVariablesFromPrompts(prompts: string[]): string[] {
  const allVariables = new Set<string>();

  prompts.forEach((prompt) => {
    extractVariables(prompt).forEach((variable) => {
      allVariables.add(variable);
    });
  });

  return [...allVariables];
}

/**
 * Substitutes variables in a prompt with their values from the database
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

/**
 * Validates that all required variables are provided
 */
export function validateVariables(
  requiredVariables: string[],
  providedVariables: Record<string, string>,
): { isValid: boolean; missingVariables: string[] } {
  const missingVariables = requiredVariables.filter(
    (variable) =>
      !providedVariables[variable] || providedVariables[variable].trim() === "",
  );

  return {
    isValid: missingVariables.length === 0,
    missingVariables,
  };
}

/**
 * Checks if a prompt contains any variables
 */
export function hasVariables(prompt: string): boolean {
  return /\{\{\w+\}\}/.test(prompt);
}
