import React from 'react';
import { z } from 'zod';
import { IntegrationDefinition } from '../types';

/**
 * Email icon component
 */
const EmailIcon = ({ className, color }: { className?: string; color?: string }) => (
  <svg
    width="14"
    height="11"
    viewBox="0 0 14 11"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect
      x="0.5"
      y="0.5"
      width="13"
      height="10"
      rx="0.5"
      stroke={color || 'currentColor'}
      strokeWidth="0.5"
      fill="none"
    />
    <path
      d="M0.5 1 L7 6 L13.5 1"
      stroke={color || 'currentColor'}
      strokeWidth="0.5"
      fill="none"
    />
  </svg>
);

/**
 * Zod schema for email configuration
 */
export const EmailConfigSchema = z.object({
  to: z.array(z.string()).default([]),
  subject: z.string().optional().default('Workflow Notification'),
  message: z.string().optional().default(''),
  from: z.string().optional(),
  resendApiKey: z.string().optional().default(''),
});

export type EmailConfig = z.infer<typeof EmailConfigSchema>;

/**
 * Email integration definition (client-safe metadata only)
 * Execute function is defined in executors/email.ts
 */
export const emailIntegration: Omit<IntegrationDefinition<typeof EmailConfigSchema>, 'execute'> = {
  id: 'email',
  name: 'Email',
  description: 'Send emails via Resend',
  category: 'communication',

  icon: EmailIcon,
  color: '#4CAF50',

  configSchema: EmailConfigSchema,
  defaultConfig: {
    to: [],
    subject: 'Workflow Notification',
    message: 'Workflow update: {{previousOutput}}',
    from: undefined,
    resendApiKey: '',
  },

  uiConfig: {
    to: {
      hint: 'recipients',
      label: 'To (comma-separated)',
      placeholder: 'user@example.com, admin@example.com',
      supportsVariables: true,
      validationHint: 'Enter valid email addresses separated by commas',
    },
    subject: {
      hint: 'text',
      label: 'Subject',
      placeholder: 'Workflow Notification',
      supportsVariables: true,
    },
    message: {
      hint: 'textarea',
      label: 'Message',
      placeholder: 'Workflow update: {{previousOutput}}',
      supportsVariables: true,
    },
    from: {
      hint: 'email',
      label: 'From (optional)',
      placeholder: 'noreply@yourdomain.com',
      supportsVariables: false,
    },
    resendApiKey: {
      hint: 'text',
      label: 'Resend API Key (optional)',
      placeholder: 'Leave empty to use system default',
      supportsVariables: false,
      validationHint: 'Your own Resend API key from resend.com/api-keys. Falls back to system default.',
    },
  },

  auth: {
    type: 'api_key',
    envVar: 'RESEND_API_KEY',
  },

  outputVariables: [
    { name: 'status', type: 'string', description: 'Send status (sent/failed)' },
    { name: 'error', type: 'string', description: 'Error message if failed' },
  ],
};
