/**
 * HubSpot Integration Executor (Server-Side Only)
 *
 * This file contains the server-side execution logic for the HubSpot integration.
 * Uses HubSpot CRM API v3.
 * It should only be imported in server-side code (API routes, server components).
 */

import { ExecutionContext, IntegrationResult } from '../types';
import { HubSpotConfig } from '../definitions/hubspot';

const HUBSPOT_API = 'https://api.hubapi.com';

/**
 * Build headers for HubSpot API calls
 */
function getHubSpotHeaders(config: HubSpotConfig): Record<string, string> | null {
  const token = config.accessToken || process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) return null;

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Execute the HubSpot integration
 */
export async function executeHubSpot(
  config: HubSpotConfig,
  context: ExecutionContext
): Promise<IntegrationResult> {
  const { logger } = context;
  const endTimer = logger.startTimer('hubspot_execute');

  logger.info('Starting HubSpot operation', {
    action: config.action,
  });

  const headers = getHubSpotHeaders(config);
  if (!headers) {
    logger.error('HubSpot access token not configured');
    endTimer();
    return {
      success: false,
      error: 'HubSpot access token not configured. Set HUBSPOT_ACCESS_TOKEN env var or provide it in the node config.',
      data: { status: 'failed', error: 'Missing access token' },
    };
  }

  try {
    switch (config.action) {
      case 'create_contact':
        return await createContact(config, headers, context, logger, endTimer);
      case 'update_contact':
        return await updateContact(config, headers, context, logger, endTimer);
      case 'search_contacts':
        return await searchContacts(config, headers, context, logger, endTimer);
      case 'create_deal':
        return await createDeal(config, headers, context, logger, endTimer);
      case 'update_deal':
        return await updateDeal(config, headers, context, logger, endTimer);
      case 'search_deals':
        return await searchDeals(config, headers, context, logger, endTimer);
      default:
        logger.error('Unknown action', { action: config.action });
        endTimer();
        return {
          success: false,
          error: `Unknown HubSpot action: ${config.action}`,
          data: { status: 'failed', error: 'Unknown action' },
        };
    }
  } catch (error) {
    endTimer();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('HubSpot operation failed', { error: errorMessage });
    return {
      success: false,
      error: `HubSpot operation failed: ${errorMessage}`,
      data: { status: 'failed', error: errorMessage },
    };
  }
}

async function createContact(
  config: HubSpotConfig,
  headers: Record<string, string>,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const email = context.substituteVariables(config.email || '');
  const firstName = context.substituteVariables(config.firstName || '');
  const lastName = context.substituteVariables(config.lastName || '');
  const phone = context.substituteVariables(config.phone || '');
  const company = context.substituteVariables(config.company || '');

  if (!email) {
    logger.error('No email specified for contact creation');
    endTimer();
    return {
      success: false,
      error: 'Email is required to create a contact',
      data: { status: 'failed', error: 'Missing email' },
    };
  }

  logger.debug('Creating contact', { email });

  const properties: Record<string, string> = { email };
  if (firstName) properties.firstname = firstName;
  if (lastName) properties.lastname = lastName;
  if (phone) properties.phone = phone;
  if (company) properties.company = company;

  const response = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ properties }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('HubSpot API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `HubSpot API error: ${response.status} ${response.statusText}`,
      data: { status: 'failed', error: errorText },
    };
  }

  const data = await response.json();
  endTimer();
  logger.info('Contact created', { contactId: data.id });

  return {
    success: true,
    data: {
      status: 'created',
      contactId: data.id,
    },
  };
}

async function updateContact(
  config: HubSpotConfig,
  headers: Record<string, string>,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const contactId = context.substituteVariables(config.contactId || '');
  const email = context.substituteVariables(config.email || '');
  const firstName = context.substituteVariables(config.firstName || '');
  const lastName = context.substituteVariables(config.lastName || '');
  const phone = context.substituteVariables(config.phone || '');
  const company = context.substituteVariables(config.company || '');

  if (!contactId) {
    logger.error('No contact ID specified for update');
    endTimer();
    return {
      success: false,
      error: 'Contact ID is required to update a contact',
      data: { status: 'failed', error: 'Missing contact ID' },
    };
  }

  logger.debug('Updating contact', { contactId });

  const properties: Record<string, string> = {};
  if (email) properties.email = email;
  if (firstName) properties.firstname = firstName;
  if (lastName) properties.lastname = lastName;
  if (phone) properties.phone = phone;
  if (company) properties.company = company;

  const response = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts/${contactId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ properties }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('HubSpot API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `HubSpot API error: ${response.status} ${response.statusText}`,
      data: { status: 'failed', error: errorText },
    };
  }

  const data = await response.json();
  endTimer();
  logger.info('Contact updated', { contactId: data.id });

  return {
    success: true,
    data: {
      status: 'updated',
      contactId: data.id,
    },
  };
}

