/**
 * Email Integration Executor Tests
 */

import { executeEmail } from '@/lib/integrations/executors/email';
import { ExecutionContext, IntegrationLogger } from '@/lib/integrations/types';
import { EmailConfig } from '@/lib/integrations/definitions/email';

// Mock resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn(),
    },
  })),
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

describe('executeEmail', () => {
  let mockResendSend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Access the mock through dynamic import
    const { Resend } = require('resend');
    mockResendSend = jest.fn().mockResolvedValue({ error: null });
    Resend.mockImplementation(() => ({
      emails: { send: mockResendSend },
    }));
  });

  it('sends email successfully', async () => {
    const config: EmailConfig = {
      to: ['user@example.com'],
      subject: 'Test Subject',
      message: 'Hello world',
    };
    const context = createMockContext();

    const result = await executeEmail(config, context);

    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('sent');
    expect(context.logger.info).toHaveBeenCalledWith(
      'Starting email send',
      expect.any(Object)
    );
  });

  it('returns error when no recipients', async () => {
    const config: EmailConfig = {
      to: [],
      subject: 'Test',
      message: 'Hello',
    };
    const context = createMockContext();

    const result = await executeEmail(config, context);

    expect(result.success).toBe(false);
    expect(result.error).toBe('No recipients specified');
    expect(context.logger.error).toHaveBeenCalledWith('No recipients specified');
  });

  it('handles Resend API errors', async () => {
    mockResendSend.mockResolvedValue({
      error: { message: 'Invalid API key' },
    });

    const config: EmailConfig = {
      to: ['user@example.com'],
      subject: 'Test',
      message: 'Hello',
    };
    const context = createMockContext();

    const result = await executeEmail(config, context);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid API key');
  });

  it('handles thrown exceptions', async () => {
    mockResendSend.mockRejectedValue(new Error('Network timeout'));

    const config: EmailConfig = {
      to: ['user@example.com'],
      subject: 'Test',
      message: 'Hello',
    };
    const context = createMockContext();

    const result = await executeEmail(config, context);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network timeout');
    expect(context.logger.error).toHaveBeenCalledWith(
      'Email send failed',
      expect.objectContaining({ error: 'Network timeout' })
    );
  });

  it('substitutes variables in all fields', async () => {
    const config: EmailConfig = {
      to: ['{{contact.email}}'],
      subject: '{{alert.title}}',
      message: '{{alert.body}}',
      from: '{{sender}}',
    };

    const substituteVariables = jest.fn((template: string) => {
      const map: Record<string, string> = {
        '{{contact.email}}': 'real@example.com',
        '{{alert.title}}': 'Important Alert',
        '{{alert.body}}': 'Something happened',
        '{{sender}}': 'noreply@app.com',
      };
      return map[template] || template;
    });

    const context = createMockContext({ substituteVariables });

    await executeEmail(config, context);

    expect(substituteVariables).toHaveBeenCalledWith('{{contact.email}}');
    expect(substituteVariables).toHaveBeenCalledWith('{{alert.title}}');
    expect(substituteVariables).toHaveBeenCalledWith('{{alert.body}}');
    expect(substituteVariables).toHaveBeenCalledWith('{{sender}}');
  });

  it('uses default from address when not provided', async () => {
    process.env.RESEND_FROM_EMAIL = 'default@zeitflow.io';

    const config: EmailConfig = {
      to: ['user@example.com'],
      subject: 'Test',
      message: 'Hello',
    };
    const context = createMockContext();

    await executeEmail(config, context);

    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'default@zeitflow.io' })
    );

    delete process.env.RESEND_FROM_EMAIL;
  });
});
