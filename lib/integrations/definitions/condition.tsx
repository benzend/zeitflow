import React from 'react';
import { z } from 'zod';
import { IntegrationDefinition } from '../types';

/**
 * Condition icon component (diamond/decision shape)
 */
const ConditionIcon = ({ className, color }: { className?: string; color?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Diamond shape */}
    <path
      d="M7 1 L13 7 L7 13 L1 7 Z"
      stroke={color || 'currentColor'}
      strokeWidth="0.5"
      fill="none"
    />
    {/* Question mark */}
    <path
      d="M5.5 5.5 Q5.5 4 7 4 Q8.5 4 8.5 5.5 Q8.5 6.5 7 6.8 L7 8"
      stroke={color || 'currentColor'}
      strokeWidth="0.5"
      fill="none"
    />
    <circle cx="7" cy="9.5" r="0.3" fill={color || 'currentColor'} />
  </svg>
);

/**
 * Zod schema for condition configuration
 */
export const ConditionConfigSchema = z.object({
  leftValue: z.string().default(''),
  operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'is_empty', 'is_not_empty']).default('equals'),
  rightValue: z.string().default(''),
});

export type ConditionConfig = z.infer<typeof ConditionConfigSchema>;

/**
 * Condition integration definition (client-safe metadata only)
 * Execute function is defined in executors/condition.ts
 */
export const conditionIntegration: Omit<IntegrationDefinition<typeof ConditionConfigSchema>, 'execute'> = {
  id: 'condition',
  name: 'Condition',
  description: 'Branch workflow based on a condition',
  category: 'utility',

  icon: ConditionIcon,
  color: '#9C27B0',

  configSchema: ConditionConfigSchema,
  defaultConfig: {
    leftValue: '{{ai.intent}}',
    operator: 'equals',
    rightValue: 'high',
  },

  uiConfig: {
    leftValue: {
      hint: 'textarea',
      label: 'Left Value',
      placeholder: '{{ai.intent}}',
      supportsVariables: true,
      validationHint: 'Value to compare (supports {{variables}}). Type {{ to see available variables.',
    },
    operator: {
      hint: 'select',
      label: 'Operator',
      placeholder: 'Select comparison operator',
      supportsVariables: false,
      options: [
        { value: 'equals', label: 'Equals (=)' },
        { value: 'not_equals', label: 'Not Equals (≠)' },
        { value: 'contains', label: 'Contains' },
        { value: 'not_contains', label: 'Does Not Contain' },
        { value: 'greater_than', label: 'Greater Than (>)' },
        { value: 'less_than', label: 'Less Than (<)' },
        { value: 'is_empty', label: 'Is Empty' },
        { value: 'is_not_empty', label: 'Is Not Empty' },
      ],
    },
    rightValue: {
      hint: 'textarea',
      label: 'Right Value',
      placeholder: 'high',
      supportsVariables: true,
      validationHint: 'Value to compare against (supports {{variables}}). Type {{ to see available variables.',
    },
  },

  auth: {
    type: 'none',
  },

  outputVariables: [
    { name: 'result', type: 'boolean', description: 'Condition result (true/false)' },
    { name: 'leftValue', type: 'string', description: 'Left value after variable substitution' },
    { name: 'rightValue', type: 'string', description: 'Right value after variable substitution' },
    { name: 'operator', type: 'string', description: 'Operator used' },
  ],
};
