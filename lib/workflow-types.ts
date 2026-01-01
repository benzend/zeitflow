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

export interface NodeData {
  id: string;
  type: 'entry' | 'ai' | 'scheduler' | 'review' | 'slack' | 'email';
  x: number;
  y: number;
  label: string;
  fields?: Field[];
  entryType?: string;
  aiConfig?: AINodeConfig;
  schedulerConfig?: SchedulerConfig;
  reviewConfig?: ReviewConfig;
  emailConfig?: EmailConfig;
  slackConfig?: SlackConfig;
}

export interface Connection {
  from: string;
  to: string;
}