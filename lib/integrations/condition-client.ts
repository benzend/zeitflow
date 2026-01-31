/**
 * Condition Integration Client-Side Logic
 *
 * This file contains client-side evaluation logic for testing conditions
 * in the browser before workflow execution. Mirrors server-side logic
 * from executors/condition.ts
 */

import { ConditionConfig } from './definitions/condition';

/**
 * Evaluate a condition on the client side (for testing)
 * This mirrors the server-side evaluateCondition function
 */
export function evaluateConditionClient(
  leftValue: string,
  operator: ConditionConfig['operator'],
  rightValue: string
): boolean {
  // Normalize values for comparison (trim whitespace, case-insensitive)
  const left = leftValue.trim();
  const right = rightValue.trim();

  switch (operator) {
    case 'equals':
      return left.toLowerCase() === right.toLowerCase();

    case 'not_equals':
      return left.toLowerCase() !== right.toLowerCase();

    case 'contains':
      return left.toLowerCase().includes(right.toLowerCase());

    case 'not_contains':
      return !left.toLowerCase().includes(right.toLowerCase());

    case 'greater_than': {
      const leftNum = parseFloat(left);
      const rightNum = parseFloat(right);
      if (isNaN(leftNum) || isNaN(rightNum)) {
        console.warn('Cannot compare non-numeric values with greater_than', { leftValue, rightValue });
        return false;
      }
      return leftNum > rightNum;
    }

    case 'less_than': {
      const leftNum = parseFloat(left);
      const rightNum = parseFloat(right);
      if (isNaN(leftNum) || isNaN(rightNum)) {
        console.warn('Cannot compare non-numeric values with less_than', { leftValue, rightValue });
        return false;
      }
      return leftNum < rightNum;
    }

    case 'is_empty':
      return left === '';

    case 'is_not_empty':
      return left !== '';

    default:
      console.error('Unknown operator', { operator });
      return false;
  }
}
