export interface Field {
  id: string;
  key: string;
  name: string;
  type: string;
  label?: string;
}

export interface AINodeConfig {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  outputType: string;
  outputStructure: string;
  hasTemplate?: boolean;
  templateText?: string;
}

export interface SchedulerConfig {
  people: string[];
  minTimeRequirement: string;
  calendar: string;
}

export interface ReviewConfig {
  validationSteps: {
    nodeId: string;
    validated: boolean;
  }[];
  meetingConfirmed?: boolean;
}

export interface EmailConfig {
  to: string[];
  subject?: string;
  message?: string;
  from?: string; // Defaults to noreply@zeitflow.io
}

export interface SlackConfig {
  botId?: number; // Reference to slackBotsTable.id
  channel: string;
  message?: string;
}

export interface SMSConfig {
  to: string[]; // Array of recipient phone numbers in E.164 format
  message?: string; // Message body (160 chars for single SMS)
  twilioAccountSid?: string; // Optional override for system TWILIO_ACCOUNT_SID
  twilioAuthToken?: string; // Optional override for system TWILIO_AUTH_TOKEN
  twilioPhoneNumber?: string; // Optional override for system TWILIO_PHONE_NUMBER
}

export interface TelegramConfig {
  chatId: string; // Telegram chat ID (user, group, or channel)
  message?: string; // Message body (supports Markdown)
  botToken?: string; // Optional override for system TELEGRAM_BOT_TOKEN
}

export interface ConditionConfig {
  leftValue: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  rightValue: string;
}

export interface AgentToolConfig {
  id: string;
  type: 'integration' | 'custom_api';
  // For integration tools:
  integrationId?: string;
  integrationConfig?: Record<string, unknown>;
  // For custom API tools:
  name?: string;
  description?: string;
  parameterSchema?: string;
  endpoint?: string;
  method?: string;
  headers?: string;
}

export interface AgentNodeConfig {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxSteps: number;
  maxTokens?: number;
  tools: AgentToolConfig[];
  outputType: 'text' | 'structured';
  outputStructure?: string;
}

export interface YouTubeConfig {
  mode: 'fetch' | 'comment';
  videoUrl?: string;
  commentText?: string;
}

export interface NodeData {
  id: string;
  type: 'entry' | 'ai' | 'agent' | 'scheduler' | 'review' | 'slack' | 'email' | 'sms' | 'telegram' | 'condition' | 'youtube';
  x: number;
  y: number;
  label: string;
  fields?: Field[];
  entryType?: string;
  aiConfig?: AINodeConfig;
  agentConfig?: AgentNodeConfig;
  schedulerConfig?: SchedulerConfig;
  reviewConfig?: ReviewConfig;
  emailConfig?: EmailConfig;
  slackConfig?: SlackConfig;
  smsConfig?: SMSConfig;
  telegramConfig?: TelegramConfig;
  conditionConfig?: ConditionConfig;
  youtubeConfig?: YouTubeConfig;
}

export interface Connection {
  from: string;
  to: string;
  sourceHandle?: string;
  targetHandle?: string;
}