async function searchContacts(
  config: HubSpotConfig,
  headers: Record<string, string>,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const searchQuery = context.substituteVariables(config.searchQuery || '');

  if (!searchQuery) {
    logger.error('No search query specified');
    endTimer();
    return {
      success: false,
      error: 'Search query is required to search contacts',
      data: { status: 'failed', error: 'Missing search query' },
    };
  }

  logger.debug('Searching contacts', { query: searchQuery });

  const response = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts/search`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: searchQuery,
      limit: 50,
      properties: ['email', 'firstname', 'lastname', 'phone', 'company'],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('HubSpot API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `HubSpot API error: ${response.status} ${response.statusText}`,
      data: { status: 'failed', error: errorText },
    };
  }

  const data = await response.json();
  endTimer();
  logger.info('Contacts found', { count: data.total });

  const results = data.results.map((contact: Record<string, unknown>) => ({
    id: contact.id,
    ...contact.properties as Record<string, unknown>,
  }));

  return {
    success: true,
    data: {
      status: 'found',
      results,
      resultCount: data.total,
    },
  };
}

async function createDeal(
  config: HubSpotConfig,
  headers: Record<string, string>,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const dealName = context.substituteVariables(config.dealName || '');
  const amount = context.substituteVariables(config.amount || '');
  const pipeline = context.substituteVariables(config.pipeline || 'default');

  if (!dealName) {
    logger.error('No deal name specified');
    endTimer();
    return {
      success: false,
      error: 'Deal name is required to create a deal',
      data: { status: 'failed', error: 'Missing deal name' },
    };
  }

  logger.debug('Creating deal', { dealName, stage: config.dealStage });

  const properties: Record<string, string> = {
    dealname: dealName,
    dealstage: config.dealStage || 'appointmentscheduled',
    pipeline,
  };
  if (amount) properties.amount = amount;

  const response = await fetch(`${HUBSPOT_API}/crm/v3/objects/deals`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ properties }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('HubSpot API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `HubSpot API error: ${response.status} ${response.statusText}`,
      data: { status: 'failed', error: errorText },
    };
  }

  const data = await response.json();
  endTimer();
  logger.info('Deal created', { dealId: data.id });

  return {
    success: true,
    data: {
      status: 'created',
      dealId: data.id,
    },
  };
}

async function updateDeal(
  config: HubSpotConfig,
  headers: Record<string, string>,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const dealId = context.substituteVariables(config.dealId || '');
  const dealName = context.substituteVariables(config.dealName || '');
  const amount = context.substituteVariables(config.amount || '');
  const pipeline = context.substituteVariables(config.pipeline || '');

  if (!dealId) {
    logger.error('No deal ID specified for update');
    endTimer();
    return {
      success: false,
      error: 'Deal ID is required to update a deal',
      data: { status: 'failed', error: 'Missing deal ID' },
    };
  }

  logger.debug('Updating deal', { dealId });

  const properties: Record<string, string> = {};
  if (dealName) properties.dealname = dealName;
  if (config.dealStage) properties.dealstage = config.dealStage;
  if (amount) properties.amount = amount;
  if (pipeline) properties.pipeline = pipeline;

  const response = await fetch(`${HUBSPOT_API}/crm/v3/objects/deals/${dealId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ properties }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('HubSpot API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `HubSpot API error: ${response.status} ${response.statusText}`,
      data: { status: 'failed', error: errorText },
    };
  }

  const data = await response.json();
  endTimer();
  logger.info('Deal updated', { dealId: data.id });

  return {
    success: true,
    data: {
      status: 'updated',
      dealId: data.id,
    },
  };
}

async function searchDeals(
  config: HubSpotConfig,
  headers: Record<string, string>,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const searchQuery = context.substituteVariables(config.searchQuery || '');

  if (!searchQuery) {
    logger.error('No search query specified');
    endTimer();
    return {
      success: false,
      error: 'Search query is required to search deals',
      data: { status: 'failed', error: 'Missing search query' },
    };
  }

  logger.debug('Searching deals', { query: searchQuery });

  const response = await fetch(`${HUBSPOT_API}/crm/v3/objects/deals/search`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: searchQuery,
      limit: 50,
      properties: ['dealname', 'dealstage', 'amount', 'pipeline', 'closedate'],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('HubSpot API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `HubSpot API error: ${response.status} ${response.statusText}`,
      data: { status: 'failed', error: errorText },
    };
  }

  const data = await response.json();
  endTimer();
  logger.info('Deals found', { count: data.total });

  const results = data.results.map((deal: Record<string, unknown>) => ({
    id: deal.id,
    ...deal.properties as Record<string, unknown>,
  }));

  return {
    success: true,
    data: {
      status: 'found',
      results,
      resultCount: data.total,
    },
  };
}
