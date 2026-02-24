import React from 'react';
import { z } from 'zod';
import { IntegrationDefinition } from '../types';

/**
 * Discord icon component
 */
const DiscordIcon = ({ className, color }: { className?: string; color?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
      fill={color || 'currentColor'}
    />
  </svg>
);

/**
 * Zod schema for Discord configuration
 */
export const DiscordConfigSchema = z.object({
  webhookUrl: z.string().default(''),
  message: z.string().optional().default(''),
  username: z.string().optional().default(''),
});

export type DiscordConfig = z.infer<typeof DiscordConfigSchema>;

/**
 * Discord integration definition (client-safe metadata only)
 * Execute function is defined in executors/discord.ts
 */
export const discordIntegration: Omit<IntegrationDefinition<typeof DiscordConfigSchema>, 'execute'> = {
  id: 'discord',
  name: 'Discord',
  description: 'Send messages to Discord channels via webhook',
  category: 'communication',

  icon: DiscordIcon,
  color: '#5865F2',

  configSchema: DiscordConfigSchema,
  defaultConfig: {
    webhookUrl: '',
    message: 'Workflow update: {{previousOutput}}',
    username: '',
  },

  uiConfig: {
    webhookUrl: {
      hint: 'text',
      label: 'Webhook URL',
      placeholder: 'https://discord.com/api/webhooks/...',
      supportsVariables: true,
      validationHint: 'Create a webhook in Discord: Server Settings → Integrations → Webhooks → New Webhook. Copy the webhook URL.',
    },
    message: {
      hint: 'textarea',
      label: 'Message',
      placeholder: 'Workflow update: {{previousOutput}}',
      supportsVariables: true,
      validationHint: 'Supports Discord Markdown: **bold**, *italic*, `code`, ```code block```, > quote',
    },
    username: {
      hint: 'text',
      label: 'Bot Username (optional)',
      placeholder: 'Leave empty for default webhook name',
      supportsVariables: true,
    },
  },

  auth: {
    type: 'none',
  },

  outputVariables: [
    { name: 'status', type: 'string', description: 'Send status (sent/failed)' },
    { name: 'error', type: 'string', description: 'Error message if failed' },
  ],
};
