import React from 'react';
import { z } from 'zod';
import { IntegrationDefinition } from '../types';

/**
 * Webhook icon component (outgoing arrow)
 */
const WebhookIcon = ({ className, color }: { className?: string; color?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10 15a1 1 0 001 1h2a1 1 0 001-1v-2h2.586a1 1 0 00.707-1.707l-4.293-4.293a1 1 0 00-1.414 0L7.293 11.293A1 1 0 008 13H10v2z"
      fill={color || 'currentColor'}
    />
    <path
      d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 110-16 8 8 0 010 16z"
      fill={color || 'currentColor'}
    />
  </svg>
);

/**
 * Zod schema for outgoing Webhook configuration
 */
export const WebhookConfigSchema = z.object({
  url: z.string().default(''),
  method: z.enum(['POST', 'PUT', 'PATCH']).default('POST'),
  headers: z.string().optional().default(''),
  bodyTemplate: z.string().optional().default(''),
  authType: z.enum(['none', 'bearer', 'basic', 'api_key']).default('none'),
  authValue: z.string().optional().default(''),
  retryOnFailure: z.boolean().optional().default(false),
  maxRetries: z.number().optional().default(3),
});

export type WebhookConfig = z.infer<typeof WebhookConfigSchema>;

/**
 * Outgoing Webhook integration definition (client-safe metadata only)
 * Execute function is defined in executors/webhook.ts
 */
export const webhookIntegration: Omit<IntegrationDefinition<typeof WebhookConfigSchema>, 'execute'> = {
  id: 'webhook',
  name: 'Webhook',
  description: 'Send data to any URL via outgoing webhook',
  category: 'utility',

  icon: WebhookIcon,
  color: '#6366F1',

  configSchema: WebhookConfigSchema,
  defaultConfig: {
    url: '',
    method: 'POST',
    headers: '',
    bodyTemplate: '{\n  "event": "workflow_completed",\n  "data": "{{previousOutput}}"\n}',
    authType: 'none',
    authValue: '',
    retryOnFailure: false,
    maxRetries: 3,
  },

  uiConfig: {
    url: {
      hint: 'text',
      label: 'Webhook URL',
      placeholder: 'https://api.example.com/webhooks/...',
      supportsVariables: true,
      validationHint: 'The URL to send the webhook payload to.',
    },
    method: {
      hint: 'select',
      label: 'HTTP Method',
      options: [
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'PATCH', label: 'PATCH' },
      ],
    },
    headers: {
      hint: 'textarea',
      label: 'Custom Headers (JSON)',
      placeholder: '{"X-Custom-Header": "value"}',
      supportsVariables: true,
      validationHint: 'Optional JSON object of custom headers. Content-Type defaults to application/json.',
    },
    bodyTemplate: {
      hint: 'textarea',
      label: 'Body Template',
      placeholder: '{"event": "workflow_completed", "data": "{{previousOutput}}"}',
      supportsVariables: true,
      validationHint: 'JSON body to send. Supports {{variable}} substitution. If empty, all upstream variables are sent as JSON.',
    },
    authType: {
      hint: 'select',
      label: 'Authentication',
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
      placeholder: 'Token or credentials',
      supportsVariables: true,
      validationHint: 'Bearer: the token. Basic: user:password. API Key: the key value.',
    },
  },

  auth: {
    type: 'none',
  },

  outputVariables: [
    { name: 'statusCode', type: 'number', description: 'HTTP response status code' },
    { name: 'body', type: 'string', description: 'Response body as text' },
    { name: 'parsedBody', type: 'object', description: 'Response body parsed as JSON (if applicable)' },
    { name: 'status', type: 'string', description: 'Send status (sent/failed)' },
    { name: 'error', type: 'string', description: 'Error message if failed' },
  ],
};
