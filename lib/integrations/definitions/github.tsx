import React from 'react';
import { z } from 'zod';
import { IntegrationDefinition } from '../types';

/**
 * GitHub icon component
 */
const GitHubIcon = ({ className, color }: { className?: string; color?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
      fill={color || 'currentColor'}
    />
  </svg>
);

/**
 * Zod schema for GitHub configuration
 */
export const GitHubConfigSchema = z.object({
  action: z.enum(['create_issue', 'create_comment', 'list_issues']).default('create_issue'),
  repo: z.string().default(''),
  title: z.string().optional().default(''),
  body: z.string().optional().default(''),
  token: z.string().optional().default(''),
});

export type GitHubConfig = z.infer<typeof GitHubConfigSchema>;

/**
 * GitHub integration definition (client-safe metadata only)
 * Execute function is defined in executors/github.ts
 */
export const githubIntegration: Omit<IntegrationDefinition<typeof GitHubConfigSchema>, 'execute'> = {
  id: 'github',
  name: 'GitHub',
  description: 'Create issues, comments, and manage GitHub repositories',
  category: 'data',

  icon: GitHubIcon,
  color: '#24292E',

  configSchema: GitHubConfigSchema,
  defaultConfig: {
    action: 'create_issue',
    repo: '',
    title: '',
    body: '',
    token: '',
  },

  uiConfig: {
    action: {
      hint: 'select',
      label: 'Action',
      options: [
        { value: 'create_issue', label: 'Create Issue' },
        { value: 'create_comment', label: 'Comment on Issue' },
        { value: 'list_issues', label: 'List Issues' },
      ],
    },
    repo: {
      hint: 'text',
      label: 'Repository',
      placeholder: 'owner/repo',
      supportsVariables: true,
      validationHint: 'Enter in owner/repo format, e.g., facebook/react',
    },
    title: {
      hint: 'text',
      label: 'Title / Issue Number',
      placeholder: 'Issue title (or issue number for comments)',
      supportsVariables: true,
      validationHint: 'For Create Issue: the issue title. For Comment: the issue number (e.g., 42).',
    },
    body: {
      hint: 'textarea',
      label: 'Body / Content',
      placeholder: 'Issue body or comment text',
      supportsVariables: true,
      validationHint: 'Supports GitHub Markdown formatting.',
    },
    token: {
      hint: 'text',
      label: 'Personal Access Token (optional)',
      placeholder: 'Leave empty to use system default',
      supportsVariables: false,
      validationHint: 'Create a token at github.com/settings/tokens. Needs repo scope. Falls back to GITHUB_TOKEN env var.',
    },
  },

  auth: {
    type: 'api_key',
    envVar: 'GITHUB_TOKEN',
  },

  outputVariables: [
    { name: 'status', type: 'string', description: 'Operation status (created/listed/failed)' },
    { name: 'issueNumber', type: 'number', description: 'Created issue number' },
    { name: 'commentId', type: 'number', description: 'Created comment ID' },
    { name: 'url', type: 'string', description: 'URL of created resource' },
    { name: 'issues', type: 'object', description: 'Array of issues (for list action)' },
    { name: 'error', type: 'string', description: 'Error message if failed' },
  ],
};
