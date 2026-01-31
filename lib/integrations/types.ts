import { z } from 'zod';
import { ReactNode } from 'react';

/**
 * Log levels for structured logging
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Structured log entry
 */
export interface LogEntry {
  /** Timestamp of the log entry */
  timestamp: Date;
  /** Log level */
  level: LogLevel;
  /** Integration ID */
  integrationId: string;
  /** Node ID in the workflow */
  nodeId: string;
  /** Workflow execution ID */
  executionId: string;
  /** Log message */
  message: string;
  /** Additional structured data */
  data?: Record<string, unknown>;
  /** Duration in ms (for timing operations) */
  durationMs?: number;
}

/**
 * Logger interface for integrations
 */
export interface IntegrationLogger {
  /** Log debug information (verbose, for development) */
  debug: (message: string, data?: Record<string, unknown>) => void;
  /** Log informational messages (normal operation) */
  info: (message: string, data?: Record<string, unknown>) => void;
  /** Log warnings (potential issues) */
  warn: (message: string, data?: Record<string, unknown>) => void;
  /** Log errors (failures) */
  error: (message: string, data?: Record<string, unknown>) => void;
  /** Start a timed operation, returns a function to end it */
  startTimer: (operation: string) => () => void;
  /** Get all log entries for this execution */
  getEntries: () => LogEntry[];
}

/**
 * Execution context passed to integration execute functions.
 * Provides access to variables, substitution helpers, and logging.
 */
export interface ExecutionContext {
  /** User ID executing the workflow */
  userId: string;
  /** Workflow execution ID */
  executionId: string;
  /** Node ID being executed */
  nodeId: string;
  /** Variables collected from upstream nodes */
  variables: Record<string, unknown>;
  /** Substitute {{variable}} placeholders in a string */
  substituteVariables: (template: string) => string;
  /** Structured logger for this execution */
  logger: IntegrationLogger;
  /** Access to database for integrations that need it (e.g., Slack bot lookup) */
  db?: unknown;
}

/**
 * Result returned by integration execute functions.
 */
export interface IntegrationResult {
  success: boolean;
  error?: string;
  /** Optional data to pass to downstream nodes */
  data?: Record<string, unknown>;
}

/**
 * UI configuration for a single config field.
 * Used by IntegrationConfigForm to auto-generate forms.
 */
export interface FieldUIConfig {
  /** Input type hint for auto-generating UI */
  hint: 'text' | 'textarea' | 'email' | 'phone' | 'select' | 'multiselect' | 'channel' | 'recipients';
  /** Label shown above the field */
  label: string;
  /** Placeholder text */
  placeholder?: string;
  /** Enable {{variable}} autocomplete */
  supportsVariables?: boolean;
  /** For select/multiselect: options to show */
  options?: { value: string; label: string }[];
  /** Validation message shown below field */
  validationHint?: string;
  /** Whether this field requires dynamic data from the server (e.g., slack bots) */
  requiresServerData?: string;
}

/**
 * Integration authentication configuration.
 */
export interface IntegrationAuth {
  /** Type of authentication required */
  type: 'none' | 'api_key' | 'oauth';
  /** Whether this integration requires user-level authentication (e.g., OAuth tokens) */
  requiresUserAuth?: boolean;
  /** Environment variable name for API key (if type is 'api_key') */
  envVar?: string;
}

/**
 * Output variable definition for downstream nodes.
 */
export interface OutputVariable {
  /** Variable name (used as {{nodeName.name}}) */
  name: string;
  /** Variable type for documentation */
  type: 'string' | 'number' | 'boolean' | 'object';
  /** Description of what this variable contains */
  description?: string;
}

/**
 * Complete integration definition.
 * This is the main interface that integration plugins implement.
 *
 * @template TConfig - Zod schema type for the config
 */
export interface IntegrationDefinition<TConfig extends z.ZodTypeAny = z.ZodTypeAny> {
  /** Unique identifier (e.g., 'email', 'slack') */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Category for grouping in UI */
  category: 'communication' | 'data' | 'scheduling' | 'utility';

  // Visual
  /** Icon component */
  icon: (props: { className?: string; color?: string }) => ReactNode;
  /** Brand/accent color (CSS color value) */
  color: string;

  // Config
  /** Zod schema for validating config */
  configSchema: TConfig;
  /** Default config values when creating a new node */
  defaultConfig: z.infer<TConfig>;
  /** UI configuration for each field */
  uiConfig: Partial<Record<keyof z.infer<TConfig>, FieldUIConfig>>;

  // Auth
  /** Authentication requirements */
  auth: IntegrationAuth;

  // Execution
  /** Execute the integration with the given config and context */
  execute: (config: z.infer<TConfig>, context: ExecutionContext) => Promise<IntegrationResult>;

  // Output
  /** Variables this integration produces for downstream nodes */
  outputVariables: OutputVariable[];
}

/**
 * Type helper to extract config type from an integration definition.
 */
export type IntegrationConfig<T extends IntegrationDefinition> =
  T extends IntegrationDefinition<infer TConfig>
    ? z.infer<TConfig>
    : never;

/**
 * Mapping of integration IDs to their config keys on NodeData.
 * Used for backward compatibility with the existing system.
 */
export const INTEGRATION_CONFIG_KEYS = {
  email: 'emailConfig',
  slack: 'slackConfig',
  sms: 'smsConfig',
  telegram: 'telegramConfig',
  condition: 'conditionConfig',
} as const;

export type IntegrationId = keyof typeof INTEGRATION_CONFIG_KEYS;
export type IntegrationConfigKey = typeof INTEGRATION_CONFIG_KEYS[IntegrationId];
