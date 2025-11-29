export interface Field {
  id: string;
  key: string;
  name: string;
  type: string;
  label?: string;
}

export interface AINodeConfig {
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

export interface NodeData {
  id: string;
  type: 'entry' | 'ai' | 'scheduler' | 'review' | 'slack';
  x: number;
  y: number;
  label: string;
  fields?: Field[];
  entryType?: string;
  aiConfig?: AINodeConfig;
  schedulerConfig?: SchedulerConfig;
  reviewConfig?: ReviewConfig;
}

export interface Connection {
  from: string;
  to: string;
}