/**
 * Workflows API Route Tests
 *
 * Tests the /api/workflows endpoint which uses apiHandler().
 */

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/pages/api/auth/[...nextauth]', () => ({
  authOptions: {},
}));

const mockUserLookup = jest.fn();
const mockWorkflowSelect = jest.fn();
const mockWorkflowInsert = jest.fn();
const mockNodeInsert = jest.fn();

jest.mock('@/lib/db', () => ({
  db: {
    select: () => ({
      from: (table: unknown) => {
        // Route to different mocks based on which table
        if ((table as any)?._name === 'workflows') return { where: () => ({ groupBy: () => ({ orderBy: () => mockWorkflowSelect() }) }) };
        return { where: () => ({ limit: () => mockUserLookup() }) };
      }
    }),
    insert: () => ({
      values: (data: unknown) => ({
        returning: () => mockWorkflowInsert(data),
      }),
    }),
  },
}));

jest.mock('@/schema', () => ({
  workflowsTable: { _name: 'workflows' },
  workflowNodesTable: {},
  workflowExecutionsTable: {},
  usersTable: { _name: 'users' },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  sql: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  isRateLimited: jest.fn().mockResolvedValue(false),
}));

jest.mock('@/lib/webhook-utils', () => ({
  generateWebhookSecret: jest.fn().mockReturnValue('test-secret'),
}));

import { createRequest, createResponse } from 'node-mocks-http';
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import handler from '@/pages/api/workflows';

describe('/api/workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { isRateLimited } = require('@/lib/rate-limit');
    isRateLimited.mockResolvedValue(false);
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    });
    mockUserLookup.mockResolvedValue([{ id: 'user-1', email: 'test@example.com' }]);
  });

  it('rejects unauthenticated requests', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = createRequest<NextApiRequest>({ method: 'GET' });
    const res = createResponse<NextApiResponse>();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res._getJSONData().code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('rejects unsupported methods', async () => {
    const req = createRequest<NextApiRequest>({ method: 'PATCH' });
    const res = createResponse<NextApiResponse>();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res._getJSONData().code).toBe('METHOD_NOT_ALLOWED');
  });

  it('POST rejects empty workflow name', async () => {
    const req = createRequest<NextApiRequest>({
      method: 'POST',
      body: { name: '' },
    });
    const res = createResponse<NextApiResponse>();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().code).toBe('VALIDATION_ERROR');
    expect(res._getJSONData().message).toContain('name is required');
  });

  it('handles rate limiting', async () => {
    const { isRateLimited } = require('@/lib/rate-limit');
    isRateLimited.mockResolvedValue(true);

    const req = createRequest<NextApiRequest>({ method: 'GET' });
    const res = createResponse<NextApiResponse>();

    await handler(req, res);

    expect(res.statusCode).toBe(429);
  });

  it('returns user not found when user missing from DB', async () => {
    mockUserLookup.mockResolvedValue([]);

    const req = createRequest<NextApiRequest>({ method: 'GET' });
    const res = createResponse<NextApiResponse>();

    await handler(req, res);

    expect(res.statusCode).toBe(404);
  });
});
