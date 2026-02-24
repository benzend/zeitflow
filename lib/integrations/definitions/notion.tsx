import React from 'react';
import { z } from 'zod';
import { IntegrationDefinition } from '../types';

/**
 * Notion icon component
 */
const NotionIcon = ({ className, color }: { className?: string; color?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.29 2.09c-.466-.373-.98-.653-2.055-.56l-12.79.933c-.467.047-.56.28-.374.466l1.388 1.28zM5.252 7.617v13.874c0 .747.373 1.027 1.214.98l14.523-.84c.84-.047.933-.56.933-1.167V6.824c0-.606-.233-.933-.746-.886l-15.177.886c-.56.047-.747.327-.747.793zM18.57 8.31c.094.42 0 .84-.42.887l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.747 0-.934-.234-1.494-.934l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.222.187c-.094-.187 0-.653.327-.747l.84-.22V9.384L6.79 9.29c-.094-.42.14-1.027.747-1.073l3.455-.234 4.763 7.28V8.91l-1.214-.14c-.094-.514.28-.887.747-.934l3.282-.187z"
      fill={color || 'currentColor'}
    />
  </svg>
);

/**
 * Zod schema for Notion configuration
 */
export const NotionConfigSchema = z.object({
  action: z.enum(['create_page', 'query_database', 'append_block']).default('create_page'),
  databaseId: z.string().default(''),
  title: z.string().optional().default(''),
  content: z.string().optional().default(''),
  apiKey: z.string().optional().default(''),
});

export type NotionConfig = z.infer<typeof NotionConfigSchema>;

/**
 * Notion integration definition (client-safe metadata only)
 * Execute function is defined in executors/notion.ts
 */
export const notionIntegration: Omit<IntegrationDefinition<typeof NotionConfigSchema>, 'execute'> = {
  id: 'notion',
  name: 'Notion',
  description: 'Create pages, query databases, and manage Notion content',
  category: 'data',

  icon: NotionIcon,
  color: '#000000',

  configSchema: NotionConfigSchema,
  defaultConfig: {
    action: 'create_page',
    databaseId: '',
    title: '',
    content: '',
    apiKey: '',
  },

  uiConfig: {
    action: {
      hint: 'select',
      label: 'Action',
      options: [
        { value: 'create_page', label: 'Create Page' },
        { value: 'query_database', label: 'Query Database' },
        { value: 'append_block', label: 'Append to Page' },
      ],
    },
    databaseId: {
      hint: 'text',
      label: 'Database / Page ID',
      placeholder: 'e.g., 8c4e4eab-a...',
      supportsVariables: true,
      validationHint: 'Find the ID in the Notion page URL: notion.so/{workspace}/{PAGE_ID}. For database queries, use the database ID.',
    },
    title: {
      hint: 'text',
      label: 'Page Title',
      placeholder: 'New page title',
      supportsVariables: true,
      validationHint: 'Required for Create Page action.',
    },
    content: {
      hint: 'textarea',
      label: 'Content',
      placeholder: 'Page content or text to append',
      supportsVariables: true,
      validationHint: 'Plain text content. For Create Page: page body. For Append: text block to add.',
    },
    apiKey: {
      hint: 'text',
      label: 'Integration Token (optional)',
      placeholder: 'Leave empty to use system default',
      supportsVariables: false,
      validationHint: 'Create an integration at notion.so/my-integrations. Remember to share the database/page with the integration.',
    },
  },

  auth: {
    type: 'api_key',
    envVar: 'NOTION_API_KEY',
  },

  outputVariables: [
    { name: 'status', type: 'string', description: 'Operation status (created/queried/appended/failed)' },
    { name: 'pageId', type: 'string', description: 'Created/queried page ID' },
    { name: 'url', type: 'string', description: 'URL of the created page' },
    { name: 'results', type: 'object', description: 'Query results (for query action)' },
    { name: 'resultCount', type: 'number', description: 'Number of results returned' },
    { name: 'error', type: 'string', description: 'Error message if failed' },
  ],
};
