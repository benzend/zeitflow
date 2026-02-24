/**
 * Google Sheets Integration Executor Tests
 */

import { executeGoogleSheets } from '@/lib/integrations/executors/google-sheets';
import { ExecutionContext, IntegrationLogger } from '@/lib/integrations/types';
import { GoogleSheetsConfig } from '@/lib/integrations/definitions/google-sheets';

// Mock Google APIs
const mockSpreadsheetsValuesGet = jest.fn();
const mockSpreadsheetsValuesAppend = jest.fn();
const mockSpreadsheetsValuesUpdate = jest.fn();

jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([
      {
        id: 'account-1',
        userId: 'user-1',
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      },
    ]),
  },
}));

jest.mock('@/schema', () => ({
  accountsTable: {},
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn(),
}));

jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn(),
      })),
    },
    sheets: jest.fn(() => ({
      spreadsheets: {
        values: {
          get: mockSpreadsheetsValuesGet,
          append: mockSpreadsheetsValuesAppend,
          update: mockSpreadsheetsValuesUpdate,
        },
      },
    })),
  },
}));

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

describe('executeGoogleSheets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset db mock to default (account found)
    const { db } = require('@/lib/db');
    db.select.mockReturnThis();
    db.from.mockReturnThis();
    db.where.mockReturnThis();
    db.limit.mockResolvedValue([
      {
        id: 'account-1',
        userId: 'user-1',
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      },
    ]);
  });

  describe('read mode', () => {
    it('reads rows from a spreadsheet', async () => {
      mockSpreadsheetsValuesGet.mockResolvedValue({
        data: {
          values: [
            ['Name', 'Email'],
            ['Alice', 'alice@example.com'],
            ['Bob', 'bob@example.com'],
          ],
        },
      });

      const config: GoogleSheetsConfig = {
        mode: 'read',
        spreadsheetId: 'sheet-123',
        range: 'Sheet1!A1:B3',
        values: '',
      };
      const result = await executeGoogleSheets(config, createMockContext());

      expect(result.success).toBe(true);
      expect(result.data?.rowCount).toBe(3);
      expect(result.data?.rows).toEqual([
        ['Name', 'Email'],
        ['Alice', 'alice@example.com'],
        ['Bob', 'bob@example.com'],
      ]);
    });

    it('handles empty spreadsheet', async () => {
      mockSpreadsheetsValuesGet.mockResolvedValue({
        data: { values: [] },
      });

      const config: GoogleSheetsConfig = {
        mode: 'read',
        spreadsheetId: 'sheet-123',
        range: 'Sheet1!A1:B10',
        values: '',
      };
      const result = await executeGoogleSheets(config, createMockContext());

      expect(result.success).toBe(true);
      expect(result.data?.rowCount).toBe(0);
      expect(result.data?.rows).toEqual([]);
    });
  });

  describe('append mode', () => {
    it('appends rows to spreadsheet', async () => {
      mockSpreadsheetsValuesAppend.mockResolvedValue({
        data: {
          updates: {
            updatedRows: 1,
            updatedRange: 'Sheet1!A4:B4',
          },
        },
      });

      const config: GoogleSheetsConfig = {
        mode: 'append',
        spreadsheetId: 'sheet-123',
        range: 'Sheet1!A:B',
        values: '[["Charlie", "charlie@example.com"]]',
      };
      const result = await executeGoogleSheets(config, createMockContext());

      expect(result.success).toBe(true);
      expect(result.data?.updatedRows).toBe(1);
      expect(result.data?.status).toBe('appended');
    });
  });

  describe('update mode', () => {
    it('updates cells in spreadsheet', async () => {
      mockSpreadsheetsValuesUpdate.mockResolvedValue({
        data: {
          updatedRows: 1,
          updatedRange: 'Sheet1!A1:B1',
        },
      });

      const config: GoogleSheetsConfig = {
        mode: 'update',
        spreadsheetId: 'sheet-123',
        range: 'Sheet1!A1:B1',
        values: '[["Updated Name", "updated@example.com"]]',
      };
      const result = await executeGoogleSheets(config, createMockContext());

      expect(result.success).toBe(true);
      expect(result.data?.updatedRows).toBe(1);
      expect(result.data?.status).toBe('updated');
    });
  });

  describe('validation', () => {
    it('returns error when no spreadsheet ID', async () => {
      const config: GoogleSheetsConfig = {
        mode: 'read',
        spreadsheetId: '',
        range: 'Sheet1!A1:B3',
        values: '',
      };
      const result = await executeGoogleSheets(config, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('spreadsheet ID');
    });

    it('returns error when no range', async () => {
      const config: GoogleSheetsConfig = {
        mode: 'read',
        spreadsheetId: 'sheet-123',
        range: '',
        values: '',
      };
      const result = await executeGoogleSheets(config, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('range');
    });

    it('returns error when append/update has no values', async () => {
      const config: GoogleSheetsConfig = {
        mode: 'append',
        spreadsheetId: 'sheet-123',
        range: 'Sheet1!A:B',
        values: '',
      };
      const result = await executeGoogleSheets(config, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('values');
    });

    it('returns error for invalid JSON values', async () => {
      const config: GoogleSheetsConfig = {
        mode: 'append',
        spreadsheetId: 'sheet-123',
        range: 'Sheet1!A:B',
        values: 'not valid json',
      };
      const result = await executeGoogleSheets(config, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('JSON');
    });
  });

  describe('error handling', () => {
    it('handles Google API errors', async () => {
      mockSpreadsheetsValuesGet.mockRejectedValue(new Error('Spreadsheet not found'));

      const config: GoogleSheetsConfig = {
        mode: 'read',
        spreadsheetId: 'sheet-123',
        range: 'Sheet1!A1:B3',
        values: '',
      };
      const context = createMockContext();
      const result = await executeGoogleSheets(config, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Spreadsheet not found');
      expect(context.logger.error).toHaveBeenCalled();
    });

    it('handles missing Google account credentials', async () => {
      const { db } = require('@/lib/db');
      db.limit.mockResolvedValueOnce([]);

      const config: GoogleSheetsConfig = {
        mode: 'read',
        spreadsheetId: 'sheet-123',
        range: 'Sheet1!A1:B3',
        values: '',
      };
      const result = await executeGoogleSheets(config, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('Google account');
    });
  });

  describe('variable substitution', () => {
    it('substitutes variables in config fields', async () => {
      mockSpreadsheetsValuesGet.mockResolvedValue({
        data: { values: [['data']] },
      });

      const substituteVariables = jest.fn((template: string) => {
        const map: Record<string, string> = {
          '{{sheetId}}': 'resolved-sheet-id',
          '{{range}}': 'Sheet1!A1:C10',
        };
        return map[template] || template;
      });

      const config: GoogleSheetsConfig = {
        mode: 'read',
        spreadsheetId: '{{sheetId}}',
        range: '{{range}}',
        values: '',
      };
      await executeGoogleSheets(config, createMockContext({ substituteVariables }));

      expect(substituteVariables).toHaveBeenCalledWith('{{sheetId}}');
      expect(substituteVariables).toHaveBeenCalledWith('{{range}}');
    });
  });
});
