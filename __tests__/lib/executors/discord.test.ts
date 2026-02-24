/**
 * Discord Integration Executor Tests
 */

import { executeDiscord } from '@/lib/integrations/executors/discord';
import { ExecutionContext, IntegrationLogger } from '@/lib/integrations/types';
import { DiscordConfig } from '@/lib/integrations/definitions/discord';

// Mock global fetch
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

describe('executeDiscord', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
    });
  });

  it('sends message via webhook successfully', async () => {
    const config: DiscordConfig = {
      webhookUrl: 'https://discord.com/api/webhooks/123/abc',
      message: 'Hello from workflow',
      username: '',
    };
    const result = await executeDiscord(config, createMockContext());

    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('sent');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://discord.com/api/webhooks/123/abc',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('sends message with custom username', async () => {
    const config: DiscordConfig = {
      webhookUrl: 'https://discord.com/api/webhooks/123/abc',
      message: 'Hello',
      username: 'ZeitFlow Bot',
    };
    await executeDiscord(config, createMockContext());

    const fetchCall = mockFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.username).toBe('ZeitFlow Bot');
  });

  it('returns error when no webhook URL', async () => {
    const config: DiscordConfig = {
      webhookUrl: '',
      message: 'Hello',
      username: '',
    };
    const result = await executeDiscord(config, createMockContext());

    expect(result.success).toBe(false);
    expect(result.error).toContain('webhook URL');
  });

  it('returns error when no message', async () => {
    const config: DiscordConfig = {
      webhookUrl: 'https://discord.com/api/webhooks/123/abc',
      message: '',
      username: '',
    };
    const result = await executeDiscord(config, createMockContext());

    expect(result.success).toBe(false);
    expect(result.error).toContain('message');
  });

  it('handles webhook API errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'Unknown Webhook',
    });

    const config: DiscordConfig = {
      webhookUrl: 'https://discord.com/api/webhooks/123/abc',
      message: 'Hello',
      username: '',
    };
    const context = createMockContext();
    const result = await executeDiscord(config, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('404');
    expect(context.logger.error).toHaveBeenCalled();
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const config: DiscordConfig = {
      webhookUrl: 'https://discord.com/api/webhooks/123/abc',
      message: 'Hello',
      username: '',
    };
    const context = createMockContext();
    const result = await executeDiscord(config, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
    expect(context.logger.error).toHaveBeenCalled();
  });

  it('substitutes variables in all fields', async () => {
    const substituteVariables = jest.fn((template: string) => {
      const map: Record<string, string> = {
        '{{webhook}}': 'https://discord.com/api/webhooks/123/abc',
        '{{msg}}': 'Resolved message',
        '{{botName}}': 'My Bot',
      };
      return map[template] || template;
    });

    const config: DiscordConfig = {
      webhookUrl: '{{webhook}}',
      message: '{{msg}}',
      username: '{{botName}}',
    };
    await executeDiscord(config, createMockContext({ substituteVariables }));

    expect(substituteVariables).toHaveBeenCalledWith('{{webhook}}');
    expect(substituteVariables).toHaveBeenCalledWith('{{msg}}');
    expect(substituteVariables).toHaveBeenCalledWith('{{botName}}');
  });

  it('validates webhook URL format', async () => {
    const config: DiscordConfig = {
      webhookUrl: 'not-a-valid-url',
      message: 'Hello',
      username: '',
    };
    const result = await executeDiscord(config, createMockContext());

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid webhook URL');
  });
});
