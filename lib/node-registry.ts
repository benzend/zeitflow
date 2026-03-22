/**
 * Central Node Registry
 *
 * This is the SINGLE SOURCE OF TRUTH for all workflow node types.
 * Adding a new node type? Just add it here and most serialization/comparison happens automatically!
 */

import { AINodeConfig, AgentNodeConfig, SchedulerConfig, ReviewConfig, EmailConfig, SlackConfig, SMSConfig, TelegramConfig, ConditionConfig, YouTubeConfig } from './workflow-types';

export type NodeCategory = 'core' | 'communication' | 'data' | 'scheduling' | 'utility';

/**
 * Node configuration registry
 * Each node type has:
 * - configKey: The property name on NodeData (e.g., 'emailConfig')
 * - defaultConfig: Default values when creating a new node
 * - label: Display name
 * - description: Short description for the node selector
 * - category: Grouping category
 * - icon: Lucide icon name
 */
export const NODE_CONFIGS = {
  entry: {
    configKey: null,
    defaultConfig: null,
    label: 'Entry',
    description: 'Collect input via API, form, or webhook',
    category: 'core' as NodeCategory,
    icon: 'LogIn',
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
    label: 'AI Model',
    description: 'Process data with an AI model',
    category: 'core' as NodeCategory,
    icon: 'Brain',
  },
  agent: {
    configKey: 'agentConfig' as const,
    defaultConfig: {
      model: 'google/gemini-2.0-flash-001',
      systemPrompt: '',
      userPrompt: '',
      temperature: 0.7,
      maxSteps: 5,
      tools: [],
      outputType: 'text',
      outputStructure: '',
    } as AgentNodeConfig,
    label: 'Agent',
    description: 'Autonomous AI with tool calling',
    category: 'core' as NodeCategory,
    icon: 'Bot',
  },
  scheduler: {
    configKey: 'schedulerConfig' as const,
    defaultConfig: {
      people: [],
      minTimeRequirement: '',
      calendar: ''
    } as SchedulerConfig,
    label: 'Scheduler',
    description: 'Schedule meetings via Google Calendar',
    category: 'scheduling' as NodeCategory,
    icon: 'Calendar',
  },
  review: {
    configKey: 'reviewConfig' as const,
    defaultConfig: {
      validationSteps: [],
      meetingConfirmed: false
    } as ReviewConfig,
    label: 'Review',
    description: 'Pause for manual review and approval',
    category: 'core' as NodeCategory,
    icon: 'CheckCircle',
  },
  email: {
    configKey: 'emailConfig' as const,
    defaultConfig: {
      to: [],
      subject: 'Workflow Notification',
      message: 'Workflow update: {{previousOutput}}',
      from: 'noreply@zeitflow.io'
    } as EmailConfig,
    label: 'Email',
    description: 'Send emails via Resend or SMTP',
    category: 'communication' as NodeCategory,
    icon: 'Mail',
  },
  slack: {
    configKey: 'slackConfig' as const,
    defaultConfig: {
      channel: '#general',
      message: 'Workflow update: {{previousOutput}}'
    } as SlackConfig,
    label: 'Slack',
    description: 'Send messages to Slack channels',
    category: 'communication' as NodeCategory,
    icon: 'MessageSquare',
  },
  sms: {
    configKey: 'smsConfig' as const,
    defaultConfig: {
      to: [],
      message: 'Workflow update: {{previousOutput}}',
      twilioAccountSid: '',
      twilioAuthToken: '',
      twilioPhoneNumber: ''
    } as SMSConfig,
    label: 'SMS',
    description: 'Send text messages via Twilio',
    category: 'communication' as NodeCategory,
    icon: 'Smartphone',
  },
  telegram: {
    configKey: 'telegramConfig' as const,
    defaultConfig: {
      chatId: '',
      message: 'Workflow update: {{previousOutput}}',
      botToken: ''
    } as TelegramConfig,
    label: 'Telegram',
    description: 'Send messages via Telegram bot',
    category: 'communication' as NodeCategory,
    icon: 'Send',
  },
  condition: {
    configKey: 'conditionConfig' as const,
    defaultConfig: {
      leftValue: '{{ai.intent}}',
      operator: 'equals',
      rightValue: 'high'
    } as ConditionConfig,
    label: 'Condition',
    description: 'Branch based on a condition',
    category: 'utility' as NodeCategory,
    icon: 'GitBranch',
  },
  youtube: {
    configKey: 'youtubeConfig' as const,
    defaultConfig: {
      mode: 'fetch',
      videoUrl: '',
      commentText: ''
    } as YouTubeConfig,
    label: 'YouTube',
    description: 'Fetch video data or post comments',
    category: 'data' as NodeCategory,
    icon: 'Youtube',
  },
  discord: {
    configKey: 'discordConfig' as const,
    defaultConfig: null,
    label: 'Discord',
    description: 'Send messages to Discord channels',
    category: 'communication' as NodeCategory,
    icon: 'MessageCircle',
  },
  http_request: {
    configKey: 'httpRequestConfig' as const,
    defaultConfig: null,
    label: 'HTTP Request',
    description: 'Make HTTP requests to any API',
    category: 'data' as NodeCategory,
    icon: 'Globe',
  },
  google_sheets: {
    configKey: 'googleSheetsConfig' as const,
    defaultConfig: null,
    label: 'Google Sheets',
    description: 'Read and write spreadsheet data',
    category: 'data' as NodeCategory,
    icon: 'Sheet',
  },
  github: {
    configKey: 'githubConfig' as const,
    defaultConfig: null,
    label: 'GitHub',
    description: 'Create issues and manage repositories',
    category: 'data' as NodeCategory,
    icon: 'Github',
  },
  notion: {
    configKey: 'notionConfig' as const,
    defaultConfig: null,
    label: 'Notion',
    description: 'Create and update Notion pages',
    category: 'data' as NodeCategory,
    icon: 'FileText',
  },
  airtable: {
    configKey: 'airtableConfig' as const,
    defaultConfig: null,
    label: 'Airtable',
    description: 'Read and write Airtable records',
    category: 'data' as NodeCategory,
    icon: 'Table',
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

// Category display order and labels
export const CATEGORY_ORDER: NodeCategory[] = ['core', 'communication', 'data', 'scheduling', 'utility'];
export const CATEGORY_LABELS: Record<NodeCategory, string> = {
  core: 'Core',
  communication: 'Communication',
  data: 'Data & APIs',
  scheduling: 'Scheduling',
  utility: 'Utility',
};

// Get default config for a node type
// Returns a deep clone to prevent shared object references between nodes
export function getDefaultConfig(type: NodeType) {
  const config = NODE_CONFIGS[type].defaultConfig;
  if (config === null) return null;
  // Deep clone the config to prevent reference sharing
  return JSON.parse(JSON.stringify(config));
}

// Get config key for a node type
export function getConfigKey(type: NodeType): ConfigKey {
  return NODE_CONFIGS[type].configKey;
}

// Check if a node type has a config
export function hasConfig(type: NodeType): boolean {
  return NODE_CONFIGS[type].configKey !== null;
}

// Get label for a node type
export function getNodeLabel(type: NodeType): string {
  return NODE_CONFIGS[type].label;
}
