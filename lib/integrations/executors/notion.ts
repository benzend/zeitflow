/**
 * Notion Integration Executor (Server-Side Only)
 *
 * This file contains the server-side execution logic for the Notion integration.
 * It should only be imported in server-side code (API routes, server components).
 */

import { ExecutionContext, IntegrationResult } from '../types';
import { NotionConfig } from '../definitions/notion';

const NOTION_API = 'https://api.notion.com';
const NOTION_VERSION = '2022-06-28';

/**
 * Execute the Notion integration
 */
export async function executeNotion(
  config: NotionConfig,
  context: ExecutionContext
): Promise<IntegrationResult> {
  const { logger } = context;
  const endTimer = logger.startTimer('notion_execute');

  logger.info('Starting Notion operation', {
    action: config.action,
    hasDatabaseId: !!config.databaseId,
    hasApiKey: !!config.apiKey,
  });

  // Determine API key
  const apiKey = config.apiKey || process.env.NOTION_API_KEY;

  if (!apiKey) {
    logger.error('Notion API key not configured');
    endTimer();
    return {
      success: false,
      error: 'Notion API key not configured. Set NOTION_API_KEY env var or provide a token in node config.',
      data: { status: 'failed', error: 'Missing API key' },
    };
  }

  // Substitute variables
  const databaseId = context.substituteVariables(config.databaseId || '');
  const title = context.substituteVariables(config.title || '');
  const content = context.substituteVariables(config.content || '');

  // Validate database/page ID
  if (!databaseId) {
    logger.error('No database/page ID specified');
    endTimer();
    return {
      success: false,
      error: 'No database or page ID specified',
      data: { status: 'failed', error: 'Missing database/page ID' },
    };
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Notion-Version': NOTION_VERSION,
  };

  try {
    if (config.action === 'create_page') {
      return await createPage(databaseId, title, content, headers, logger, endTimer);
    } else if (config.action === 'query_database') {
      return await queryDatabase(databaseId, headers, logger, endTimer);
    } else {
      return await appendBlock(databaseId, content, headers, logger, endTimer);
    }
  } catch (error) {
    endTimer();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Notion operation failed', { error: errorMessage });

    return {
      success: false,
      error: `Notion operation failed: ${errorMessage}`,
      data: { status: 'failed', error: errorMessage },
    };
  }
}

async function createPage(
  databaseId: string,
  title: string,
  content: string,
  headers: Record<string, string>,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  if (!title) {
    logger.error('No title specified for page');
    endTimer();
    return {
      success: false,
      error: 'No title specified for page creation',
      data: { status: 'failed', error: 'Missing title' },
    };
  }

  logger.debug('Creating page in database', { databaseId, title });

  const body: Record<string, unknown> = {
    parent: { database_id: databaseId },
    properties: {
      Name: {
        title: [{ text: { content: title } }],
      },
    },
  };

  // Add content as page children if provided
  if (content) {
    body.children = [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content } }],
        },
      },
    ];
  }

  const response = await fetch(`${NOTION_API}/v1/pages`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('Notion API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `Notion API error: ${response.status}`,
      data: { status: 'failed', error: errorText },
    };
  }

  const data = await response.json();
  endTimer();
  logger.info('Page created', { pageId: data.id, url: data.url });

  return {
    success: true,
    data: {
      status: 'created',
      pageId: data.id,
      url: data.url,
    },
  };
}

async function queryDatabase(
  databaseId: string,
  headers: Record<string, string>,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  logger.debug('Querying database', { databaseId });

  const response = await fetch(`${NOTION_API}/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('Notion API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `Notion API error: ${response.status}`,
      data: { status: 'failed', error: errorText },
    };
  }

  const data = await response.json();
  endTimer();
  logger.info('Database queried', { resultCount: data.results.length });

  return {
    success: true,
    data: {
      status: 'queried',
      results: data.results,
      resultCount: data.results.length,
      hasMore: data.has_more,
    },
  };
}

async function appendBlock(
  pageId: string,
  content: string,
  headers: Record<string, string>,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  if (!content) {
    logger.error('No content specified for append');
    endTimer();
    return {
      success: false,
      error: 'No content specified to append',
      data: { status: 'failed', error: 'Missing content' },
    };
  }

  logger.debug('Appending block to page', { pageId });

  const response = await fetch(`${NOTION_API}/v1/blocks/${pageId}/children`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content } }],
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('Notion API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `Notion API error: ${response.status}`,
      data: { status: 'failed', error: errorText },
    };
  }

  const data = await response.json();
  endTimer();
  logger.info('Block appended', { blockCount: data.results?.length });

  return {
    success: true,
    data: {
      status: 'appended',
      blockId: data.results?.[0]?.id,
    },
  };
}
