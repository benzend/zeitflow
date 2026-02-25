import React from 'react';
import { z } from 'zod';
import { IntegrationDefinition } from '../types';

/**
 * Linear icon component
 */
const LinearIcon = ({ className, color }: { className?: string; color?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M2.088 14.38a.5.5 0 01-.073-.584l3.36-5.866a.5.5 0 01.786-.107l9.816 9.816a.5.5 0 01-.107.786l-5.866 3.36a.5.5 0 01-.584-.073L2.088 14.38z"
      fill={color || 'currentColor'}
    />
    <path
      d="M3.658 8.086a.5.5 0 01-.04-.698A11.028 11.028 0 0112 3.5c2.664 0 5.089.946 6.99 2.52a.5.5 0 01.032.745L10.83 14.96a.5.5 0 01-.708 0L3.658 8.086z"
      fill={color || 'currentColor'}
      opacity="0.65"
    />
    <path
      d="M20.242 7.77a.5.5 0 01.758.044c1.37 1.77 2.187 3.99 2.187 6.4 0 .91-.117 1.793-.337 2.635a.5.5 0 01-.82.238l-6.994-6.994a.5.5 0 01.003-.71L20.242 7.77z"
      fill={color || 'currentColor'}
      opacity="0.35"
    />
  </svg>
);

/**
 * Zod schema for Linear configuration
 */
export const LinearConfigSchema = z.object({
  action: z.enum(['create_issue', 'update_issue', 'list_issues', 'add_comment']).default('create_issue'),
  apiKey: z.string().optional().default(''),
  teamId: z.string().default(''),
  title: z.string().optional().default(''),
  description: z.string().optional().default(''),
  issueId: z.string().optional().default(''),
  status: z.string().optional().default(''),
  priority: z.number().optional().default(0),
  assigneeId: z.string().optional().default(''),
  labelIds: z.string().optional().default(''),
  comment: z.string().optional().default(''),
  filterQuery: z.string().optional().default(''),
});

export type LinearConfig = z.infer<typeof LinearConfigSchema>;

/**
 * Linear integration definition (client-safe metadata only)
 * Execute function is defined in executors/linear.ts
 */
export const linearIntegration: Omit<IntegrationDefinition<typeof LinearConfigSchema>, 'execute'> = {
  id: 'linear',
  name: 'Linear',
  description: 'Create and manage Linear issues and projects',
  category: 'data',

  icon: LinearIcon,
  color: '#5E6AD2',

  configSchema: LinearConfigSchema,
  defaultConfig: {
    action: 'create_issue',
    apiKey: '',
    teamId: '',
    title: '',
    description: '',
    issueId: '',
    status: '',
    priority: 0,
    assigneeId: '',
    labelIds: '',
    comment: '',
    filterQuery: '',
  },

  uiConfig: {
    action: {
      hint: 'select',
      label: 'Action',
      options: [
        { value: 'create_issue', label: 'Create Issue' },
        { value: 'update_issue', label: 'Update Issue' },
        { value: 'list_issues', label: 'List Issues' },
        { value: 'add_comment', label: 'Add Comment' },
      ],
    },
    apiKey: {
      hint: 'text',
      label: 'API Key (optional)',
      placeholder: 'Leave empty to use LINEAR_API_KEY env var',
      supportsVariables: false,
      validationHint: 'Create a personal API key at linear.app/settings/api. Falls back to LINEAR_API_KEY env var.',
    },
    teamId: {
      hint: 'text',
      label: 'Team ID',
      placeholder: 'e.g., TEAM-abc123',
      supportsVariables: true,
      validationHint: 'The Linear team ID. Find it in team settings or via the API.',
    },
    title: {
      hint: 'text',
      label: 'Title',
      placeholder: 'Issue title',
      supportsVariables: true,
      validationHint: 'Required for create. Optional for update.',
    },
    description: {
      hint: 'textarea',
      label: 'Description',
      placeholder: 'Issue description (supports Markdown)',
      supportsVariables: true,
      validationHint: 'Supports Markdown formatting.',
    },
    issueId: {
      hint: 'text',
      label: 'Issue ID',
      placeholder: 'e.g., PROJ-123 or UUID',
      supportsVariables: true,
      validationHint: 'Required for update and comment actions. Use the issue identifier (e.g., ENG-123) or UUID.',
    },
    status: {
      hint: 'text',
      label: 'Status (State ID)',
      placeholder: 'State UUID',
      supportsVariables: true,
      validationHint: 'Linear state UUID. Find via API or team workflow settings.',
    },
    priority: {
      hint: 'select',
      label: 'Priority',
      options: [
        { value: '0', label: 'No Priority' },
        { value: '1', label: 'Urgent' },
        { value: '2', label: 'High' },
        { value: '3', label: 'Medium' },
        { value: '4', label: 'Low' },
      ],
    },
    assigneeId: {
      hint: 'text',
      label: 'Assignee ID',
      placeholder: 'User UUID',
      supportsVariables: true,
      validationHint: 'Linear user UUID to assign the issue to.',
    },
    labelIds: {
      hint: 'text',
      label: 'Label IDs (comma-separated)',
      placeholder: 'uuid1, uuid2',
      supportsVariables: true,
      validationHint: 'Comma-separated list of Linear label UUIDs.',
    },
    comment: {
      hint: 'textarea',
      label: 'Comment',
      placeholder: 'Add a comment...',
      supportsVariables: true,
      validationHint: 'Supports Markdown formatting.',
    },
    filterQuery: {
      hint: 'textarea',
      label: 'Filter (JSON)',
      placeholder: '{"state": {"name": {"eq": "In Progress"}}}',
      supportsVariables: true,
      validationHint: 'Linear GraphQL filter object as JSON. Used for List Issues action.',
    },
  },

  auth: {
    type: 'api_key',
    envVar: 'LINEAR_API_KEY',
  },

  outputVariables: [
    { name: 'status', type: 'string', description: 'Operation status (created/updated/listed/commented/failed)' },
    { name: 'issueId', type: 'string', description: 'Issue UUID' },
    { name: 'issueIdentifier', type: 'string', description: 'Issue identifier (e.g., ENG-123)' },
    { name: 'url', type: 'string', description: 'URL of the issue' },
    { name: 'issues', type: 'object', description: 'Array of issues (for list action)' },
    { name: 'issueCount', type: 'number', description: 'Number of issues returned' },
    { name: 'error', type: 'string', description: 'Error message if failed' },
  ],
};
