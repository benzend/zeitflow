/**
 * Linear Integration Executor (Server-Side Only)
 *
 * This file contains the server-side execution logic for the Linear integration.
 * Uses Linear's GraphQL API.
 * It should only be imported in server-side code (API routes, server components).
 */

import { ExecutionContext, IntegrationResult } from '../types';
import { LinearConfig } from '../definitions/linear';

const LINEAR_API = 'https://api.linear.app/graphql';

/**
 * Execute a GraphQL query against the Linear API
 */
async function linearGraphQL(
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<{ data?: Record<string, unknown>; errors?: Array<{ message: string }> }> {
  const response = await fetch(LINEAR_API, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Linear API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Execute the Linear integration
 */
export async function executeLinear(
  config: LinearConfig,
  context: ExecutionContext
): Promise<IntegrationResult> {
  const { logger } = context;
  const endTimer = logger.startTimer('linear_execute');

  logger.info('Starting Linear operation', {
    action: config.action,
    hasTeamId: !!config.teamId,
    hasIssueId: !!config.issueId,
  });

  const apiKey = config.apiKey || process.env.LINEAR_API_KEY;
  if (!apiKey) {
    logger.error('Linear API key not configured');
    endTimer();
    return {
      success: false,
      error: 'Linear API key not configured. Set LINEAR_API_KEY env var or provide it in the node config.',
      data: { status: 'failed', error: 'Missing API key' },
    };
  }

  try {
    switch (config.action) {
      case 'create_issue':
        return await createIssue(config, apiKey, context, logger, endTimer);
      case 'update_issue':
        return await updateIssue(config, apiKey, context, logger, endTimer);
      case 'list_issues':
        return await listIssues(config, apiKey, context, logger, endTimer);
      case 'add_comment':
        return await addComment(config, apiKey, context, logger, endTimer);
      default:
        logger.error('Unknown action', { action: config.action });
        endTimer();
        return {
          success: false,
          error: `Unknown Linear action: ${config.action}`,
          data: { status: 'failed', error: 'Unknown action' },
        };
    }
  } catch (error) {
    endTimer();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Linear operation failed', { error: errorMessage });
    return {
      success: false,
      error: `Linear operation failed: ${errorMessage}`,
      data: { status: 'failed', error: errorMessage },
    };
  }
}

async function createIssue(
  config: LinearConfig,
  apiKey: string,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const teamId = context.substituteVariables(config.teamId || '');
  const title = context.substituteVariables(config.title || '');
  const description = context.substituteVariables(config.description || '');
  const assigneeId = context.substituteVariables(config.assigneeId || '');
  const labelIds = context.substituteVariables(config.labelIds || '');

  if (!teamId) {
    logger.error('No team ID specified');
    endTimer();
    return {
      success: false,
      error: 'Team ID is required to create an issue',
      data: { status: 'failed', error: 'Missing team ID' },
    };
  }

  if (!title) {
    logger.error('No title specified');
    endTimer();
    return {
      success: false,
      error: 'Title is required to create an issue',
      data: { status: 'failed', error: 'Missing title' },
    };
  }

  logger.debug('Creating issue', { teamId, title });

  const input: Record<string, unknown> = {
    teamId,
    title,
  };
  if (description) input.description = description;
  if (config.priority) input.priority = config.priority;
  if (assigneeId) input.assigneeId = assigneeId;
  if (config.status) input.stateId = context.substituteVariables(config.status);
  if (labelIds) {
    input.labelIds = labelIds.split(',').map(id => id.trim()).filter(Boolean);
  }

  const result = await linearGraphQL(apiKey, `
    mutation IssueCreate($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          url
          title
        }
      }
    }
  `, { input });

  if (result.errors?.length) {
    const errorMsg = result.errors.map(e => e.message).join('; ');
    logger.error('Linear GraphQL error', { errors: errorMsg });
    endTimer();
    return {
      success: false,
      error: `Linear API error: ${errorMsg}`,
      data: { status: 'failed', error: errorMsg },
    };
  }

  const issue = (result.data?.issueCreate as Record<string, unknown>)?.issue as Record<string, unknown>;
  endTimer();
  logger.info('Issue created', { issueId: issue?.id, identifier: issue?.identifier });

  return {
    success: true,
    data: {
      status: 'created',
      issueId: issue?.id as string,
      issueIdentifier: issue?.identifier as string,
      url: issue?.url as string,
    },
  };
}

async function updateIssue(
  config: LinearConfig,
  apiKey: string,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const issueId = context.substituteVariables(config.issueId || '');
  const title = context.substituteVariables(config.title || '');
  const description = context.substituteVariables(config.description || '');
  const assigneeId = context.substituteVariables(config.assigneeId || '');

  if (!issueId) {
    logger.error('No issue ID specified');
    endTimer();
    return {
      success: false,
      error: 'Issue ID is required to update an issue',
      data: { status: 'failed', error: 'Missing issue ID' },
    };
  }

  logger.debug('Updating issue', { issueId });

  const input: Record<string, unknown> = {};
  if (title) input.title = title;
  if (description) input.description = description;
  if (config.priority) input.priority = config.priority;
  if (assigneeId) input.assigneeId = assigneeId;
  if (config.status) input.stateId = context.substituteVariables(config.status);

  const result = await linearGraphQL(apiKey, `
    mutation IssueUpdate($id: String!, $input: IssueUpdateInput!) {
      issueUpdate(id: $id, input: $input) {
        success
        issue {
          id
          identifier
          url
          title
        }
      }
    }
  `, { id: issueId, input });

  if (result.errors?.length) {
    const errorMsg = result.errors.map(e => e.message).join('; ');
    logger.error('Linear GraphQL error', { errors: errorMsg });
    endTimer();
    return {
      success: false,
      error: `Linear API error: ${errorMsg}`,
      data: { status: 'failed', error: errorMsg },
    };
  }

  const issue = (result.data?.issueUpdate as Record<string, unknown>)?.issue as Record<string, unknown>;
  endTimer();
  logger.info('Issue updated', { issueId: issue?.id, identifier: issue?.identifier });

  return {
    success: true,
    data: {
      status: 'updated',
      issueId: issue?.id as string,
      issueIdentifier: issue?.identifier as string,
      url: issue?.url as string,
    },
  };
}

async function listIssues(
  config: LinearConfig,
  apiKey: string,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const teamId = context.substituteVariables(config.teamId || '');
  const filterRaw = context.substituteVariables(config.filterQuery || '');

  let filter: Record<string, unknown> = {};
  if (filterRaw.trim()) {
    try {
      filter = JSON.parse(filterRaw);
    } catch {
      logger.error('Invalid JSON in filter query');
      endTimer();
      return {
        success: false,
        error: 'Invalid JSON in filter query',
        data: { status: 'failed', error: 'Invalid filter JSON' },
      };
    }
  }

  if (teamId && !filter.team) {
    filter.team = { id: { eq: teamId } };
  }

  logger.debug('Listing issues', { filter });

  const result = await linearGraphQL(apiKey, `
    query Issues($filter: IssueFilter) {
      issues(filter: $filter, first: 50) {
        nodes {
          id
          identifier
          title
          url
          state { name }
          assignee { name }
          priority
          createdAt
        }
      }
    }
  `, { filter: Object.keys(filter).length > 0 ? filter : undefined });

  if (result.errors?.length) {
    const errorMsg = result.errors.map(e => e.message).join('; ');
    logger.error('Linear GraphQL error', { errors: errorMsg });
    endTimer();
    return {
      success: false,
      error: `Linear API error: ${errorMsg}`,
      data: { status: 'failed', error: errorMsg },
    };
  }

  const nodes = ((result.data?.issues as Record<string, unknown>)?.nodes as Array<Record<string, unknown>>) || [];
  endTimer();
  logger.info('Issues listed', { count: nodes.length });

  const issues = nodes.map(issue => ({
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    url: issue.url,
    state: (issue.state as Record<string, unknown>)?.name,
    assignee: (issue.assignee as Record<string, unknown>)?.name,
    priority: issue.priority,
  }));

  return {
    success: true,
    data: {
      status: 'listed',
      issues,
      issueCount: issues.length,
    },
  };
}

async function addComment(
  config: LinearConfig,
  apiKey: string,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const issueId = context.substituteVariables(config.issueId || '');
  const body = context.substituteVariables(config.comment || '');

  if (!issueId) {
    logger.error('No issue ID specified');
    endTimer();
    return {
      success: false,
      error: 'Issue ID is required to add a comment',
      data: { status: 'failed', error: 'Missing issue ID' },
    };
  }

  if (!body) {
    logger.error('No comment text specified');
    endTimer();
    return {
      success: false,
      error: 'Comment text is required',
      data: { status: 'failed', error: 'Missing comment' },
    };
  }

  logger.debug('Adding comment', { issueId });

  const result = await linearGraphQL(apiKey, `
    mutation CommentCreate($input: CommentCreateInput!) {
      commentCreate(input: $input) {
        success
        comment {
          id
          url
        }
      }
    }
  `, { input: { issueId, body } });

  if (result.errors?.length) {
    const errorMsg = result.errors.map(e => e.message).join('; ');
    logger.error('Linear GraphQL error', { errors: errorMsg });
    endTimer();
    return {
      success: false,
      error: `Linear API error: ${errorMsg}`,
      data: { status: 'failed', error: errorMsg },
    };
  }

  const comment = (result.data?.commentCreate as Record<string, unknown>)?.comment as Record<string, unknown>;
  endTimer();
  logger.info('Comment added', { commentId: comment?.id });

  return {
    success: true,
    data: {
      status: 'commented',
      issueId,
      url: comment?.url as string,
    },
  };
}
