/**
 * Agent Tools Bridge
 *
 * Converts AgentToolConfig[] into Vercel AI SDK tool definitions.
 * Bridges integration definitions and custom API tools for use in agent execution.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { AgentToolConfig } from './workflow-types';
import { getIntegration } from './integrations/registry';
import { executeIntegration } from './integrations/executor';
import { IntegrationLogger } from './integrations/types';

export interface AgentToolContext {
  userId: string;
  executionId: string;
  nodeId: string;
  variables: Record<string, unknown>;
  logger: IntegrationLogger;
  db?: unknown;
}

/**
 * Build Vercel AI SDK tools from AgentToolConfig array
 */
export function buildAgentTools(
  toolConfigs: AgentToolConfig[],
  context: AgentToolContext
): Record<string, ReturnType<typeof tool>> {
  const tools: Record<string, ReturnType<typeof tool>> = {};

  for (const toolConfig of toolConfigs) {
    if (toolConfig.type === 'integration' && toolConfig.integrationId) {
      const integrationTool = buildIntegrationTool(toolConfig, context);
      if (integrationTool) {
        tools[toolConfig.integrationId] = integrationTool;
      }
    } else if (toolConfig.type === 'custom_api' && toolConfig.name) {
      const apiTool = buildCustomApiTool(toolConfig, context);
      if (apiTool) {
        tools[toolConfig.name] = apiTool;
      }
    }
  }

  return tools;
}

/**
 * Build a tool from an integration definition
 */
function buildIntegrationTool(
  toolConfig: AgentToolConfig,
  context: AgentToolContext
): ReturnType<typeof tool> | null {
  const integration = getIntegration(toolConfig.integrationId!);
  if (!integration) {
    context.logger.warn(`Integration not found: ${toolConfig.integrationId}`);
    return null;
  }

  return tool({
    description: integration.description,
    inputSchema: integration.configSchema,
    execute: async (args) => {
      // Merge any pre-filled defaults from the tool config
      const mergedConfig = { ...toolConfig.integrationConfig, ...args };

      context.logger.info(`Agent calling integration tool: ${toolConfig.integrationId}`, {
        toolId: toolConfig.integrationId,
      });

      const result = await executeIntegration({
        integrationId: toolConfig.integrationId!,
        config: mergedConfig,
        userId: context.userId,
        executionId: context.executionId,
        nodeId: context.nodeId,
        variables: context.variables,
        db: context.db,
      });

      // Collect logs from the integration execution
      const integrationLogs = result.logger.getEntries();
      for (const entry of integrationLogs) {
        context.logger[entry.level](entry.message, entry.data);
      }

      if (!result.success) {
        return { error: result.error };
      }

      return result.data || { success: true };
    },
  });
}

/**
 * Build a tool from a custom API definition
 */
function buildCustomApiTool(
  toolConfig: AgentToolConfig,
  context: AgentToolContext
): ReturnType<typeof tool> | null {
  if (!toolConfig.name || !toolConfig.endpoint) return null;

  // Parse the parameter schema or use a permissive fallback
  let inputSchema: z.ZodTypeAny;
  if (toolConfig.parameterSchema) {
    try {
      const parsed = JSON.parse(toolConfig.parameterSchema);
      inputSchema = jsonSchemaToZod(parsed);
    } catch {
      context.logger.warn(`Invalid parameter schema for tool ${toolConfig.name}, using permissive schema`);
      inputSchema = z.record(z.unknown());
    }
  } else {
    inputSchema = z.record(z.unknown());
  }

  return tool({
    description: toolConfig.description || `Custom API: ${toolConfig.name}`,
    inputSchema,
    execute: async (args) => {
      context.logger.info(`Agent calling custom API tool: ${toolConfig.name}`, {
        endpoint: toolConfig.endpoint,
        method: toolConfig.method,
      });

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (toolConfig.headers) {
          try {
            Object.assign(headers, JSON.parse(toolConfig.headers));
          } catch {
            context.logger.warn(`Invalid headers JSON for tool ${toolConfig.name}`);
          }
        }

        const method = toolConfig.method || 'POST';
        const fetchOptions: RequestInit = { method, headers };

        if (method !== 'GET' && method !== 'HEAD') {
          fetchOptions.body = JSON.stringify(args);
        }

        const response = await fetch(toolConfig.endpoint!, fetchOptions);

        if (!response.ok) {
          const errorText = await response.text();
          return { error: `HTTP ${response.status}: ${errorText}` };
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return await response.json();
        }
        return { result: await response.text() };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        context.logger.error(`Custom API tool error: ${errorMsg}`);
        return { error: errorMsg };
      }
    },
  });
}

/**
 * Simple JSON Schema to Zod converter for common patterns.
 * Handles objects with string/number/boolean/array properties.
 */
function jsonSchemaToZod(schema: Record<string, unknown>): z.ZodTypeAny {
  if (!schema.type) return z.record(z.unknown());

  switch (schema.type) {
    case 'object': {
      const properties = (schema.properties || {}) as Record<string, Record<string, unknown>>;
      const required = (schema.required || []) as string[];
      const shape: Record<string, z.ZodTypeAny> = {};

      for (const [key, prop] of Object.entries(properties)) {
        let field = jsonSchemaToZod(prop);
        if (!required.includes(key)) {
          field = field.optional();
        }
        shape[key] = field;
      }

      return z.object(shape);
    }
    case 'string':
      return z.string();
    case 'number':
    case 'integer':
      return z.number();
    case 'boolean':
      return z.boolean();
    case 'array': {
      const items = (schema.items || {}) as Record<string, unknown>;
      return z.array(jsonSchemaToZod(items));
    }
    default:
      return z.unknown();
  }
}
