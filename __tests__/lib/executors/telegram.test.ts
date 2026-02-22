/**
 * Telegram Integration Executor Tests
 */

import { executeTelegram } from '@/lib/integrations/executors/telegram';
import { ExecutionContext, IntegrationLogger } from '@/lib/integrations/types';
import { TelegramConfig } from '@/lib/integrations/definitions/telegram';

const mockSendMessage = jest.fn();
jest.mock('node-telegram-bot-api', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    sendMessage: mockSendMessage,
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

describe('executeTelegram', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, TELEGRAM_BOT_TOKEN: 'test-bot-token' };
    mockSendMessage.mockResolvedValue({ message_id: 123 });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('sends message successfully', async () => {
    const config: TelegramConfig = {
      chatId: '123456',
      message: 'Hello from workflow',
      botToken: '',
    };
    const result = await executeTelegram(config, createMockContext());

    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('sent');
    expect(result.data?.messageId).toBe(123);
  });

  it('returns error when bot token not configured', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;

    const config: TelegramConfig = {
      chatId: '123456',
      message: 'Hello',
      botToken: '',
    };
    const result = await executeTelegram(config, createMockContext());

    expect(result.success).toBe(false);
    expect(result.error).toContain('bot token not configured');
  });

  it('returns error when no chat ID', async () => {
    const config: TelegramConfig = {
      chatId: '',
      message: 'Hello',
      botToken: '',
    };
    const result = await executeTelegram(config, createMockContext());

    expect(result.success).toBe(false);
    expect(result.error).toBe('No chat ID specified');
  });

  it('returns error when no message', async () => {
    const config: TelegramConfig = {
      chatId: '123456',
      message: '',
      botToken: '',
    };
    const result = await executeTelegram(config, createMockContext());

    expect(result.success).toBe(false);
    expect(result.error).toBe('No message specified');
  });

  it('handles API errors', async () => {
    mockSendMessage.mockRejectedValue(new Error('Chat not found'));

    const config: TelegramConfig = {
      chatId: '123456',
      message: 'Hello',
      botToken: '',
    };
    const context = createMockContext();
    const result = await executeTelegram(config, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Chat not found');
    expect(context.logger.error).toHaveBeenCalled();
  });

  it('uses custom bot token when provided', async () => {
    const TelegramBot = require('node-telegram-bot-api').default;

    const config: TelegramConfig = {
      chatId: '123456',
      message: 'Hello',
      botToken: 'custom-token',
    };
    await executeTelegram(config, createMockContext());

    expect(TelegramBot).toHaveBeenCalledWith('custom-token', { polling: false });
  });

  it('substitutes variables in chat ID and message', async () => {
    const substituteVariables = jest.fn((template: string) => {
      const map: Record<string, string> = {
        '{{chatId}}': '999888',
        '{{msg}}': 'Resolved message',
      };
      return map[template] || template;
    });

    const config: TelegramConfig = {
      chatId: '{{chatId}}',
      message: '{{msg}}',
      botToken: '',
    };
    await executeTelegram(config, createMockContext({ substituteVariables }));

    expect(substituteVariables).toHaveBeenCalledWith('{{chatId}}');
    expect(substituteVariables).toHaveBeenCalledWith('{{msg}}');
  });
});
