/**
 * HTTP Request Integration Executor (Server-Side Only)
 *
 * This file contains the server-side execution logic for the HTTP Request integration.
 * It should only be imported in server-side code (API routes, server components).
 */

import { ExecutionContext, IntegrationResult } from '../types';
import { HttpRequestConfig } from '../definitions/http-request';

/**
 * Execute the HTTP Request integration
 */
export async function executeHttpRequest(
  config: HttpRequestConfig,
  context: ExecutionContext
): Promise<IntegrationResult> {
  const { logger } = context;
  const endTimer = logger.startTimer('http_request_execute');

  logger.info('Starting HTTP request', {
    method: config.method,
    hasUrl: !!config.url,
    hasBody: !!config.body,
    authType: config.authType,
  });

  // Substitute variables
  const url = context.substituteVariables(config.url || '');
  const body = context.substituteVariables(config.body || '');
  const authValue = context.substituteVariables(config.authValue || '');
  const headersRaw = context.substituteVariables(config.headers || '');

  logger.debug('Variables substituted', {
    url: url.substring(0, 50) + (url.length > 50 ? '...' : ''),
    method: config.method,
  });

  // Validate URL
  if (!url) {
    logger.error('No URL specified');
    endTimer();
    return {
      success: false,
      error: 'No URL specified',
      data: { status: 'failed', error: 'Missing URL' },
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

  // Merge headers (custom headers first, auth headers override)
  const headers: Record<string, string> = {
    ...customHeaders,
    ...authHeaders,
  };

  try {
    const fetchOptions: RequestInit = {
      method: config.method,
      headers,
    };

    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(config.method) && body) {
      fetchOptions.body = body;
    }

    logger.debug('Sending HTTP request', { method: config.method, url: url.substring(0, 80) });

    const response = await fetch(url, fetchOptions);
    const responseBody = await response.text();

    // Try to parse as JSON
    let parsedBody: unknown = undefined;
    try {
      parsedBody = JSON.parse(responseBody);
    } catch {
      // Not JSON, that's fine
    }

    endTimer();

    logger.info('HTTP request completed', {
      statusCode: response.status,
      bodyLength: responseBody.length,
      isJson: parsedBody !== undefined,
    });

    return {
      success: true,
      data: {
        statusCode: response.status,
        body: responseBody,
        parsedBody,
        status: response.ok ? 'success' : 'error',
      },
    };
  } catch (error) {
    endTimer();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('HTTP request failed', { error: errorMessage });

    return {
      success: false,
      error: `HTTP request failed: ${errorMessage}`,
      data: { status: 'failed', error: errorMessage },
    };
  }
}
