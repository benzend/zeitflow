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

/**
 * Finds variables used in a value that are not in the available suggestions
 * Returns array of invalid variable names
 */
export function findInvalidVariables(
  value: string,
  suggestions: (string | { name: string; description: string })[]
): string[] {
  const usedVariables = extractVariables(value);
  const availableNames = new Set(
    suggestions.map(s => typeof s === 'string' ? s : s.name)
  );
  
  return usedVariables.filter(v => !availableNames.has(v));
}