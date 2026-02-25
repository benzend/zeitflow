import React from 'react';
import { z } from 'zod';
import { IntegrationDefinition } from '../types';

/**
 * Jira icon component
 */
const JiraIcon = ({ className, color }: { className?: string; color?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M11.571 11.513H0a5.218 5.218 0 005.232 5.215h2.13v2.057A5.215 5.215 0 0012.574 24V12.518a1.005 1.005 0 00-1.003-1.005z"
      fill={color || 'currentColor'}
    />
    <path
      d="M17.11 5.986H5.539a5.218 5.218 0 005.232 5.215h2.13v2.057a5.215 5.215 0 005.212 5.212V6.991a1.005 1.005 0 00-1.003-1.005z"
      fill={color || 'currentColor'}
      opacity="0.65"
    />
    <path
      d="M22.647.459H11.076a5.218 5.218 0 005.232 5.215h2.13v2.057A5.215 5.215 0 0023.65 12.94V1.464A1.005 1.005 0 0022.647.46z"
      fill={color || 'currentColor'}
      opacity="0.35"
    />
  </svg>
);

/**
 * Zod schema for Jira configuration
 */
export const JiraConfigSchema = z.object({
  action: z.enum(['create_issue', 'update_issue', 'transition_issue', 'list_issues', 'add_comment']).default('create_issue'),
  domain: z.string().default(''),
  email: z.string().optional().default(''),
  apiToken: z.string().optional().default(''),
  projectKey: z.string().default(''),
  issueKey: z.string().optional().default(''),
  summary: z.string().optional().default(''),
  description: z.string().optional().default(''),
  issueType: z.string().optional().default('Task'),
  priority: z.string().optional().default('Medium'),
  transitionId: z.string().optional().default(''),
  comment: z.string().optional().default(''),
  jql: z.string().optional().default(''),
});

export type JiraConfig = z.infer<typeof JiraConfigSchema>;

/**
 * Jira integration definition (client-safe metadata only)
 * Execute function is defined in executors/jira.ts
 */
export const jiraIntegration: Omit<IntegrationDefinition<typeof JiraConfigSchema>, 'execute'> = {
  id: 'jira',
  name: 'Jira',
  description: 'Create and manage Jira issues',
  category: 'data',

  icon: JiraIcon,
  color: '#0052CC',

  configSchema: JiraConfigSchema,
  defaultConfig: {
    action: 'create_issue',
    domain: '',
    email: '',
    apiToken: '',
    projectKey: '',
    issueKey: '',
    summary: '',
    description: '',
    issueType: 'Task',
    priority: 'Medium',
    transitionId: '',
    comment: '',
    jql: '',
  },

  uiConfig: {
    action: {
      hint: 'select',
      label: 'Action',
      options: [
        { value: 'create_issue', label: 'Create Issue' },
        { value: 'update_issue', label: 'Update Issue' },
        { value: 'transition_issue', label: 'Transition Issue' },
        { value: 'list_issues', label: 'Search Issues (JQL)' },
        { value: 'add_comment', label: 'Add Comment' },
      ],
    },
    domain: {
      hint: 'text',
      label: 'Jira Domain',
      placeholder: 'your-company.atlassian.net',
      supportsVariables: false,
      validationHint: 'Your Atlassian domain (e.g., your-company.atlassian.net). Do not include https://.',
    },
    email: {
      hint: 'email',
      label: 'Email (optional)',
      placeholder: 'Leave empty to use JIRA_EMAIL env var',
      supportsVariables: false,
      validationHint: 'The email associated with your Atlassian account. Falls back to JIRA_EMAIL env var.',
    },
    apiToken: {
      hint: 'text',
      label: 'API Token (optional)',
      placeholder: 'Leave empty to use JIRA_API_TOKEN env var',
      supportsVariables: false,
      validationHint: 'Create an API token at id.atlassian.com/manage-profile/security/api-tokens. Falls back to JIRA_API_TOKEN env var.',
    },
    projectKey: {
      hint: 'text',
      label: 'Project Key',
      placeholder: 'PROJ',
      supportsVariables: true,
      validationHint: 'The project key (e.g., PROJ, ENG, MARKETING).',
    },
    issueKey: {
      hint: 'text',
      label: 'Issue Key',
      placeholder: 'PROJ-123',
      supportsVariables: true,
      validationHint: 'Required for update, transition, and comment actions. E.g., PROJ-123.',
    },
    summary: {
      hint: 'text',
      label: 'Summary',
      placeholder: 'Issue title',
      supportsVariables: true,
      validationHint: 'The issue summary/title. Required for create, optional for update.',
    },
    description: {
      hint: 'textarea',
      label: 'Description',
      placeholder: 'Issue description...',
      supportsVariables: true,
      validationHint: 'Supports Atlassian Document Format (plain text is auto-converted).',
    },
    issueType: {
      hint: 'select',
      label: 'Issue Type',
      options: [
        { value: 'Task', label: 'Task' },
        { value: 'Bug', label: 'Bug' },
        { value: 'Story', label: 'Story' },
        { value: 'Epic', label: 'Epic' },
        { value: 'Sub-task', label: 'Sub-task' },
      ],
    },
    priority: {
      hint: 'select',
      label: 'Priority',
      options: [
        { value: 'Highest', label: 'Highest' },
        { value: 'High', label: 'High' },
        { value: 'Medium', label: 'Medium' },
        { value: 'Low', label: 'Low' },
        { value: 'Lowest', label: 'Lowest' },
      ],
    },
    transitionId: {
      hint: 'text',
      label: 'Transition ID',
      placeholder: '31',
      supportsVariables: true,
      validationHint: 'The ID of the transition to perform. Find IDs via your Jira workflow settings or the API.',
    },
    comment: {
      hint: 'textarea',
      label: 'Comment',
      placeholder: 'Add a comment...',
      supportsVariables: true,
    },
    jql: {
      hint: 'text',
      label: 'JQL Query',
      placeholder: 'project = PROJ AND status = "In Progress"',
      supportsVariables: true,
      validationHint: 'Jira Query Language expression. Used for the Search Issues action.',
    },
  },

  auth: {
    type: 'api_key',
    envVar: 'JIRA_API_TOKEN',
  },

  outputVariables: [
    { name: 'status', type: 'string', description: 'Operation status (created/updated/transitioned/listed/commented/failed)' },
    { name: 'issueKey', type: 'string', description: 'Issue key (e.g., PROJ-123)' },
    { name: 'issueId', type: 'string', description: 'Issue ID' },
    { name: 'url', type: 'string', description: 'URL of the issue' },
    { name: 'issues', type: 'object', description: 'Array of issues (for search action)' },
    { name: 'issueCount', type: 'number', description: 'Number of issues returned' },
    { name: 'error', type: 'string', description: 'Error message if failed' },
  ],
};
