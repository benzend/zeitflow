/**
 * Jira Integration Executor (Server-Side Only)
 *
 * This file contains the server-side execution logic for the Jira integration.
 * Uses Jira REST API v3 (Atlassian Cloud).
 * It should only be imported in server-side code (API routes, server components).
 */

import { ExecutionContext, IntegrationResult } from '../types';
import { JiraConfig } from '../definitions/jira';

/**
 * Build base URL and auth headers for Jira API calls
 */
function getJiraClient(config: JiraConfig) {
  const domain = config.domain || process.env.JIRA_DOMAIN;
  const email = config.email || process.env.JIRA_EMAIL;
  const apiToken = config.apiToken || process.env.JIRA_API_TOKEN;

  if (!domain || !email || !apiToken) {
    return null;
  }

  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const baseUrl = `https://${cleanDomain}/rest/api/3`;
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

  return {
    baseUrl,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    domain: cleanDomain,
  };
}

/**
 * Execute the Jira integration
 */
export async function executeJira(
  config: JiraConfig,
  context: ExecutionContext
): Promise<IntegrationResult> {
  const { logger } = context;
  const endTimer = logger.startTimer('jira_execute');

  logger.info('Starting Jira operation', {
    action: config.action,
    hasProjectKey: !!config.projectKey,
    hasIssueKey: !!config.issueKey,
  });

  const client = getJiraClient(config);
  if (!client) {
    logger.error('Jira credentials not configured');
    endTimer();
    return {
      success: false,
      error: 'Jira credentials not configured. Set JIRA_DOMAIN, JIRA_EMAIL, and JIRA_API_TOKEN environment variables or provide them in the node config.',
      data: { status: 'failed', error: 'Missing credentials' },
    };
  }

  try {
    switch (config.action) {
      case 'create_issue':
        return await createIssue(config, client, context, logger, endTimer);
      case 'update_issue':
        return await updateIssue(config, client, context, logger, endTimer);
      case 'transition_issue':
        return await transitionIssue(config, client, context, logger, endTimer);
      case 'list_issues':
        return await listIssues(config, client, context, logger, endTimer);
      case 'add_comment':
        return await addComment(config, client, context, logger, endTimer);
      default:
        logger.error('Unknown action', { action: config.action });
        endTimer();
        return {
          success: false,
          error: `Unknown Jira action: ${config.action}`,
          data: { status: 'failed', error: 'Unknown action' },
        };
    }
  } catch (error) {
    endTimer();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Jira operation failed', { error: errorMessage });
    return {
      success: false,
      error: `Jira operation failed: ${errorMessage}`,
      data: { status: 'failed', error: errorMessage },
    };
  }
}

