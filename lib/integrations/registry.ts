/**
 * Integration Registry
 *
 * Central registry for all workflow integrations.
 * To add a new integration:
 * 1. Create a definition file in ./definitions/
 * 2. Import and add it to the integrations object below
 *
 * That's it! The integration will automatically:
 * - Appear in the node palette
 * - Have config UI generated from its schema
 * - Validate with Zod
 * - Execute with variable substitution
 * - Return consistent output format
 */

import { IntegrationDefinition, INTEGRATION_CONFIG_KEYS, IntegrationId } from './types';
import { emailIntegration } from './definitions/email';
import { slackIntegration } from './definitions/slack';
import { smsIntegration } from './definitions/sms';

/**
 * All registered integrations
 */
const integrations = {
  email: emailIntegration,
  slack: slackIntegration,
  sms: smsIntegration,
} as const;

export type RegisteredIntegrationId = keyof typeof integrations;

/**
 * Get an integration definition by ID
 */
export function getIntegration(id: string): IntegrationDefinition | undefined {
  const integration = integrations[id as RegisteredIntegrationId];
  // Cast needed because specific Zod schemas are more narrow than ZodTypeAny
  return integration as unknown as IntegrationDefinition | undefined;
}

/**
 * Get all registered integrations
 */
export function getAllIntegrations(): IntegrationDefinition[] {
  // Cast needed because specific Zod schemas are more narrow than ZodTypeAny
  return Object.values(integrations) as unknown as IntegrationDefinition[];
}

/**
 * Get all integration IDs
 */
export function getIntegrationIds(): RegisteredIntegrationId[] {
  return Object.keys(integrations) as RegisteredIntegrationId[];
}

/**
 * Get integrations by category
 */
export function getIntegrationsByCategory(
  category: IntegrationDefinition['category']
): IntegrationDefinition[] {
  return getAllIntegrations().filter(i => i.category === category);
}

/**
 * Check if a node type is a registered integration
 */
export function isIntegration(nodeType: string): nodeType is RegisteredIntegrationId {
  return nodeType in integrations;
}

/**
 * Get the config key for an integration (for backward compatibility with NodeData)
 */
export function getIntegrationConfigKey(
  integrationId: string
): (typeof INTEGRATION_CONFIG_KEYS)[IntegrationId] | undefined {
  return INTEGRATION_CONFIG_KEYS[integrationId as IntegrationId];
}

/**
 * Get default config for an integration
 */
export function getIntegrationDefaultConfig(integrationId: string): unknown | undefined {
  const integration = getIntegration(integrationId);
  return integration?.defaultConfig;
}

/**
 * Validate config for an integration using its Zod schema
 */
export function validateIntegrationConfig(
  integrationId: string,
  config: unknown
): { success: true; data: unknown } | { success: false; error: string } {
  const integration = getIntegration(integrationId);
  if (!integration) {
    return { success: false, error: `Unknown integration: ${integrationId}` };
  }

  const result = integration.configSchema.safeParse(config);
  if (!result.success) {
    return { success: false, error: result.error.message };
  }

  return { success: true, data: result.data };
}

/**
 * Integration metadata for UI rendering
 */
export interface IntegrationUIMetadata {
  id: string;
  name: string;
  description: string;
  category: IntegrationDefinition['category'];
  icon: IntegrationDefinition['icon'];
  color: string;
  uiConfig: IntegrationDefinition['uiConfig'];
  outputVariables: IntegrationDefinition['outputVariables'];
  auth: IntegrationDefinition['auth'];
}

/**
 * Get UI metadata for an integration (safe for client-side use)
 */
export function getIntegrationUIMetadata(integrationId: string): IntegrationUIMetadata | undefined {
  const integration = getIntegration(integrationId);
  if (!integration) return undefined;

  return {
    id: integration.id,
    name: integration.name,
    description: integration.description,
    category: integration.category,
    icon: integration.icon,
    color: integration.color,
    uiConfig: integration.uiConfig,
    outputVariables: integration.outputVariables,
    auth: integration.auth,
  };
}

/**
 * Get UI metadata for all integrations
 */
export function getAllIntegrationUIMetadata(): IntegrationUIMetadata[] {
  return getAllIntegrations().map(i => getIntegrationUIMetadata(i.id)!);
}

// Re-export the integrations object for direct access
export { integrations };
