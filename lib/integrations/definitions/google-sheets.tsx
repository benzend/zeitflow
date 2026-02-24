import React from 'react';
import { z } from 'zod';
import { IntegrationDefinition } from '../types';

/**
 * Google Sheets icon component
 */
const GoogleSheetsIcon = ({ className, color }: { className?: string; color?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 7h2v2H7V7zm4 0h6v2h-6V7zM7 11h2v2H7v-2zm4 0h6v2h-6v-2zM7 15h2v2H7v-2zm4 0h6v2h-6v-2z"
      fill={color || 'currentColor'}
    />
  </svg>
);

/**
 * Zod schema for Google Sheets configuration
 */
export const GoogleSheetsConfigSchema = z.object({
  mode: z.enum(['read', 'append', 'update']).default('read'),
  spreadsheetId: z.string().default(''),
  range: z.string().default(''),
  values: z.string().optional().default(''),
});

export type GoogleSheetsConfig = z.infer<typeof GoogleSheetsConfigSchema>;

/**
 * Google Sheets integration definition (client-safe metadata only)
 * Execute function is defined in executors/google-sheets.ts
 */
export const googleSheetsIntegration: Omit<IntegrationDefinition<typeof GoogleSheetsConfigSchema>, 'execute'> = {
  id: 'google_sheets',
  name: 'Google Sheets',
  description: 'Read and write data in Google Sheets',
  category: 'data',

  icon: GoogleSheetsIcon,
  color: '#0F9D58',

  configSchema: GoogleSheetsConfigSchema,
  defaultConfig: {
    mode: 'read',
    spreadsheetId: '',
    range: 'Sheet1!A1:Z100',
    values: '',
  },

  uiConfig: {
    mode: {
      hint: 'select',
      label: 'Operation',
      options: [
        { value: 'read', label: 'Read rows' },
        { value: 'append', label: 'Append rows' },
        { value: 'update', label: 'Update cells' },
      ],
    },
    spreadsheetId: {
      hint: 'text',
      label: 'Spreadsheet ID',
      placeholder: 'e.g., 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms',
      supportsVariables: true,
      validationHint: 'Find the spreadsheet ID in the URL: docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit',
    },
    range: {
      hint: 'text',
      label: 'Range',
      placeholder: 'Sheet1!A1:D10',
      supportsVariables: true,
      validationHint: 'A1 notation, e.g., Sheet1!A1:D10 or Sheet1!A:D for entire columns',
    },
    values: {
      hint: 'textarea',
      label: 'Values (JSON array)',
      placeholder: '[["Name", "Email"], ["Alice", "alice@example.com"]]',
      supportsVariables: true,
      validationHint: 'Required for append/update. JSON array of arrays, where each inner array is a row.',
    },
  },

  auth: {
    type: 'oauth',
    requiresUserAuth: true,
  },

  outputVariables: [
    { name: 'status', type: 'string', description: 'Operation status (read/appended/updated/failed)' },
    { name: 'rows', type: 'object', description: 'Array of rows read (for read mode)' },
    { name: 'rowCount', type: 'number', description: 'Number of rows returned/affected' },
    { name: 'updatedRows', type: 'number', description: 'Number of rows updated (for append/update)' },
    { name: 'error', type: 'string', description: 'Error message if failed' },
  ],
};
