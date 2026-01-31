/**
 * Condition Integration Helper Utilities
 *
 * Shared utilities for displaying and manipulating condition data
 * across both client and server components.
 */

import { ConditionConfig } from './definitions/condition';

/**
 * Operator symbols for compact display (used in node preview)
 */
export const OPERATOR_SYMBOLS: Record<ConditionConfig['operator'], string> = {
  equals: '=',
  not_equals: '≠',
  contains: '∋',
  not_contains: '∌',
  greater_than: '>',
  less_than: '<',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
};

/**
 * Operator labels for readable display (used in config preview)
 */
export const OPERATOR_LABELS: Record<ConditionConfig['operator'], string> = {
  equals: 'equals',
  not_equals: 'does not equal',
  contains: 'contains',
  not_contains: 'does not contain',
  greater_than: 'is greater than',
  less_than: 'is less than',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
};

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

/**
 * Format a condition config into a compact string representation
 * Used for node preview display
 */
export function formatConditionCompact(config: Partial<ConditionConfig>): string {
  if (!config.leftValue && !config.rightValue) {
    return 'Configure...';
  }

  const left = truncate(config.leftValue || '___', 8);
  const symbol = config.operator ? OPERATOR_SYMBOLS[config.operator] : '?';
  const right = truncate(config.rightValue || '___', 8);

  // For is_empty/is_not_empty, we don't need the right value
  if (config.operator === 'is_empty' || config.operator === 'is_not_empty') {
    return `${left} ${symbol}`;
  }

  return `${left} ${symbol} ${right}`;
}

/**
 * Format a condition config into a readable string representation
 * Used for config preview display
 */
export function formatConditionReadable(config: Partial<ConditionConfig>): string {
  const left = config.leftValue || '___';
  const label = config.operator ? OPERATOR_LABELS[config.operator] : '?';
  const right = config.rightValue || '___';

  // For is_empty/is_not_empty, we don't need the right value
  if (config.operator === 'is_empty' || config.operator === 'is_not_empty') {
    return `IF ${left} ${label}`;
  }

  return `IF ${left} ${label} ${right}`;
}
