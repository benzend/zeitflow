/**
 * Client-safe variable utility functions
 * These functions don't import database connections
 */

/**
 * Extracts variable names from a prompt string
 * Variables are defined as {{variableName}}
 * Supports spaces, dots, underscores, and other characters
 */
export function extractVariables(prompt: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const variables = [];
  let match;

  while ((match = regex.exec(prompt)) !== null) {
    variables.push(match[1].trim());
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
  return /\{\{[^}]+\}\}/.test(prompt);
}

/**
 * Extracts all unique variables from chain steps
 */
export function extractVariablesFromChainSteps(steps: Array<{ prompt: string }>): string[] {
  const allVariables = new Set<string>();
  
  steps.forEach((step) => {
    extractVariables(step.prompt).forEach((variable) => {
      allVariables.add(variable);
    });
  });
  
  return [...allVariables].sort();
}