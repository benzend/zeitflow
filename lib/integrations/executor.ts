/**
 * Unified Integration Executor
 *
 * Handles execution of any integration with:
 * - Config validation via Zod schema
 * - Variable substitution
 * - Structured logging
 * - Consistent error handling
 */

import { ExecutionContext, IntegrationResult, IntegrationLogger } from './types';
import { getIntegration, isIntegration } from './registry';
import { createIntegrationLogger, LoggerConfig } from './logger';
import { getIntegrationExecutor } from './executors';

/**
 * Options for integration execution
 */
export interface ExecuteIntegrationOptions {
  /** Integration ID (e.g., 'email', 'slack', 'sms') */
  integrationId: string;
  /** Node configuration from the workflow */
  config: unknown;
  /** User ID executing the workflow */
  userId: string;
  /** Workflow execution ID */
  executionId: string;
  /** Node ID being executed */
  nodeId: string;
  /** Variables collected from upstream nodes */
  variables: Record<string, unknown>;
  /** Optional database instance for integrations that need it */
  db?: unknown;
  /** Logger configuration */
  loggerConfig?: LoggerConfig;
}

/**
 * Result of integration execution with logging
 */
export interface ExecuteIntegrationResult extends IntegrationResult {
  /** Logger instance with all log entries */
  logger: IntegrationLogger;
  /** Execution duration in milliseconds */
  durationMs: number;
}

/**
 * Substitute {{variable}} placeholders in a template string
 */
export function substituteVariables(
  template: string,
  variables: Record<string, unknown>
): string {
  if (!template) return template;

  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();

    // Check for direct variable match
    if (trimmedKey in variables) {
      const value = variables[trimmedKey];
      // Handle different types
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    }

    // Check for nested property access (e.g., {{node.field}})
    const parts = trimmedKey.split('.');
    let current: unknown = variables;
    for (const part of parts) {
      if (current === null || current === undefined) break;
      if (typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        current = undefined;
        break;
      }
    }

    if (current !== undefined && current !== null) {
      if (typeof current === 'object') return JSON.stringify(current);
      return String(current);
    }

    // Return original placeholder if not found
    return match;
  });
}

/**
 * Execute an integration with full validation, logging, and error handling
 */
export async function executeIntegration(
  options: ExecuteIntegrationOptions
): Promise<ExecuteIntegrationResult> {
  const {
    integrationId,
    config,
    userId,
    executionId,
    nodeId,
    variables,
    db,
    loggerConfig,
  } = options;

  const startTime = performance.now();
  const logger = createIntegrationLogger(integrationId, nodeId, executionId, loggerConfig);

  logger.info('Starting integration execution', {
    integrationId,
    nodeId,
    executionId,
    variableCount: Object.keys(variables).length,
  });

  // Check if integration exists
  if (!isIntegration(integrationId)) {
    const error = `Unknown integration: ${integrationId}`;
    logger.error(error);
    return {
      success: false,
      error,
      logger,
      durationMs: Math.round(performance.now() - startTime),
    };
  }

  const integration = getIntegration(integrationId)!;

  // Validate config with Zod schema
  logger.debug('Validating config');
  const parseResult = integration.configSchema.safeParse(config);
  if (!parseResult.success) {
    const error = `Config validation failed: ${parseResult.error.message}`;
    logger.error(error, { zodError: parseResult.error.issues });
    return {
      success: false,
      error,
      logger,
      durationMs: Math.round(performance.now() - startTime),
    };
  }

  // Create execution context
  const context: ExecutionContext = {
    userId,
    executionId,
    nodeId,
    variables,
    substituteVariables: (template: string) => substituteVariables(template, variables),
    logger,
    db,
  };

  // Get the executor function for this integration
  const executor = getIntegrationExecutor(integrationId);
  if (!executor) {
    const error = `No executor found for integration: ${integrationId}`;
    logger.error(error);
    return {
      success: false,
      error,
      logger,
      durationMs: Math.round(performance.now() - startTime),
    };
  }

  // Execute the integration
  try {
    logger.debug('Executing integration');
    const result = await executor(parseResult.data, context);

    const durationMs = Math.round(performance.now() - startTime);

    if (result.success) {
      logger.info('Integration execution completed successfully', {
        durationMs,
        hasData: !!result.data,
      });
    } else {
      logger.error('Integration execution failed', {
        error: result.error,
        durationMs,
      });
    }

    return {
      ...result,
      logger,
      durationMs,
    };
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    const error = err instanceof Error ? err.message : 'Unknown error during execution';

    logger.error('Integration execution threw exception', {
      error,
      stack: err instanceof Error ? err.stack : undefined,
      durationMs,
    });

    return {
      success: false,
      error,
      logger,
      durationMs,
    };
  }
}

/**
 * Execute multiple integrations in parallel
 */
export async function executeIntegrationsParallel(
  executions: ExecuteIntegrationOptions[]
): Promise<ExecuteIntegrationResult[]> {
  return Promise.all(executions.map(executeIntegration));
}

/**
 * Execute multiple integrations in sequence
 */
export async function executeIntegrationsSequential(
  executions: ExecuteIntegrationOptions[]
): Promise<ExecuteIntegrationResult[]> {
  const results: ExecuteIntegrationResult[] = [];

  for (const execution of executions) {
    const result = await executeIntegration(execution);
    results.push(result);

    // Stop on first failure if desired
    if (!result.success) {
      break;
    }
  }

  return results;
}

/**
 * Helper to build options from workflow execution context
 */
export function buildExecutionOptions(params: {
  nodeType: string;
  nodeConfig: unknown;
  userId: string;
  executionId: string;
  nodeId: string;
  collectedVariables: Record<string, unknown>;
  db?: unknown;
  loggerConfig?: LoggerConfig;
}): ExecuteIntegrationOptions {
  return {
    integrationId: params.nodeType,
    config: params.nodeConfig,
    userId: params.userId,
    executionId: params.executionId,
    nodeId: params.nodeId,
    variables: params.collectedVariables,
    db: params.db,
    loggerConfig: params.loggerConfig,
  };
}
