/**
 * API Handler Tests
 *
 * Tests for sendError and handleResult utilities.
 */

// Mock next-auth before any imports
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/pages/api/auth/[...nextauth]', () => ({
  authOptions: {},
}));

jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('@/schema', () => ({
  usersTable: {},
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  isRateLimited: jest.fn().mockResolvedValue(false),
}));

import { createResponse } from 'node-mocks-http';
import { NextApiResponse } from 'next';
import { sendError, handleResult } from '@/lib/api-handler';
import {
  validationError,
  authenticationError,
  notFoundError,
  rateLimitError,
  internalError,
} from '@/lib/errors';
import { ok, err } from 'neverthrow';

describe('sendError', () => {
  it('sends the correct status code and body', () => {
    const res = createResponse<NextApiResponse>();
    const error = validationError('Bad input');

    sendError(res, error);

    expect(res.statusCode).toBe(400);
    const body = res._getJSONData();
    expect(body).toEqual({
      success: false,
      message: 'Bad input',
      code: 'VALIDATION_ERROR',
    });
  });

  it('sends 401 for authentication errors', () => {
    const res = createResponse<NextApiResponse>();
    sendError(res, authenticationError());
    expect(res.statusCode).toBe(401);
  });

  it('sends 404 for not found errors', () => {
    const res = createResponse<NextApiResponse>();
    sendError(res, notFoundError('Workflow'));
    expect(res.statusCode).toBe(404);
    expect(res._getJSONData().message).toBe('Workflow not found');
  });

  it('sends 429 for rate limit errors', () => {
    const res = createResponse<NextApiResponse>();
    sendError(res, rateLimitError());
    expect(res.statusCode).toBe(429);
  });

  it('sends 500 for internal errors', () => {
    const res = createResponse<NextApiResponse>();
    sendError(res, internalError());
    expect(res.statusCode).toBe(500);
  });

  it('does not expose context in the response', () => {
    const res = createResponse<NextApiResponse>();
    sendError(res, validationError('fail', { sensitiveField: 'secret' }));

    const body = res._getJSONData();
    expect(body.context).toBeUndefined();
    expect(body.sensitiveField).toBeUndefined();
  });

  it('includes error code in response', () => {
    const res = createResponse<NextApiResponse>();
    sendError(res, rateLimitError());

    const body = res._getJSONData();
    expect(body.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(body.success).toBe(false);
  });
});

describe('handleResult', () => {
  it('calls onSuccess for Ok results', () => {
    const res = createResponse<NextApiResponse>();
    const result = ok({ id: 1, name: 'test' });
    const onSuccess = jest.fn();

    handleResult(res, result, onSuccess);

    expect(onSuccess).toHaveBeenCalledWith({ id: 1, name: 'test' });
  });

  it('sends error response for Err results', () => {
    const res = createResponse<NextApiResponse>();
    const error = notFoundError('Workflow');
    const result = err(error);
    const onSuccess = jest.fn();

    handleResult(res, result, onSuccess);

    expect(onSuccess).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(404);
    expect(res._getJSONData().message).toBe('Workflow not found');
  });

  it('works with complex success values', () => {
    const res = createResponse<NextApiResponse>();
    const data = { workflows: [{ id: 1 }, { id: 2 }], total: 2 };
    const result = ok(data);
    const onSuccess = jest.fn((value) => {
      res.status(200).json({ success: true, ...value });
    });

    handleResult(res, result, onSuccess);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({
      success: true,
      workflows: [{ id: 1 }, { id: 2 }],
      total: 2,
    });
  });
});
