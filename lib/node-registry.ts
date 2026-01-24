/**
 * Central Node Registry
 *
 * This is the SINGLE SOURCE OF TRUTH for all workflow node types.
 * Adding a new node type? Just add it here and most serialization/comparison happens automatically!
 */

import { AINodeConfig, SchedulerConfig, ReviewConfig, EmailConfig, SlackConfig, SMSConfig, TelegramConfig } from './workflow-types';

/**
 * Node configuration registry
 * Each node type has:
 * - configKey: The property name on NodeData (e.g., 'emailConfig')
 * - defaultConfig: Default values when creating a new node
 */
export const NODE_CONFIGS = {
  entry: {
    configKey: null, // Entry nodes store fields directly, no separate config
    defaultConfig: null,
  },
  ai: {
    configKey: 'aiConfig' as const,
    defaultConfig: {
      model: 'google/gemini-2.0-flash-001',
      systemPrompt: '',
      userPrompt: '',
      outputType: 'JSON',
      outputStructure: '',
      hasTemplate: false,
      templateText: ''
    } as AINodeConfig,
  },
  scheduler: {
    configKey: 'schedulerConfig' as const,
    defaultConfig: {
      people: [],
      minTimeRequirement: '',
      calendar: ''
    } as SchedulerConfig,
  },
  review: {
    configKey: 'reviewConfig' as const,
    defaultConfig: {
      validationSteps: [],
      meetingConfirmed: false
    } as ReviewConfig,
  },
  email: {
    configKey: 'emailConfig' as const,
    defaultConfig: {
      to: [],
      subject: 'Workflow Notification',
      message: 'Workflow update: {{previousOutput}}',
      from: 'noreply@zeitflow.io'
    } as EmailConfig,
  },
  slack: {
    configKey: 'slackConfig' as const,
    defaultConfig: {
      channel: '#general',
      message: 'Workflow update: {{previousOutput}}'
    } as SlackConfig,
  },
  sms: {
    configKey: 'smsConfig' as const,
    defaultConfig: {
      to: [],
      message: 'Workflow update: {{previousOutput}}'
    } as SMSConfig,
  },
  telegram: {
    configKey: 'telegramConfig' as const,
    defaultConfig: {
      chatId: '',
      message: 'Workflow update: {{previousOutput}}',
      botToken: ''
    } as TelegramConfig,
  },
} as const;

// Type helpers derived from the registry
export type NodeType = keyof typeof NODE_CONFIGS;
export type ConfigKey = typeof NODE_CONFIGS[NodeType]['configKey'];
export type NodeConfigKey = Exclude<ConfigKey, null>;

// Get all config keys (excluding null for entry nodes)
export const ALL_CONFIG_KEYS: NodeConfigKey[] = Object.values(NODE_CONFIGS)
  .map(config => config.configKey)
  .filter((key): key is NodeConfigKey => key !== null);

// Node type array for iterations
export const NODE_TYPES = Object.keys(NODE_CONFIGS) as NodeType[];

// Get default config for a node type
export function getDefaultConfig(type: NodeType) {
  return NODE_CONFIGS[type].defaultConfig;
}

// Get config key for a node type
export function getConfigKey(type: NodeType): ConfigKey {
  return NODE_CONFIGS[type].configKey;
}

// Check if a node type has a config
export function hasConfig(type: NodeType): boolean {
  return NODE_CONFIGS[type].configKey !== null;
}
