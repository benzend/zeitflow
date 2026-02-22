import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/workflow/[id]';
import { db } from '@/lib/db';
import { usersTable, workflowsTable, workflowNodesTable, workflowConnectionsTable } from '@/schema';
import { eq } from 'drizzle-orm';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    transaction: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
}));

// Mock schema
jest.mock('@/schema', () => ({
  workflowsTable: {},
  workflowNodesTable: {},
  workflowConnectionsTable: {},
  usersTable: {}
}));

// Mock drizzle-orm
jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn()
}));

// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}));

// Mock auth options
jest.mock('@/pages/api/auth/[...nextauth]', () => ({
  authOptions: {}
}));

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => ({
  isRateLimited: jest.fn()
}));

describe('/api/workflow/[id]', () => {
  const mockDb = db as jest.Mocked<typeof db>;
  const mockGetServerSession = require('next-auth/next').getServerSession;
  const mockIsRateLimited = require('@/lib/rate-limit').isRateLimited;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    mockGetServerSession.mockResolvedValue({
      user: { email: 'test@example.com' }
    });

    mockIsRateLimited.mockResolvedValue(false);

    // Mock user lookup - need to handle multiple calls
    const mockUserSelect = {
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([{
            id: 'user-123',
            email: 'test@example.com'
          }])
        })
      })
    };

    // Mock workflow lookup
    const mockWorkflowSelect = {
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([{
            id: 123,
            userId: 'user-123',
            name: 'Test Workflow',
            description: 'Test description'
          }])
        })
      })
    };

    // Set up select mock to return different results for different calls
    mockDb.select
      .mockReturnValueOnce(mockWorkflowSelect) // First call for workflow lookup
      .mockReturnValueOnce(mockUserSelect) // Second call for user lookup
      .mockReturnValue(mockUserSelect); // Subsequent calls for user lookup

    // Mock transaction to call callback but skip actual DB operations
    mockDb.transaction.mockImplementation(async (callback) => {
      // Call the callback with a mock tx that does nothing
      const mockQueryBuilder = {
        where: jest.fn().mockResolvedValue(undefined)
      };
      await callback({
        delete: jest.fn((table) => {
          console.log('tx.delete called with table:', table);
          return mockQueryBuilder;
        }),
        insert: jest.fn().mockResolvedValue(undefined),
        update: jest.fn((table) => ({
          set: jest.fn((data) => mockQueryBuilder)
        }))
      });
    });
  });

  describe('POST /api/workflow/[id] - Save workflow', () => {
    it('should save workflow nodes and connections successfully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '123' },
        body: {
          nodes: [
            {
              id: 'node-1',
              type: 'entry',
              x: 100,
              y: 100,
              label: 'Test Entry',
              fields: [{ id: 'field-1', key: 'Name', type: 'text' }]
            },
            {
              id: 'node-2',
              type: 'ai',
              x: 300,
              y: 100,
              label: 'Test AI',
              aiConfig: {
                systemPrompt: 'You are a helpful assistant',
                userPrompt: 'Process: {{ entry.fields.Name }}',
                outputType: 'JSON',
                outputStructure: '{"result": "string"}',
                hasTemplate: false,
                templateText: ''
              }
            }
          ],
          connections: [
            { from: 'node-1', to: 'node-2' }
          ]
        }
      });

      // Mock transaction
      const mockQueryBuilder = {
        where: jest.fn().mockResolvedValue(undefined)
      };
      const mockInsertBuilder = {
        values: jest.fn().mockResolvedValue(undefined)
      };
      const mockTx = {
        delete: jest.fn((table) => {
          console.log('tx.delete called with table:', table);
          return mockQueryBuilder;
        }),
        insert: jest.fn((table) => {
          console.log('tx.insert called with table:', table);
          return mockInsertBuilder;
        })
      };
      mockDb.transaction.mockImplementation((callback) => callback(mockTx));

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Workflow saved successfully');

      // Verify transaction was called
      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('should return 400 for invalid nodes data', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '123' },
        body: {
          nodes: 'invalid', // Should be an array
          connections: []
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Invalid nodes data');
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '123' },
        body: { nodes: [], connections: [] }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('You must be signed in to access this resource');
    });

    it.skip('should return 404 for non-existent workflow', async () => {
      // Mock session
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      });

      mockIsRateLimited.mockResolvedValue(false);

      // Mock user lookup
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{
              id: 'user-123',
              email: 'test@example.com'
            }])
          })
        })
      } as any);

      // Mock workflow not found
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      } as any);

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '999' },
        body: { nodes: [], connections: [] }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Workflow not found');
    });

    it('should handle rate limiting', async () => {
      mockIsRateLimited.mockResolvedValue(true);

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '123' },
        body: { nodes: [], connections: [] }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(429);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(false);
      expect(responseData.message).toBe('Rate limit exceeded. Please try again later.');
    });
  });

  describe('GET /api/workflow/[id] - Load workflow', () => {
    it('should load workflow with nodes and connections', async () => {
      // Ensure session is mocked for this test
      mockGetServerSession.mockResolvedValue({
        user: { email: 'test@example.com' }
      });

      // Mock nodes and connections - need to handle the workflow lookup, user lookup, nodes, and connections
      const mockNodesSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            {
              id: 'node-1',
              workflowId: 123,
              type: 'entry',
              positionX: 100,
              positionY: 100,
              label: 'Test Entry',
              config: JSON.stringify({
                fields: [{ id: 'field-1', key: 'Name', type: 'text' }]
              })
            }
          ])
        })
      };

      const mockConnectionsSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            {
              workflowId: 123,
              fromNodeId: 'node-1',
              toNodeId: 'node-2'
            }
          ])
        })
      };

      // Override the default select mocks for this test
      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{
                id: 123,
                userId: 'user-123',
                name: 'Test Workflow',
                description: 'Test description'
              }])
            })
          })
        } as any) // workflow lookup
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{
                id: 'user-123',
                email: 'test@example.com'
              }])
            })
          })
        } as any) // user lookup
        .mockReturnValueOnce(mockNodesSelect) // nodes
        .mockReturnValueOnce(mockConnectionsSelect); // connections

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '123' }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      expect(responseData.success).toBe(true);
      expect(responseData.workflow).toBeDefined();
      expect(responseData.nodes).toBeDefined();
      expect(responseData.connections).toBeDefined();
    });
  });
});