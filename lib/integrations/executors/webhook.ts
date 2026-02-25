/**
 * Outgoing Webhook Integration Executor (Server-Side Only)
 *
 * This file contains the server-side execution logic for the outgoing Webhook integration.
 * Sends HTTP requests to user-configured URLs with variable substitution.
 * It should only be imported in server-side code (API routes, server components).
 */

import { ExecutionContext, IntegrationResult } from '../types';
import { WebhookConfig } from '../definitions/webhook';

/**
 * Execute the outgoing Webhook integration
 */
export async function executeWebhook(
  config: WebhookConfig,
  context: ExecutionContext
): Promise<IntegrationResult> {
  const { logger } = context;
  const endTimer = logger.startTimer('webhook_execute');

  logger.info('Starting outgoing webhook', {
    method: config.method,
    hasUrl: !!config.url,
    authType: config.authType,
    retryOnFailure: config.retryOnFailure,
  });

  // Substitute variables
  const url = context.substituteVariables(config.url || '');
  const authValue = context.substituteVariables(config.authValue || '');
  const headersRaw = context.substituteVariables(config.headers || '');

  logger.debug('Variables substituted', {
    url: url.substring(0, 50) + (url.length > 50 ? '...' : ''),
    method: config.method,
  });

  // Validate URL
  if (!url) {
    logger.error('No webhook URL specified');
    endTimer();
    return {
      success: false,
      error: 'No webhook URL specified',
      data: { status: 'failed', error: 'Missing URL' },
    };
  }

  try {
    new URL(url);
  } catch {
    logger.error('Invalid webhook URL format');
    endTimer();
    return {
      success: false,
      error: 'Invalid webhook URL: not a valid URL',
      data: { status: 'failed', error: 'Invalid URL format' },
    };
  }

  // Parse custom headers
  let customHeaders: Record<string, string> = {};
  if (headersRaw.trim()) {
    try {
      customHeaders = JSON.parse(headersRaw);
    } catch {
      logger.error('Invalid JSON in headers');
      endTimer();
      return {
        success: false,
        error: 'Invalid JSON in headers field. Headers must be a valid JSON object.',
        data: { status: 'failed', error: 'Invalid header JSON' },
      };
    }
  }

  // Build auth headers
  const authHeaders: Record<string, string> = {};
  if (config.authType === 'bearer' && authValue) {
    authHeaders['Authorization'] = `Bearer ${authValue}`;
  } else if (config.authType === 'basic' && authValue) {
    const encoded = Buffer.from(authValue).toString('base64');
    authHeaders['Authorization'] = `Basic ${encoded}`;
  } else if (config.authType === 'api_key' && authValue) {
    authHeaders['X-API-Key'] = authValue;
  }

  // Build body
  let body: string;
  if (config.bodyTemplate?.trim()) {
    body = context.substituteVariables(config.bodyTemplate);
  } else {
    // Default: send all upstream variables as JSON
    body = JSON.stringify(context.variables);
  }

  // Merge headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
    ...authHeaders,
  };

  const maxAttempts = config.retryOnFailure ? Math.min(config.maxRetries || 3, 5) : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logger.debug('Sending webhook request', { attempt, maxAttempts });

      const response = await fetch(url, {
        method: config.method,
        headers,
        body,
      });

      const responseBody = await response.text();

      // Try to parse as JSON
      let parsedBody: unknown = undefined;
      try {
        parsedBody = JSON.parse(responseBody);
      } catch {
        // Not JSON, that's fine
      }

      if (!response.ok && attempt < maxAttempts) {
        logger.warn('Webhook request failed, retrying', {
          attempt,
          statusCode: response.status,
        });
        // Exponential backoff: 1s, 2s, 4s...
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        continue;
      }

      endTimer();

      if (!response.ok) {
        logger.error('Webhook request failed', {
          statusCode: response.status,
          attempts: attempt,
        });
        return {
          success: false,
          error: `Webhook failed with status ${response.status}: ${responseBody.substring(0, 200)}`,
          data: {
            statusCode: response.status,
            body: responseBody,
            parsedBody,
            status: 'failed',
            error: `HTTP ${response.status}`,
          },
        };
      }

      logger.info('Webhook sent successfully', {
        statusCode: response.status,
        bodyLength: responseBody.length,
        attempts: attempt,
      });

      return {
        success: true,
        data: {
          statusCode: response.status,
          body: responseBody,
          parsedBody,
          status: 'sent',
        },
      };
    } catch (error) {
      if (attempt < maxAttempts) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.warn('Webhook request error, retrying', {
          attempt,
          error: errorMessage,
        });
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        continue;
      }

      endTimer();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Webhook request failed after all retries', {
        error: errorMessage,
        attempts: attempt,
      });

      return {
        success: false,
        error: `Webhook failed: ${errorMessage}`,
        data: { status: 'failed', error: errorMessage },
      };
    }
  }

  // Should not reach here, but TypeScript needs a return
  endTimer();
  return {
    success: false,
    error: 'Webhook failed: unexpected state',
    data: { status: 'failed', error: 'Unexpected state' },
  };
}
