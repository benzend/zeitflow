import React from 'react';
import { z } from 'zod';
import { IntegrationDefinition } from '../types';

/**
 * Airtable icon component
 */
const AirtableIcon = ({ className, color }: { className?: string; color?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M11.52 2.309l-8.405 3.147c-.391.146-.391.697 0 .844l8.405 3.147c.295.11.624.11.919 0l8.405-3.147c.391-.147.391-.698 0-.844L12.44 2.309a1.217 1.217 0 0 0-.919 0zM3 10.5v6.878c0 .345.225.65.556.75l8.444 2.56V13.31L3 10.5zm18 0l-9 2.81v7.378l8.444-2.56c.331-.1.556-.405.556-.75V10.5z"
      fill={color || 'currentColor'}
    />
  </svg>
);

/**
 * Zod schema for Airtable configuration
 */
export const AirtableConfigSchema = z.object({
  action: z.enum(['list_records', 'create_record', 'update_record']).default('list_records'),
  baseId: z.string().default(''),
  tableId: z.string().default(''),
  recordId: z.string().optional().default(''),
  fields: z.string().optional().default(''),
  apiKey: z.string().optional().default(''),
});

export type AirtableConfig = z.infer<typeof AirtableConfigSchema>;

/**
 * Airtable integration definition (client-safe metadata only)
 * Execute function is defined in executors/airtable.ts
 */
export const airtableIntegration: Omit<IntegrationDefinition<typeof AirtableConfigSchema>, 'execute'> = {
  id: 'airtable',
  name: 'Airtable',
  description: 'Read and write records in Airtable bases',
  category: 'data',

  icon: AirtableIcon,
  color: '#18BFFF',

  configSchema: AirtableConfigSchema,
  defaultConfig: {
    action: 'list_records',
    baseId: '',
    tableId: '',
    recordId: '',
    fields: '',
    apiKey: '',
  },

  uiConfig: {
    action: {
      hint: 'select',
      label: 'Action',
      options: [
        { value: 'list_records', label: 'List Records' },
        { value: 'create_record', label: 'Create Record' },
        { value: 'update_record', label: 'Update Record' },
      ],
    },
    baseId: {
      hint: 'text',
      label: 'Base ID',
      placeholder: 'appXXXXXXXXXXXXXX',
      supportsVariables: true,
      validationHint: 'Find the Base ID in the Airtable API docs or URL: airtable.com/{BASE_ID}/...',
    },
    tableId: {
      hint: 'text',
      label: 'Table ID or Name',
      placeholder: 'tblXXXXXXXXXXXXXX or Table Name',
      supportsVariables: true,
      validationHint: 'The table ID (starts with tbl) or URL-encoded table name.',
    },
    recordId: {
      hint: 'text',
      label: 'Record ID (for update)',
      placeholder: 'recXXXXXXXXXXXXXX',
      supportsVariables: true,
      validationHint: 'Required for Update Record action. Record ID starts with rec.',
    },
    fields: {
      hint: 'textarea',
      label: 'Fields (JSON)',
      placeholder: '{"Name": "Alice", "Email": "alice@example.com"}',
      supportsVariables: true,
      validationHint: 'JSON object mapping field names to values. Required for create/update.',
    },
    apiKey: {
      hint: 'text',
      label: 'Personal Access Token (optional)',
      placeholder: 'Leave empty to use system default',
      supportsVariables: false,
      validationHint: 'Create a token at airtable.com/create/tokens. Falls back to AIRTABLE_API_KEY env var.',
    },
  },

  auth: {
    type: 'api_key',
    envVar: 'AIRTABLE_API_KEY',
  },

  outputVariables: [
    { name: 'status', type: 'string', description: 'Operation status (listed/created/updated/failed)' },
    { name: 'records', type: 'object', description: 'Array of records (for list action)' },
    { name: 'recordCount', type: 'number', description: 'Number of records returned' },
    { name: 'recordId', type: 'string', description: 'Created/updated record ID' },
    { name: 'error', type: 'string', description: 'Error message if failed' },
  ],
};
