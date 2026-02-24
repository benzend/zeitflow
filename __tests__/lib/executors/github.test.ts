/**
 * GitHub Integration Executor Tests
 */

import { executeGitHub } from '@/lib/integrations/executors/github';
import { ExecutionContext, IntegrationLogger } from '@/lib/integrations/types';
import { GitHubConfig } from '@/lib/integrations/definitions/github';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

function createMockLogger(): IntegrationLogger {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    startTimer: jest.fn(() => jest.fn()),
    getEntries: jest.fn(() => []),
  };
}

function createMockContext(overrides?: Partial<ExecutionContext>): ExecutionContext {
  return {
    userId: 'user-1',
    executionId: 'exec-1',
    nodeId: 'node-1',
    variables: {},
    substituteVariables: (template: string) => template,
    logger: createMockLogger(),
    ...overrides,
  };
}

describe('executeGitHub', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, GITHUB_TOKEN: 'ghp_test-token' };
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 1, number: 42, html_url: 'https://github.com/owner/repo/issues/42' }),
      text: async () => '{"id":1}',
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('create_issue action', () => {
    it('creates an issue successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: 1,
          number: 42,
          html_url: 'https://github.com/owner/repo/issues/42',
          title: 'Bug report',
        }),
        text: async () => '{}',
      });

      const config: GitHubConfig = {
        action: 'create_issue',
        repo: 'owner/repo',
        title: 'Bug report',
        body: 'Description of the bug',
        token: '',
      };
      const result = await executeGitHub(config, createMockContext());

      expect(result.success).toBe(true);
      expect(result.data?.issueNumber).toBe(42);
      expect(result.data?.url).toBe('https://github.com/owner/repo/issues/42');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/issues',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('create_comment action', () => {
    it('creates a comment on an issue', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: 99,
          html_url: 'https://github.com/owner/repo/issues/42#issuecomment-99',
        }),
        text: async () => '{}',
      });

      const config: GitHubConfig = {
        action: 'create_comment',
        repo: 'owner/repo',
        title: '42',
        body: 'This is a comment',
        token: '',
      };
      const result = await executeGitHub(config, createMockContext());

      expect(result.success).toBe(true);
      expect(result.data?.commentId).toBe(99);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/issues/42/comments',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('list_issues action', () => {
    it('lists issues for a repo', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [
          { number: 1, title: 'First issue', state: 'open' },
          { number: 2, title: 'Second issue', state: 'open' },
        ],
        text: async () => '[]',
      });

      const config: GitHubConfig = {
        action: 'list_issues',
        repo: 'owner/repo',
        title: '',
        body: '',
        token: '',
      };
      const result = await executeGitHub(config, createMockContext());

      expect(result.success).toBe(true);
      expect(result.data?.issues).toHaveLength(2);
    });
  });

  describe('validation', () => {
    it('returns error when no repo specified', async () => {
      const config: GitHubConfig = {
        action: 'create_issue',
        repo: '',
        title: 'Bug',
        body: 'Description',
        token: '',
      };
      const result = await executeGitHub(config, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('repository');
    });

    it('returns error when no token configured', async () => {
      delete process.env.GITHUB_TOKEN;

      const config: GitHubConfig = {
        action: 'create_issue',
        repo: 'owner/repo',
        title: 'Bug',
        body: 'Description',
        token: '',
      };
      const result = await executeGitHub(config, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('token');
    });

    it('returns error when create_issue has no title', async () => {
      const config: GitHubConfig = {
        action: 'create_issue',
        repo: 'owner/repo',
        title: '',
        body: 'Description',
        token: '',
      };
      const result = await executeGitHub(config, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('title');
    });

    it('validates repo format (owner/repo)', async () => {
      const config: GitHubConfig = {
        action: 'create_issue',
        repo: 'invalid-format',
        title: 'Bug',
        body: 'Description',
        token: '',
      };
      const result = await executeGitHub(config, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('owner/repo');
    });
  });

  describe('error handling', () => {
    it('handles GitHub API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not Found' }),
        text: async () => '{"message":"Not Found"}',
      });

      const config: GitHubConfig = {
        action: 'create_issue',
        repo: 'owner/repo',
        title: 'Bug',
        body: 'Description',
        token: '',
      };
      const context = createMockContext();
      const result = await executeGitHub(config, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('404');
      expect(context.logger.error).toHaveBeenCalled();
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('DNS resolution failed'));

      const config: GitHubConfig = {
        action: 'create_issue',
        repo: 'owner/repo',
        title: 'Bug',
        body: 'Description',
        token: '',
      };
      const result = await executeGitHub(config, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('DNS resolution failed');
    });
  });

  describe('auth', () => {
    it('uses custom token when provided', async () => {
      const config: GitHubConfig = {
        action: 'list_issues',
        repo: 'owner/repo',
        title: '',
        body: '',
        token: 'ghp_custom-token',
      };
      await executeGitHub(config, createMockContext());

      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[1].headers['Authorization']).toBe('Bearer ghp_custom-token');
    });

    it('uses env token when no custom token', async () => {
      const config: GitHubConfig = {
        action: 'list_issues',
        repo: 'owner/repo',
        title: '',
        body: '',
        token: '',
      };
      await executeGitHub(config, createMockContext());

      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[1].headers['Authorization']).toBe('Bearer ghp_test-token');
    });
  });

  describe('variable substitution', () => {
    it('substitutes variables in all fields', async () => {
      const substituteVariables = jest.fn((template: string) => {
        const map: Record<string, string> = {
          '{{repo}}': 'owner/repo',
          '{{issueTitle}}': 'Auto-generated issue',
          '{{issueBody}}': 'Created by workflow',
        };
        return map[template] || template;
      });

      const config: GitHubConfig = {
        action: 'create_issue',
        repo: '{{repo}}',
        title: '{{issueTitle}}',
        body: '{{issueBody}}',
        token: '',
      };
      await executeGitHub(config, createMockContext({ substituteVariables }));

      expect(substituteVariables).toHaveBeenCalledWith('{{repo}}');
      expect(substituteVariables).toHaveBeenCalledWith('{{issueTitle}}');
      expect(substituteVariables).toHaveBeenCalledWith('{{issueBody}}');
    });
  });
});
