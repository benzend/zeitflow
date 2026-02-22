import {
  validationError,
  authenticationError,
  authorizationError,
  notFoundError,
  rateLimitError,
  integrationError,
  configurationError,
  internalError,
  toAppError,
  isAppError,
  AppError,
} from '@/lib/errors';

describe('Error Factory Functions', () => {
  describe('validationError', () => {
    it('creates a validation error with correct defaults', () => {
      const error = validationError('Name is required');
      expect(error).toEqual({
        category: 'VALIDATION',
        message: 'Name is required',
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        context: undefined,
      });
    });

    it('includes context when provided', () => {
      const error = validationError('Invalid field', { field: 'email' });
      expect(error.context).toEqual({ field: 'email' });
    });
  });

  describe('authenticationError', () => {
    it('creates with default message', () => {
      const error = authenticationError();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTHENTICATION_REQUIRED');
      expect(error.message).toContain('signed in');
    });

    it('accepts custom message', () => {
      const error = authenticationError('Token expired');
      expect(error.message).toBe('Token expired');
    });
  });

  describe('authorizationError', () => {
    it('creates with 403 status', () => {
      const error = authorizationError();
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });
  });

  describe('notFoundError', () => {
    it('creates with resource name in message', () => {
      const error = notFoundError('Workflow');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Workflow not found');
    });

    it('includes context', () => {
      const error = notFoundError('Workflow', { id: 42 });
      expect(error.context).toEqual({ id: 42 });
    });
  });

  describe('rateLimitError', () => {
    it('creates with 429 status', () => {
      const error = rateLimitError();
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('integrationError', () => {
    it('creates with integration name in code', () => {
      const error = integrationError('slack', 'Bot not found');
      expect(error.statusCode).toBe(502);
      expect(error.code).toBe('INTEGRATION_SLACK_ERROR');
      expect(error.message).toBe('Bot not found');
    });
  });

  describe('configurationError', () => {
    it('creates with 500 status', () => {
      const error = configurationError('Missing API key');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('CONFIGURATION_ERROR');
    });
  });

  describe('internalError', () => {
    it('creates with default message', () => {
      const error = internalError();
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Internal server error');
    });

    it('accepts custom message and context', () => {
      const error = internalError('DB connection failed', { host: 'localhost' });
      expect(error.message).toBe('DB connection failed');
      expect(error.context).toEqual({ host: 'localhost' });
    });
  });
});

describe('toAppError', () => {
  it('passes through an existing AppError unchanged', () => {
    const original = validationError('test');
    expect(toAppError(original)).toBe(original);
  });

  it('wraps a standard Error as INTERNAL', () => {
    const error = toAppError(new Error('something broke'));
    expect(error.category).toBe('INTERNAL');
    expect(error.message).toBe('something broke');
    expect(error.statusCode).toBe(500);
    expect(error.context?.originalError).toBeDefined();
  });

  it('wraps a string as INTERNAL', () => {
    const error = toAppError('plain string error');
    expect(error.message).toBe('plain string error');
    expect(error.category).toBe('INTERNAL');
  });

  it('wraps null/undefined gracefully', () => {
    expect(toAppError(null).message).toBe('null');
    expect(toAppError(undefined).message).toBe('undefined');
  });
});

describe('isAppError', () => {
  it('returns true for AppError objects', () => {
    expect(isAppError(validationError('test'))).toBe(true);
    expect(isAppError(internalError())).toBe(true);
  });

  it('returns false for non-AppError values', () => {
    expect(isAppError(new Error('test'))).toBe(false);
    expect(isAppError({ message: 'test' })).toBe(false);
    expect(isAppError('string')).toBe(false);
    expect(isAppError(null)).toBe(false);
  });
});
