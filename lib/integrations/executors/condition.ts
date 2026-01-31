/**
 * Condition Integration Executor (Server-Side Only)
 *
 * This file contains the server-side execution logic for the condition integration.
 * It evaluates conditional expressions and determines which path to follow.
 */

import { ExecutionContext, IntegrationResult } from '../types';
import { ConditionConfig } from '../definitions/condition';

/**
 * Evaluate a condition and return the result
 */
function evaluateCondition(
  leftValue: string,
  operator: ConditionConfig['operator'],
  rightValue: string,
  logger: ExecutionContext['logger']
): boolean {
  logger.debug('Evaluating condition', { leftValue, operator, rightValue });

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
        logger.warn('Cannot compare non-numeric values with greater_than', { leftValue, rightValue });
        return false;
      }
      return leftNum > rightNum;
    }

    case 'less_than': {
      const leftNum = parseFloat(left);
      const rightNum = parseFloat(right);
      if (isNaN(leftNum) || isNaN(rightNum)) {
        logger.warn('Cannot compare non-numeric values with less_than', { leftValue, rightValue });
        return false;
      }
      return leftNum < rightNum;
    }

    case 'is_empty':
      return left === '';

    case 'is_not_empty':
      return left !== '';

    default:
      logger.error('Unknown operator', { operator });
      return false;
  }
}

/**
 * Execute the condition integration
 */
export async function executeCondition(
  config: ConditionConfig,
  context: ExecutionContext
): Promise<IntegrationResult> {
  const { logger, substituteVariables } = context;
  const endTimer = logger.startTimer('condition_evaluation');

  logger.info('Starting condition evaluation', {
    operator: config.operator,
    hasLeftValue: !!config.leftValue,
    hasRightValue: !!config.rightValue,
  });

  // Substitute variables in values
  const leftValue = substituteVariables(config.leftValue || '');
  const rightValue = substituteVariables(config.rightValue || '');

  logger.debug('Variables substituted', {
    leftValue,
    rightValue,
    operator: config.operator,
  });

  // Evaluate the condition
  const result = evaluateCondition(leftValue, config.operator, rightValue, logger);

  endTimer();

  logger.info('Condition evaluated', {
    result,
    leftValue,
    operator: config.operator,
    rightValue,
  });

  return {
    success: true,
    data: {
      result,
      path: result ? 'true' : 'false', // Path to follow
      leftValue,
      rightValue,
      operator: config.operator,
    },
  };
}
