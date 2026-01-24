import React from 'react';
import { z } from 'zod';
import { IntegrationDefinition } from '../types';

/**
 * Slack icon component (simplified bars representing Slack logo)
 */
const SlackIcon = ({ className, color }: { className?: string; color?: string }) => (
  <svg
    width="14"
    height="13"
    viewBox="0 0 14 13"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="2" y="5.5" width="2" height="6" rx="0.5" fill={color || 'currentColor'} />
    <rect x="5" y="2.5" width="2" height="9" rx="0.5" fill={color || 'currentColor'} />
    <rect x="8" y="4" width="2" height="7.5" rx="0.5" fill={color || 'currentColor'} />
    <rect x="11" y="6.5" width="1.5" height="5" rx="0.5" fill={color || 'currentColor'} />
  </svg>
);

/**
 * Zod schema for Slack configuration
 */
export const SlackConfigSchema = z.object({
  botId: z.number().optional(),
  channel: z.string().default('#general'),
  message: z.string().optional().default(''),
});

export type SlackConfig = z.infer<typeof SlackConfigSchema>;

/**
 * Slack integration definition (client-safe metadata only)
 * Execute function is defined in executors/slack.ts
 */
export const slackIntegration: Omit<IntegrationDefinition<typeof SlackConfigSchema>, 'execute'> = {
  id: 'slack',
  name: 'Slack',
  description: 'Send messages to Slack channels',
  category: 'communication',

  icon: SlackIcon,
  color: '#4A154B',

  configSchema: SlackConfigSchema,
  defaultConfig: {
    botId: undefined,
    channel: '#general',
    message: 'Workflow update: {{previousOutput}}',
  },

  uiConfig: {
    botId: {
      hint: 'select',
      label: 'Slack Bot',
      placeholder: 'Select a bot',
      requiresServerData: 'slackBots',
    },
    channel: {
      hint: 'channel',
      label: 'Channel',
      placeholder: '#general',
      supportsVariables: true,
      validationHint: 'Channel must start with # for channels or @ for users',
    },
    message: {
      hint: 'textarea',
      label: 'Message',
      placeholder: 'Workflow update: {{previousOutput}}',
      supportsVariables: true,
    },
  },

  auth: {
    type: 'oauth',
    requiresUserAuth: true,
  },

  outputVariables: [
    { name: 'status', type: 'string', description: 'Send status (sent/failed)' },
    { name: 'error', type: 'string', description: 'Error message if failed' },
    { name: 'channel', type: 'string', description: 'Channel the message was sent to' },
  ],
};
