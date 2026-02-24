import React from 'react';
import { z } from 'zod';
import { IntegrationDefinition } from '../types';

/**
 * Google Drive icon component
 */
const GoogleDriveIcon = ({ className, color }: { className?: string; color?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M8.267 14.68l-1.6 2.77H22.4l1.6-2.77H8.267z"
      fill={color || 'currentColor'}
      opacity="0.6"
    />
    <path
      d="M14.133 3.18H7.467L0 15.95l3.333 5.77L14.133 3.18z"
      fill={color || 'currentColor'}
      opacity="0.4"
    />
    <path
      d="M21.733 15.95L14.133 3.18h6.667l7.6 12.77h-6.667z"
      fill={color || 'currentColor'}
    />
  </svg>
);

/**
 * Zod schema for Google Drive configuration
 */
export const GoogleDriveConfigSchema = z.object({
  action: z.enum(['upload_file', 'create_folder', 'list_files', 'share_file']).default('upload_file'),
  accessToken: z.string().optional().default(''),
  fileName: z.string().optional().default(''),
  fileContent: z.string().optional().default(''),
  mimeType: z.string().optional().default('text/plain'),
  folderId: z.string().optional().default(''),
  folderName: z.string().optional().default(''),
  fileId: z.string().optional().default(''),
  shareEmail: z.string().optional().default(''),
  shareRole: z.enum(['reader', 'writer', 'commenter']).default('reader'),
  query: z.string().optional().default(''),
});

export type GoogleDriveConfig = z.infer<typeof GoogleDriveConfigSchema>;

/**
 * Google Drive integration definition (client-safe metadata only)
 * Execute function is defined in executors/google-drive.ts
 */
export const googleDriveIntegration: Omit<IntegrationDefinition<typeof GoogleDriveConfigSchema>, 'execute'> = {
  id: 'google_drive',
  name: 'Google Drive',
  description: 'Upload, create, and share files in Google Drive',
  category: 'data',

  icon: GoogleDriveIcon,
  color: '#4285F4',

  configSchema: GoogleDriveConfigSchema,
  defaultConfig: {
    action: 'upload_file',
    accessToken: '',
    fileName: '',
    fileContent: '{{previousOutput}}',
    mimeType: 'text/plain',
    folderId: '',
    folderName: '',
    fileId: '',
    shareEmail: '',
    shareRole: 'reader',
    query: '',
  },

  uiConfig: {
    action: {
      hint: 'select',
      label: 'Action',
      options: [
        { value: 'upload_file', label: 'Upload File' },
        { value: 'create_folder', label: 'Create Folder' },
        { value: 'list_files', label: 'List Files' },
        { value: 'share_file', label: 'Share File' },
      ],
    },
    accessToken: {
      hint: 'text',
      label: 'Access Token (optional)',
      placeholder: 'Leave empty to use GOOGLE_DRIVE_ACCESS_TOKEN env var',
      supportsVariables: false,
      validationHint: 'OAuth2 access token with Drive scope. Falls back to GOOGLE_DRIVE_ACCESS_TOKEN env var.',
    },
    fileName: {
      hint: 'text',
      label: 'File Name',
      placeholder: 'report-{{date}}.txt',
      supportsVariables: true,
      validationHint: 'Name for the uploaded file. Include the extension.',
    },
    fileContent: {
      hint: 'textarea',
      label: 'File Content',
      placeholder: '{{previousOutput}}',
      supportsVariables: true,
      validationHint: 'Text content to upload. For JSON files, paste or reference JSON data.',
    },
    mimeType: {
      hint: 'select',
      label: 'MIME Type',
      options: [
        { value: 'text/plain', label: 'Plain Text (.txt)' },
        { value: 'text/csv', label: 'CSV (.csv)' },
        { value: 'application/json', label: 'JSON (.json)' },
        { value: 'text/html', label: 'HTML (.html)' },
        { value: 'text/markdown', label: 'Markdown (.md)' },
        { value: 'application/pdf', label: 'PDF (.pdf)' },
      ],
    },
    folderId: {
      hint: 'text',
      label: 'Folder ID',
      placeholder: 'Leave empty for root',
      supportsVariables: true,
      validationHint: 'Google Drive folder ID. Leave empty to upload to root. Find it in the folder URL.',
    },
    folderName: {
      hint: 'text',
      label: 'Folder Name',
      placeholder: 'My Workflow Output',
      supportsVariables: true,
      validationHint: 'Name for the new folder (Create Folder action).',
    },
    fileId: {
      hint: 'text',
      label: 'File ID',
      placeholder: 'Google Drive file ID',
      supportsVariables: true,
      validationHint: 'Required for Share File action. Find the file ID in the file URL.',
    },
    shareEmail: {
      hint: 'email',
      label: 'Share With (Email)',
      placeholder: 'user@example.com',
      supportsVariables: true,
      validationHint: 'Email address to share the file with.',
    },
    shareRole: {
      hint: 'select',
      label: 'Share Role',
      options: [
        { value: 'reader', label: 'Viewer' },
        { value: 'writer', label: 'Editor' },
        { value: 'commenter', label: 'Commenter' },
      ],
    },
    query: {
      hint: 'text',
      label: 'Search Query',
      placeholder: "name contains 'report'",
      supportsVariables: true,
      validationHint: "Google Drive search query. E.g.: name contains 'report' and mimeType = 'text/csv'",
    },
  },

  auth: {
    type: 'api_key',
    envVar: 'GOOGLE_DRIVE_ACCESS_TOKEN',
  },

  outputVariables: [
    { name: 'status', type: 'string', description: 'Operation status (uploaded/created/listed/shared/failed)' },
    { name: 'fileId', type: 'string', description: 'File or folder ID' },
    { name: 'url', type: 'string', description: 'Web view URL of the file' },
    { name: 'files', type: 'object', description: 'Array of files (for list action)' },
    { name: 'fileCount', type: 'number', description: 'Number of files found' },
    { name: 'error', type: 'string', description: 'Error message if failed' },
  ],
};
