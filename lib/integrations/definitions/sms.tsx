import React from 'react';
import { z } from 'zod';
import { IntegrationDefinition } from '../types';

/**
 * SMS icon component (message bubble)
 */
const SMSIcon = ({ className, color }: { className?: string; color?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Message bubble */}
    <rect
      x="0.5"
      y="0.5"
      width="13"
      height="9"
      rx="1.5"
      stroke={color || 'currentColor'}
      strokeWidth="0.5"
      fill="none"
    />
    {/* Message lines */}
    <line x1="2.5" y1="3" x2="11.5" y2="3" stroke={color || 'currentColor'} strokeWidth="0.5" />
    <line x1="2.5" y1="5" x2="9.5" y2="5" stroke={color || 'currentColor'} strokeWidth="0.5" />
    {/* Tail of message bubble */}
    <path d="M4 9.5 L3 12 L5.5 9.5" stroke={color || 'currentColor'} strokeWidth="0.5" fill="none" />
  </svg>
);

/**
 * Zod schema for SMS configuration
 */
export const SMSConfigSchema = z.object({
  to: z.array(z.string()).default([]),
  message: z.string().optional().default(''),
});

export type SMSConfig = z.infer<typeof SMSConfigSchema>;

/**
 * SMS integration definition (client-safe metadata only)
 * Execute function is defined in executors/sms.ts
 */
export const smsIntegration: Omit<IntegrationDefinition<typeof SMSConfigSchema>, 'execute'> = {
  id: 'sms',
  name: 'SMS',
  description: 'Send text messages via Twilio',
  category: 'communication',

  icon: SMSIcon,
  color: '#F22F46',

  configSchema: SMSConfigSchema,
  defaultConfig: {
    to: [],
    message: 'Workflow update: {{previousOutput}}',
  },

  uiConfig: {
    to: {
      hint: 'recipients',
      label: 'To (comma-separated)',
      placeholder: '+12345678900, {{contact.phone}}',
      supportsVariables: true,
      validationHint: 'International format supported. Variables like {{contact.phone}} allowed.',
    },
    message: {
      hint: 'textarea',
      label: 'Message',
      placeholder: 'Workflow update: {{previousOutput}}',
      supportsVariables: true,
      validationHint: '160 chars per SMS segment',
    },
  },

  auth: {
    type: 'api_key',
    envVar: 'TWILIO_ACCOUNT_SID',
  },

  outputVariables: [
    { name: 'status', type: 'string', description: 'Send status (sent/partial/failed)' },
    { name: 'error', type: 'string', description: 'Error message if failed' },
    { name: 'sentCount', type: 'number', description: 'Number of messages sent successfully' },
    { name: 'failedCount', type: 'number', description: 'Number of messages that failed' },
  ],
};
