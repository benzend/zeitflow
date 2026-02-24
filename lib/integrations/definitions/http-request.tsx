import React from 'react';
import { z } from 'zod';
import { IntegrationDefinition } from '../types';

/**
 * HTTP Request icon component
 */
const HttpRequestIcon = ({ className, color }: { className?: string; color?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-.61.08-1.21.21-1.78L8.99 15v1c0 1.1.9 2 2 2v1.93C7.06 19.43 4 16.07 4 12zm13.89 5.4c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41C18.92 5.99 20 8.86 20 12c0 2.08-.67 4-1.81 5.57l-.3-.17z"
      fill={color || 'currentColor'}
    />
  </svg>
);

/**
 * Zod schema for HTTP Request configuration
 */
export const HttpRequestConfigSchema = z.object({
  url: z.string().default(''),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
  headers: z.string().optional().default(''),
  body: z.string().optional().default(''),
  authType: z.enum(['none', 'bearer', 'basic', 'api_key']).default('none'),
  authValue: z.string().optional().default(''),
});

export type HttpRequestConfig = z.infer<typeof HttpRequestConfigSchema>;

/**
 * HTTP Request integration definition (client-safe metadata only)
 * Execute function is defined in executors/http-request.ts
 */
export const httpRequestIntegration: Omit<IntegrationDefinition<typeof HttpRequestConfigSchema>, 'execute'> = {
  id: 'http_request',
  name: 'HTTP Request',
  description: 'Make HTTP requests to any API endpoint',
  category: 'utility',

  icon: HttpRequestIcon,
  color: '#6366F1',

  configSchema: HttpRequestConfigSchema,
  defaultConfig: {
    url: '',
    method: 'GET',
    headers: '',
    body: '',
    authType: 'none',
    authValue: '',
  },

  uiConfig: {
    url: {
      hint: 'text',
      label: 'URL',
      placeholder: 'https://api.example.com/endpoint',
      supportsVariables: true,
    },
    method: {
      hint: 'select',
      label: 'Method',
      options: [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'PATCH', label: 'PATCH' },
        { value: 'DELETE', label: 'DELETE' },
      ],
    },
    headers: {
      hint: 'textarea',
      label: 'Headers (JSON)',
      placeholder: '{"Content-Type": "application/json"}',
      supportsVariables: true,
      validationHint: 'Enter headers as a JSON object. Auth headers are added automatically based on Auth Type.',
    },
    body: {
      hint: 'textarea',
      label: 'Body',
      placeholder: '{"key": "value"}',
      supportsVariables: true,
      validationHint: 'Request body for POST/PUT/PATCH requests. Supports {{variables}}.',
    },
    authType: {
      hint: 'select',
      label: 'Auth Type',
      options: [
        { value: 'none', label: 'None' },
        { value: 'bearer', label: 'Bearer Token' },
        { value: 'basic', label: 'Basic Auth' },
        { value: 'api_key', label: 'API Key (X-API-Key header)' },
      ],
    },
    authValue: {
      hint: 'text',
      label: 'Auth Value',
      placeholder: 'Token, user:password, or API key',
      supportsVariables: true,
      validationHint: 'For Bearer: enter the token. For Basic: enter user:password. For API Key: enter the key.',
    },
  },

  auth: {
    type: 'none',
  },

  outputVariables: [
    { name: 'statusCode', type: 'number', description: 'HTTP response status code' },
    { name: 'body', type: 'string', description: 'Response body as string' },
    { name: 'parsedBody', type: 'object', description: 'Parsed JSON response (if applicable)' },
    { name: 'status', type: 'string', description: 'Request status (success/failed)' },
    { name: 'error', type: 'string', description: 'Error message if failed' },
  ],
};
