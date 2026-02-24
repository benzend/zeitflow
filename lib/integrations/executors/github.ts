/**
 * GitHub Integration Executor (Server-Side Only)
 *
 * This file contains the server-side execution logic for the GitHub integration.
 * It should only be imported in server-side code (API routes, server components).
 */

import { ExecutionContext, IntegrationResult } from '../types';
import { GitHubConfig } from '../definitions/github';

const GITHUB_API = 'https://api.github.com';

/**
 * Execute the GitHub integration
 */
export async function executeGitHub(
  config: GitHubConfig,
  context: ExecutionContext
): Promise<IntegrationResult> {
  const { logger } = context;
  const endTimer = logger.startTimer('github_execute');

  logger.info('Starting GitHub operation', {
    action: config.action,
    hasRepo: !!config.repo,
    hasToken: !!config.token,
  });

  // Determine token
  const token = config.token || process.env.GITHUB_TOKEN;

  if (!token) {
    logger.error('GitHub token not configured');
    endTimer();
    return {
      success: false,
      error: 'GitHub token not configured. Set GITHUB_TOKEN env var or provide a token in node config.',
      data: { status: 'failed', error: 'Missing token' },
    };
  }

  // Substitute variables
  const repo = context.substituteVariables(config.repo || '');
  const title = context.substituteVariables(config.title || '');
  const body = context.substituteVariables(config.body || '');

  // Validate repo
  if (!repo) {
    logger.error('No repository specified');
    endTimer();
    return {
      success: false,
      error: 'No repository specified',
      data: { status: 'failed', error: 'Missing repository' },
    };
  }

  // Validate repo format
  if (!repo.includes('/') || repo.split('/').length !== 2) {
    logger.error('Invalid repo format', { repo });
    endTimer();
    return {
      success: false,
      error: 'Invalid repository format. Use owner/repo format (e.g., facebook/react).',
      data: { status: 'failed', error: 'Invalid repo format' },
    };
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  try {
    if (config.action === 'create_issue') {
      return await createIssue(repo, title, body, headers, logger, endTimer);
    } else if (config.action === 'create_comment') {
      return await createComment(repo, title, body, headers, logger, endTimer);
    } else {
      return await listIssues(repo, headers, logger, endTimer);
    }
  } catch (error) {
    endTimer();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('GitHub operation failed', { error: errorMessage });

    return {
      success: false,
      error: `GitHub operation failed: ${errorMessage}`,
      data: { status: 'failed', error: errorMessage },
    };
  }
}

async function createIssue(
  repo: string,
  title: string,
  body: string,
  headers: Record<string, string>,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  if (!title) {
    logger.error('No title specified for issue');
    endTimer();
    return {
      success: false,
      error: 'No title specified for issue creation',
      data: { status: 'failed', error: 'Missing title' },
    };
  }

  logger.debug('Creating issue', { repo, title });

  const response = await fetch(`${GITHUB_API}/repos/${repo}/issues`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, body }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('GitHub API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `GitHub API error: ${response.status} ${response.statusText}`,
      data: { status: 'failed', error: errorText },
    };
  }

  const data = await response.json();
  endTimer();
  logger.info('Issue created', { number: data.number, url: data.html_url });

  return {
    success: true,
    data: {
      status: 'created',
      issueNumber: data.number,
      url: data.html_url,
    },
  };
}

async function createComment(
  repo: string,
  issueNumber: string,
  body: string,
  headers: Record<string, string>,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  if (!issueNumber) {
    logger.error('No issue number specified');
    endTimer();
    return {
      success: false,
      error: 'No issue number specified for comment',
      data: { status: 'failed', error: 'Missing issue number' },
    };
  }

  logger.debug('Creating comment', { repo, issueNumber });

  const response = await fetch(`${GITHUB_API}/repos/${repo}/issues/${issueNumber}/comments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ body }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('GitHub API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `GitHub API error: ${response.status} ${response.statusText}`,
      data: { status: 'failed', error: errorText },
    };
  }

  const data = await response.json();
  endTimer();
  logger.info('Comment created', { commentId: data.id, url: data.html_url });

  return {
    success: true,
    data: {
      status: 'created',
      commentId: data.id,
      url: data.html_url,
    },
  };
}

async function listIssues(
  repo: string,
  headers: Record<string, string>,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  logger.debug('Listing issues', { repo });

  const response = await fetch(`${GITHUB_API}/repos/${repo}/issues?state=open&per_page=30`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('GitHub API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `GitHub API error: ${response.status} ${response.statusText}`,
      data: { status: 'failed', error: errorText },
    };
  }

  const data = await response.json();
  endTimer();
  logger.info('Issues listed', { count: data.length });

  return {
    success: true,
    data: {
      status: 'listed',
      issues: data,
      issueCount: data.length,
    },
  };
}
