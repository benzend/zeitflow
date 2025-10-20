export interface Field {
  id: string;
  key: string;
  type: string;
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
}

export interface NodeData {
  id: string;
  type: 'endpoint' | 'ai' | 'scheduler' | 'review';
  x: number;
  y: number;
  label: string;
  fields?: Field[];
  aiConfig?: AINodeConfig;
  schedulerConfig?: SchedulerConfig;
  reviewConfig?: ReviewConfig;
}

export interface Connection {
  from: string;
  to: string;
}