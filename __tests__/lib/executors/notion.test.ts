/**
 * Notion Integration Executor Tests
 */

import { executeNotion } from '@/lib/integrations/executors/notion';
import { ExecutionContext, IntegrationLogger } from '@/lib/integrations/types';
import { NotionConfig } from '@/lib/integrations/definitions/notion';

// Mock global fetch for Notion API
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

describe('executeNotion', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, NOTION_API_KEY: 'ntn_test-key' };
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'page-123', url: 'https://notion.so/page-123' }),
      text: async () => '{}',
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('create_page action', () => {
    it('creates a page in a database', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'page-123',
          url: 'https://notion.so/page-123',
        }),
        text: async () => '{}',
      });

      const config: NotionConfig = {
        action: 'create_page',
        databaseId: 'db-456',
        title: 'New Task',
        content: 'Task description here',
        apiKey: '',
      };
      const result = await executeNotion(config, createMockContext());

      expect(result.success).toBe(true);
      expect(result.data?.pageId).toBe('page-123');
      expect(result.data?.url).toBe('https://notion.so/page-123');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.notion.com/v1/pages',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('query_database action', () => {
    it('queries a database and returns results', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          results: [
            { id: 'page-1', properties: { Name: { title: [{ plain_text: 'Task 1' }] } } },
            { id: 'page-2', properties: { Name: { title: [{ plain_text: 'Task 2' }] } } },
          ],
          has_more: false,
        }),
        text: async () => '{}',
      });

      const config: NotionConfig = {
        action: 'query_database',
        databaseId: 'db-456',
        title: '',
        content: '',
        apiKey: '',
      };
      const result = await executeNotion(config, createMockContext());

      expect(result.success).toBe(true);
      expect(result.data?.results).toHaveLength(2);
      expect(result.data?.resultCount).toBe(2);
    });
  });

  describe('append_block action', () => {
    it('appends content to a page', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          results: [{ id: 'block-1' }],
        }),
        text: async () => '{}',
      });

      const config: NotionConfig = {
        action: 'append_block',
        databaseId: 'page-789',
        title: '',
        content: 'Appended content paragraph',
        apiKey: '',
      };
      const result = await executeNotion(config, createMockContext());

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('appended');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/blocks/page-789/children'),
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });

  describe('validation', () => {
    it('returns error when no API key configured', async () => {
      delete process.env.NOTION_API_KEY;

      const config: NotionConfig = {
        action: 'create_page',
        databaseId: 'db-456',
        title: 'Test',
        content: '',
        apiKey: '',
      };
      const result = await executeNotion(config, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('API key');
    });

    it('returns error when no database/page ID', async () => {
      const config: NotionConfig = {
        action: 'create_page',
        databaseId: '',
        title: 'Test',
        content: '',
        apiKey: '',
      };
      const result = await executeNotion(config, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('database');
    });

    it('returns error when create_page has no title', async () => {
      const config: NotionConfig = {
        action: 'create_page',
        databaseId: 'db-456',
        title: '',
        content: '',
        apiKey: '',
      };
      const result = await executeNotion(config, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('title');
    });
  });

  describe('error handling', () => {
    it('handles Notion API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Database not found', code: 'object_not_found' }),
        text: async () => '{"message":"Database not found"}',
      });

      const config: NotionConfig = {
        action: 'create_page',
        databaseId: 'db-456',
        title: 'Test',
        content: '',
        apiKey: '',
      };
      const context = createMockContext();
      const result = await executeNotion(config, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('404');
      expect(context.logger.error).toHaveBeenCalled();
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Connection timeout'));

      const config: NotionConfig = {
        action: 'create_page',
        databaseId: 'db-456',
        title: 'Test',
        content: '',
        apiKey: '',
      };
      const result = await executeNotion(config, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection timeout');
    });
  });

  describe('auth', () => {
    it('uses custom API key when provided', async () => {
      const config: NotionConfig = {
        action: 'query_database',
        databaseId: 'db-456',
        title: '',
        content: '',
        apiKey: 'ntn_custom-key',
      };
      await executeNotion(config, createMockContext());

      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[1].headers['Authorization']).toBe('Bearer ntn_custom-key');
    });

    it('uses env API key when no custom key', async () => {
      const config: NotionConfig = {
        action: 'query_database',
        databaseId: 'db-456',
        title: '',
        content: '',
        apiKey: '',
      };
      await executeNotion(config, createMockContext());

      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[1].headers['Authorization']).toBe('Bearer ntn_test-key');
    });
  });

  describe('variable substitution', () => {
    it('substitutes variables in all fields', async () => {
      const substituteVariables = jest.fn((template: string) => {
        const map: Record<string, string> = {
          '{{dbId}}': 'db-resolved',
          '{{pageTitle}}': 'Dynamic Title',
          '{{pageContent}}': 'Dynamic content',
        };
        return map[template] || template;
      });

      const config: NotionConfig = {
        action: 'create_page',
        databaseId: '{{dbId}}',
        title: '{{pageTitle}}',
        content: '{{pageContent}}',
        apiKey: '',
      };
      await executeNotion(config, createMockContext({ substituteVariables }));

      expect(substituteVariables).toHaveBeenCalledWith('{{dbId}}');
      expect(substituteVariables).toHaveBeenCalledWith('{{pageTitle}}');
      expect(substituteVariables).toHaveBeenCalledWith('{{pageContent}}');
    });
  });
});
