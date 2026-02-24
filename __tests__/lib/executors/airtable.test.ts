/**
 * Airtable Integration Executor Tests
 */

import { executeAirtable } from '@/lib/integrations/executors/airtable';
import { ExecutionContext, IntegrationLogger } from '@/lib/integrations/types';
import { AirtableConfig } from '@/lib/integrations/definitions/airtable';

// Mock global fetch for Airtable API
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

describe('executeAirtable', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, AIRTABLE_API_KEY: 'pat_test-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('list_records action', () => {
    it('lists records from a table', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          records: [
            { id: 'rec1', fields: { Name: 'Alice', Email: 'alice@example.com' } },
            { id: 'rec2', fields: { Name: 'Bob', Email: 'bob@example.com' } },
          ],
          offset: undefined,
        }),
        text: async () => '{}',
      });

      const config: AirtableConfig = {
        action: 'list_records',
        baseId: 'app123',
        tableId: 'tbl456',
        fields: '',
        apiKey: '',
      };
      const result = await executeAirtable(config, createMockContext());

      expect(result.success).toBe(true);
      expect(result.data?.records).toHaveLength(2);
      expect(result.data?.recordCount).toBe(2);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.airtable.com/v0/app123/tbl456'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('create_record action', () => {
    it('creates a record successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'rec_new',
          fields: { Name: 'Charlie', Email: 'charlie@example.com' },
        }),
        text: async () => '{}',
      });

      const config: AirtableConfig = {
        action: 'create_record',
        baseId: 'app123',
        tableId: 'tbl456',
        fields: '{"Name": "Charlie", "Email": "charlie@example.com"}',
        apiKey: '',
      };
      const result = await executeAirtable(config, createMockContext());

      expect(result.success).toBe(true);
      expect(result.data?.recordId).toBe('rec_new');
      expect(result.data?.status).toBe('created');
    });
  });

  describe('update_record action', () => {
    it('updates a record successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'rec1',
          fields: { Name: 'Alice Updated' },
        }),
        text: async () => '{}',
      });

      const config: AirtableConfig = {
        action: 'update_record',
        baseId: 'app123',
        tableId: 'tbl456',
        recordId: 'rec1',
        fields: '{"Name": "Alice Updated"}',
        apiKey: '',
      };
      const result = await executeAirtable(config, createMockContext());

      expect(result.success).toBe(true);
      expect(result.data?.recordId).toBe('rec1');
      expect(result.data?.status).toBe('updated');
    });
  });

  describe('validation', () => {
    it('returns error when no API key configured', async () => {
      delete process.env.AIRTABLE_API_KEY;

      const config: AirtableConfig = {
        action: 'list_records',
        baseId: 'app123',
        tableId: 'tbl456',
        fields: '',
        apiKey: '',
      };
      const result = await executeAirtable(config, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('API key');
    });

    it('returns error when no base ID', async () => {
      const config: AirtableConfig = {
        action: 'list_records',
        baseId: '',
        tableId: 'tbl456',
        fields: '',
        apiKey: '',
      };
      const result = await executeAirtable(config, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('base ID');
    });

    it('returns error when no table ID', async () => {
      const config: AirtableConfig = {
        action: 'list_records',
        baseId: 'app123',
        tableId: '',
        fields: '',
        apiKey: '',
      };
      const result = await executeAirtable(config, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('table');
    });

    it('returns error when create_record has no fields', async () => {
      const config: AirtableConfig = {
        action: 'create_record',
        baseId: 'app123',
        tableId: 'tbl456',
        fields: '',
        apiKey: '',
      };
      const result = await executeAirtable(config, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('fields');
    });

    it('returns error when update_record has no record ID', async () => {
      const config: AirtableConfig = {
        action: 'update_record',
        baseId: 'app123',
        tableId: 'tbl456',
        fields: '{"Name": "Test"}',
        apiKey: '',
      };
      const result = await executeAirtable(config, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('record ID');
    });

    it('returns error for invalid JSON fields', async () => {
      const config: AirtableConfig = {
        action: 'create_record',
        baseId: 'app123',
        tableId: 'tbl456',
        fields: 'not valid json',
        apiKey: '',
      };
      const result = await executeAirtable(config, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('JSON');
    });
  });

  describe('error handling', () => {
    it('handles Airtable API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ error: { type: 'INVALID_REQUEST_UNKNOWN', message: 'Invalid field' } }),
        text: async () => '{"error":{}}',
      });

      const config: AirtableConfig = {
        action: 'list_records',
        baseId: 'app123',
        tableId: 'tbl456',
        fields: '',
        apiKey: '',
      };
      const context = createMockContext();
      const result = await executeAirtable(config, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('422');
      expect(context.logger.error).toHaveBeenCalled();
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('ETIMEDOUT'));

      const config: AirtableConfig = {
        action: 'list_records',
        baseId: 'app123',
        tableId: 'tbl456',
        fields: '',
        apiKey: '',
      };
      const result = await executeAirtable(config, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('ETIMEDOUT');
    });
  });

  describe('auth', () => {
    it('uses custom API key when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ records: [] }),
        text: async () => '{}',
      });

      const config: AirtableConfig = {
        action: 'list_records',
        baseId: 'app123',
        tableId: 'tbl456',
        fields: '',
        apiKey: 'pat_custom-key',
      };
      await executeAirtable(config, createMockContext());

      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[1].headers['Authorization']).toBe('Bearer pat_custom-key');
    });

    it('uses env API key when no custom key', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ records: [] }),
        text: async () => '{}',
      });

      const config: AirtableConfig = {
        action: 'list_records',
        baseId: 'app123',
        tableId: 'tbl456',
        fields: '',
        apiKey: '',
      };
      await executeAirtable(config, createMockContext());

      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[1].headers['Authorization']).toBe('Bearer pat_test-key');
    });
  });

  describe('variable substitution', () => {
    it('substitutes variables in all fields', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ records: [] }),
        text: async () => '{}',
      });

      const substituteVariables = jest.fn((template: string) => {
        const map: Record<string, string> = {
          '{{base}}': 'app_resolved',
          '{{table}}': 'tbl_resolved',
          '{{data}}': '{"Name": "Resolved"}',
        };
        return map[template] || template;
      });

      const config: AirtableConfig = {
        action: 'create_record',
        baseId: '{{base}}',
        tableId: '{{table}}',
        fields: '{{data}}',
        apiKey: '',
      };
      await executeAirtable(config, createMockContext({ substituteVariables }));

      expect(substituteVariables).toHaveBeenCalledWith('{{base}}');
      expect(substituteVariables).toHaveBeenCalledWith('{{table}}');
      expect(substituteVariables).toHaveBeenCalledWith('{{data}}');
    });
  });
});
