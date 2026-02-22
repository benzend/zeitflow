/**
 * SMS Integration Executor Tests
 */

import { executeSMS } from '@/lib/integrations/executors/sms';
import { ExecutionContext, IntegrationLogger } from '@/lib/integrations/types';
import { SMSConfig } from '@/lib/integrations/definitions/sms';

// Mock twilio
const mockCreate = jest.fn();
jest.mock('twilio', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    messages: { create: mockCreate },
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

describe('executeSMS', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      TWILIO_ACCOUNT_SID: 'test-sid',
      TWILIO_AUTH_TOKEN: 'test-token',
      TWILIO_PHONE_NUMBER: '+15550001111',
    };
    mockCreate.mockResolvedValue({ sid: 'SM123' });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('sends SMS successfully to one recipient', async () => {
    const config: SMSConfig = {
      to: ['+12345678900'],
      message: 'Hello from workflow',
      twilioAccountSid: '',
      twilioAuthToken: '',
      twilioPhoneNumber: '',
    };
    const context = createMockContext();

    const result = await executeSMS(config, context);

    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('sent');
    expect(result.data?.sentCount).toBe(1);
    expect(result.data?.failedCount).toBe(0);
  });

  it('sends to multiple recipients in parallel', async () => {
    const config: SMSConfig = {
      to: ['+12345678900', '+19876543210'],
      message: 'Batch message',
      twilioAccountSid: '',
      twilioAuthToken: '',
      twilioPhoneNumber: '',
    };
    const context = createMockContext();

    const result = await executeSMS(config, context);

    expect(result.success).toBe(true);
    expect(result.data?.sentCount).toBe(2);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('returns error when no recipients', async () => {
    const config: SMSConfig = {
      to: [],
      message: 'Hello',
      twilioAccountSid: '',
      twilioAuthToken: '',
      twilioPhoneNumber: '',
    };
    const context = createMockContext();

    const result = await executeSMS(config, context);

    expect(result.success).toBe(false);
    expect(result.error).toBe('No recipients specified');
  });

  it('returns error for invalid phone numbers', async () => {
    const config: SMSConfig = {
      to: ['not-a-number'],
      message: 'Hello',
      twilioAccountSid: '',
      twilioAuthToken: '',
      twilioPhoneNumber: '',
    };
    const context = createMockContext();

    const result = await executeSMS(config, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid phone number format');
    expect(result.error).toContain('not-a-number');
  });

  it('returns error when Twilio credentials missing', async () => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;

    const config: SMSConfig = {
      to: ['+12345678900'],
      message: 'Hello',
      twilioAccountSid: '',
      twilioAuthToken: '',
      twilioPhoneNumber: '',
    };
    const context = createMockContext();

    const result = await executeSMS(config, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Twilio credentials not configured');
  });

  it('handles partial failure', async () => {
    mockCreate
      .mockResolvedValueOnce({ sid: 'SM123' })
      .mockRejectedValueOnce(new Error('Invalid number'));

    const config: SMSConfig = {
      to: ['+12345678900', '+19876543210'],
      message: 'Hello',
      twilioAccountSid: '',
      twilioAuthToken: '',
      twilioPhoneNumber: '',
    };
    const context = createMockContext();

    const result = await executeSMS(config, context);

    expect(result.success).toBe(true); // partial success
    expect(result.error).toContain('Some messages failed');
    expect(result.data?.sentCount).toBe(1);
    expect(result.data?.failedCount).toBe(1);
  });

  it('handles total failure', async () => {
    mockCreate.mockRejectedValue(new Error('Service unavailable'));

    const config: SMSConfig = {
      to: ['+12345678900'],
      message: 'Hello',
      twilioAccountSid: '',
      twilioAuthToken: '',
      twilioPhoneNumber: '',
    };
    const context = createMockContext();

    const result = await executeSMS(config, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to send SMS');
    expect(result.data?.sentCount).toBe(0);
  });

  it('uses custom Twilio credentials when provided', async () => {
    const twilio = require('twilio').default;

    const config: SMSConfig = {
      to: ['+12345678900'],
      message: 'Hello',
      twilioAccountSid: 'custom-sid',
      twilioAuthToken: 'custom-token',
      twilioPhoneNumber: '+15559990000',
    };
    const context = createMockContext();

    await executeSMS(config, context);

    expect(twilio).toHaveBeenCalledWith('custom-sid', 'custom-token');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ from: '+15559990000' })
    );
  });
});
