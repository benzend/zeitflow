/**
 * Subscribe API Route Tests
 */

// Mock dependencies before imports
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/pages/api/auth/[...nextauth]', () => ({
  authOptions: {},
}));

const mockInsert = jest.fn().mockReturnThis();
const mockValues = jest.fn().mockResolvedValue([]);
const mockSelect = jest.fn().mockReturnThis();
const mockFrom = jest.fn().mockReturnThis();
const mockWhere = jest.fn().mockReturnThis();
const mockLimit = jest.fn().mockResolvedValue([]);

jest.mock('@/lib/db', () => ({
  db: {
    select: () => ({ from: () => ({ where: () => ({ limit: mockLimit }) }) }),
    insert: () => ({ values: mockValues }),
  },
}));

jest.mock('@/schema', () => ({
  subscribersTable: {},
  usersTable: {},
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  isRateLimited: jest.fn().mockResolvedValue(false),
}));

import { createRequest, createResponse } from 'node-mocks-http';
import { NextApiRequest, NextApiResponse } from 'next';
import handler from '@/pages/api/subscribe';

describe('/api/subscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLimit.mockResolvedValue([]);
    mockValues.mockResolvedValue([]);
  });

  it('rejects non-POST methods', async () => {
    const req = createRequest<NextApiRequest>({ method: 'GET' });
    const res = createResponse<NextApiResponse>();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
  });

  it('rejects invalid email', async () => {
    const req = createRequest<NextApiRequest>({
      method: 'POST',
      body: { email: 'not-an-email' },
    });
    const res = createResponse<NextApiResponse>();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toContain('Invalid email');
  });

  it('rejects duplicate email', async () => {
    mockLimit.mockResolvedValue([{ email: 'test@example.com' }]);

    const req = createRequest<NextApiRequest>({
      method: 'POST',
      body: { email: 'test@example.com' },
    });
    const res = createResponse<NextApiResponse>();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().message).toContain('already subscribed');
  });

  it('subscribes successfully', async () => {
    mockLimit.mockResolvedValue([]);

    const req = createRequest<NextApiRequest>({
      method: 'POST',
      body: { email: 'new@example.com' },
    });
    const res = createResponse<NextApiResponse>();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData().success).toBe(true);
  });

  it('handles rate limiting', async () => {
    const { isRateLimited } = require('@/lib/rate-limit');
    isRateLimited.mockResolvedValue(true);

    const req = createRequest<NextApiRequest>({
      method: 'POST',
      body: { email: 'test@example.com' },
    });
    const res = createResponse<NextApiResponse>();

    await handler(req, res);

    expect(res.statusCode).toBe(429);
  });
});