async function createIssue(
  config: JiraConfig,
  client: NonNullable<ReturnType<typeof getJiraClient>>,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const projectKey = context.substituteVariables(config.projectKey || '');
  const summary = context.substituteVariables(config.summary || '');
  const description = context.substituteVariables(config.description || '');

  if (!projectKey) {
    logger.error('No project key specified');
    endTimer();
    return {
      success: false,
      error: 'No project key specified',
      data: { status: 'failed', error: 'Missing project key' },
    };
  }

  if (!summary) {
    logger.error('No summary specified');
    endTimer();
    return {
      success: false,
      error: 'No summary specified for issue creation',
      data: { status: 'failed', error: 'Missing summary' },
    };
  }

  logger.debug('Creating issue', { projectKey, summary, issueType: config.issueType });

  const body: Record<string, unknown> = {
    fields: {
      project: { key: projectKey },
      summary,
      issuetype: { name: config.issueType || 'Task' },
      priority: { name: config.priority || 'Medium' },
      ...(description ? {
        description: {
          type: 'doc',
          version: 1,
          content: [{ type: 'paragraph', content: [{ type: 'text', text: description }] }],
        },
      } : {}),
    },
  };

  const response = await fetch(`${client.baseUrl}/issue`, {
    method: 'POST',
    headers: client.headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('Jira API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `Jira API error: ${response.status} ${response.statusText}`,
      data: { status: 'failed', error: errorText },
    };
  }

  const data = await response.json();
  endTimer();
  const url = `https://${client.domain}/browse/${data.key}`;
  logger.info('Issue created', { issueKey: data.key, url });

  return {
    success: true,
    data: {
      status: 'created',
      issueKey: data.key,
      issueId: data.id,
      url,
    },
  };
}

async function updateIssue(
  config: JiraConfig,
  client: NonNullable<ReturnType<typeof getJiraClient>>,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const issueKey = context.substituteVariables(config.issueKey || '');
  const summary = context.substituteVariables(config.summary || '');
  const description = context.substituteVariables(config.description || '');

  if (!issueKey) {
    logger.error('No issue key specified');
    endTimer();
    return {
      success: false,
      error: 'No issue key specified for update',
      data: { status: 'failed', error: 'Missing issue key' },
    };
  }

  logger.debug('Updating issue', { issueKey });

  const fields: Record<string, unknown> = {};
  if (summary) fields.summary = summary;
  if (description) {
    fields.description = {
      type: 'doc',
      version: 1,
      content: [{ type: 'paragraph', content: [{ type: 'text', text: description }] }],
    };
  }
  if (config.priority) fields.priority = { name: config.priority };

  const response = await fetch(`${client.baseUrl}/issue/${issueKey}`, {
    method: 'PUT',
    headers: client.headers,
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('Jira API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `Jira API error: ${response.status} ${response.statusText}`,
      data: { status: 'failed', error: errorText },
    };
  }

  endTimer();
  const url = `https://${client.domain}/browse/${issueKey}`;
  logger.info('Issue updated', { issueKey, url });

  return {
    success: true,
    data: {
      status: 'updated',
      issueKey,
      url,
    },
  };
}

async function transitionIssue(
  config: JiraConfig,
  client: NonNullable<ReturnType<typeof getJiraClient>>,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const issueKey = context.substituteVariables(config.issueKey || '');
  const transitionId = context.substituteVariables(config.transitionId || '');

  if (!issueKey) {
    logger.error('No issue key specified');
    endTimer();
    return {
      success: false,
      error: 'No issue key specified for transition',
      data: { status: 'failed', error: 'Missing issue key' },
    };
  }

  if (!transitionId) {
    logger.error('No transition ID specified');
    endTimer();
    return {
      success: false,
      error: 'No transition ID specified',
      data: { status: 'failed', error: 'Missing transition ID' },
    };
  }

  logger.debug('Transitioning issue', { issueKey, transitionId });

  const response = await fetch(`${client.baseUrl}/issue/${issueKey}/transitions`, {
    method: 'POST',
    headers: client.headers,
    body: JSON.stringify({ transition: { id: transitionId } }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('Jira API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `Jira API error: ${response.status} ${response.statusText}`,
      data: { status: 'failed', error: errorText },
    };
  }

  endTimer();
  const url = `https://${client.domain}/browse/${issueKey}`;
  logger.info('Issue transitioned', { issueKey, transitionId, url });

  return {
    success: true,
    data: {
      status: 'transitioned',
      issueKey,
      url,
    },
  };
}

async function listIssues(
  config: JiraConfig,
  client: NonNullable<ReturnType<typeof getJiraClient>>,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const projectKey = context.substituteVariables(config.projectKey || '');
  const jql = context.substituteVariables(config.jql || '');

  const query = jql || `project = "${projectKey}" ORDER BY created DESC`;

  if (!jql && !projectKey) {
    logger.error('No project key or JQL specified');
    endTimer();
    return {
      success: false,
      error: 'Specify either a JQL query or a project key to search issues',
      data: { status: 'failed', error: 'Missing query' },
    };
  }

  logger.debug('Searching issues', { jql: query });

  const response = await fetch(`${client.baseUrl}/search?jql=${encodeURIComponent(query)}&maxResults=50`, {
    method: 'GET',
    headers: client.headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('Jira API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `Jira API error: ${response.status} ${response.statusText}`,
      data: { status: 'failed', error: errorText },
    };
  }

  const data = await response.json();
  endTimer();
  logger.info('Issues found', { count: data.total });

  const issues = data.issues.map((issue: Record<string, unknown>) => ({
    key: issue.key,
    id: issue.id,
    summary: (issue.fields as Record<string, unknown>)?.summary,
    status: ((issue.fields as Record<string, unknown>)?.status as Record<string, unknown>)?.name,
    assignee: ((issue.fields as Record<string, unknown>)?.assignee as Record<string, unknown>)?.displayName,
    url: `https://${client.domain}/browse/${issue.key}`,
  }));

  return {
    success: true,
    data: {
      status: 'listed',
      issues,
      issueCount: data.total,
    },
  };
}

async function addComment(
  config: JiraConfig,
  client: NonNullable<ReturnType<typeof getJiraClient>>,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const issueKey = context.substituteVariables(config.issueKey || '');
  const comment = context.substituteVariables(config.comment || '');

  if (!issueKey) {
    logger.error('No issue key specified');
    endTimer();
    return {
      success: false,
      error: 'No issue key specified for comment',
      data: { status: 'failed', error: 'Missing issue key' },
    };
  }

  if (!comment) {
    logger.error('No comment text specified');
    endTimer();
    return {
      success: false,
      error: 'No comment text specified',
      data: { status: 'failed', error: 'Missing comment' },
    };
  }

  logger.debug('Adding comment', { issueKey });

  const response = await fetch(`${client.baseUrl}/issue/${issueKey}/comment`, {
    method: 'POST',
    headers: client.headers,
    body: JSON.stringify({
      body: {
        type: 'doc',
        version: 1,
        content: [{ type: 'paragraph', content: [{ type: 'text', text: comment }] }],
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('Jira API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `Jira API error: ${response.status} ${response.statusText}`,
      data: { status: 'failed', error: errorText },
    };
  }

  const data = await response.json();
  endTimer();
  const url = `https://${client.domain}/browse/${issueKey}`;
  logger.info('Comment added', { issueKey, commentId: data.id, url });

  return {
    success: true,
    data: {
      status: 'commented',
      issueKey,
      url,
    },
  };
}
