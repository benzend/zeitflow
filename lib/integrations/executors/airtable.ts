/**
 * Airtable Integration Executor (Server-Side Only)
 *
 * This file contains the server-side execution logic for the Airtable integration.
 * It should only be imported in server-side code (API routes, server components).
 */

import { ExecutionContext, IntegrationResult } from '../types';
import { AirtableConfig } from '../definitions/airtable';

const AIRTABLE_API = 'https://api.airtable.com/v0';

/**
 * Execute the Airtable integration
 */
export async function executeAirtable(
  config: AirtableConfig,
  context: ExecutionContext
): Promise<IntegrationResult> {
  const { logger } = context;
  const endTimer = logger.startTimer('airtable_execute');

  logger.info('Starting Airtable operation', {
    action: config.action,
    hasBaseId: !!config.baseId,
    hasTableId: !!config.tableId,
  });

  // Determine API key
  const apiKey = config.apiKey || process.env.AIRTABLE_API_KEY;

  if (!apiKey) {
    logger.error('Airtable API key not configured');
    endTimer();
    return {
      success: false,
      error: 'Airtable API key not configured. Set AIRTABLE_API_KEY env var or provide a token in node config.',
      data: { status: 'failed', error: 'Missing API key' },
    };
  }

  // Substitute variables
  const baseId = context.substituteVariables(config.baseId || '');
  const tableId = context.substituteVariables(config.tableId || '');
  const recordId = context.substituteVariables(config.recordId || '');
  const fieldsRaw = context.substituteVariables(config.fields || '');

  // Validate base ID
  if (!baseId) {
    logger.error('No base ID specified');
    endTimer();
    return {
      success: false,
      error: 'No base ID specified',
      data: { status: 'failed', error: 'Missing base ID' },
    };
  }

  // Validate table ID
  if (!tableId) {
    logger.error('No table ID specified');
    endTimer();
    return {
      success: false,
      error: 'No table ID or name specified',
      data: { status: 'failed', error: 'Missing table' },
    };
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const baseUrl = `${AIRTABLE_API}/${baseId}/${tableId}`;

  try {
    if (config.action === 'list_records') {
      return await listRecords(baseUrl, headers, logger, endTimer);
    } else if (config.action === 'create_record') {
      return await createRecord(baseUrl, fieldsRaw, headers, logger, endTimer);
    } else {
      return await updateRecord(baseUrl, recordId, fieldsRaw, headers, logger, endTimer);
    }
  } catch (error) {
    endTimer();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Airtable operation failed', { error: errorMessage });

    return {
      success: false,
      error: `Airtable operation failed: ${errorMessage}`,
      data: { status: 'failed', error: errorMessage },
    };
  }
}

async function listRecords(
  baseUrl: string,
  headers: Record<string, string>,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  logger.debug('Listing records');

  const response = await fetch(baseUrl, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('Airtable API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `Airtable API error: ${response.status}`,
      data: { status: 'failed', error: errorText },
    };
  }

  const data = await response.json();
  endTimer();
  logger.info('Records listed', { count: data.records.length });

  return {
    success: true,
    data: {
      status: 'listed',
      records: data.records,
      recordCount: data.records.length,
    },
  };
}

async function createRecord(
  baseUrl: string,
  fieldsRaw: string,
  headers: Record<string, string>,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  if (!fieldsRaw) {
    logger.error('No fields specified for record creation');
    endTimer();
    return {
      success: false,
      error: 'No fields specified for record creation',
      data: { status: 'failed', error: 'Missing fields' },
    };
  }

  let fields: Record<string, unknown>;
  try {
    fields = JSON.parse(fieldsRaw);
  } catch {
    logger.error('Invalid JSON in fields');
    endTimer();
    return {
      success: false,
      error: 'Invalid JSON in fields. Fields must be a valid JSON object.',
      data: { status: 'failed', error: 'Invalid JSON fields' },
    };
  }

  logger.debug('Creating record', { fieldCount: Object.keys(fields).length });

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('Airtable API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `Airtable API error: ${response.status}`,
      data: { status: 'failed', error: errorText },
    };
  }

  const data = await response.json();
  endTimer();
  logger.info('Record created', { recordId: data.id });

  return {
    success: true,
    data: {
      status: 'created',
      recordId: data.id,
      fields: data.fields,
    },
  };
}

async function updateRecord(
  baseUrl: string,
  recordId: string,
  fieldsRaw: string,
  headers: Record<string, string>,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  if (!recordId) {
    logger.error('No record ID specified for update');
    endTimer();
    return {
      success: false,
      error: 'No record ID specified for update',
      data: { status: 'failed', error: 'Missing record ID' },
    };
  }

  if (!fieldsRaw) {
    logger.error('No fields specified for record update');
    endTimer();
    return {
      success: false,
      error: 'No fields specified for record update',
      data: { status: 'failed', error: 'Missing fields' },
    };
  }

  let fields: Record<string, unknown>;
  try {
    fields = JSON.parse(fieldsRaw);
  } catch {
    logger.error('Invalid JSON in fields');
    endTimer();
    return {
      success: false,
      error: 'Invalid JSON in fields. Fields must be a valid JSON object.',
      data: { status: 'failed', error: 'Invalid JSON fields' },
    };
  }

  logger.debug('Updating record', { recordId });

  const response = await fetch(`${baseUrl}/${recordId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('Airtable API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `Airtable API error: ${response.status}`,
      data: { status: 'failed', error: errorText },
    };
  }

  const data = await response.json();
  endTimer();
  logger.info('Record updated', { recordId: data.id });

  return {
    success: true,
    data: {
      status: 'updated',
      recordId: data.id,
      fields: data.fields,
    },
  };
}
