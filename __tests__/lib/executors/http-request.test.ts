/**
 * HTTP Request Integration Executor Tests
 */

import { executeHttpRequest } from '@/lib/integrations/executors/http-request';
import { ExecutionContext, IntegrationLogger } from '@/lib/integrations/types';
import { HttpRequestConfig } from '@/lib/integrations/definitions/http-request';

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

describe('executeHttpRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => '{"result":"success"}',
    });
  });

  it('performs GET request successfully', async () => {
    const config: HttpRequestConfig = {
      url: 'https://api.example.com/data',
      method: 'GET',
      headers: '',
      body: '',
      authType: 'none',
      authValue: '',
    };
    const result = await executeHttpRequest(config, createMockContext());

    expect(result.success).toBe(true);
    expect(result.data?.statusCode).toBe(200);
    expect(result.data?.body).toBe('{"result":"success"}');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/data',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('performs POST request with body', async () => {
    const config: HttpRequestConfig = {
      url: 'https://api.example.com/data',
      method: 'POST',
      headers: '{"Content-Type": "application/json"}',
      body: '{"key": "value"}',
      authType: 'none',
      authValue: '',
    };
    await executeHttpRequest(config, createMockContext());

    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[1].method).toBe('POST');
    expect(fetchCall[1].body).toBe('{"key": "value"}');
  });

  it('performs PUT request', async () => {
    const config: HttpRequestConfig = {
      url: 'https://api.example.com/data/1',
      method: 'PUT',
      headers: '',
      body: '{"updated": true}',
      authType: 'none',
      authValue: '',
    };
    await executeHttpRequest(config, createMockContext());

    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[1].method).toBe('PUT');
  });

  it('performs DELETE request', async () => {
    const config: HttpRequestConfig = {
      url: 'https://api.example.com/data/1',
      method: 'DELETE',
      headers: '',
      body: '',
      authType: 'none',
      authValue: '',
    };
    await executeHttpRequest(config, createMockContext());

    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[1].method).toBe('DELETE');
  });

  it('adds Bearer token auth header', async () => {
    const config: HttpRequestConfig = {
      url: 'https://api.example.com/data',
      method: 'GET',
      headers: '',
      body: '',
      authType: 'bearer',
      authValue: 'my-token-123',
    };
    await executeHttpRequest(config, createMockContext());

    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[1].headers['Authorization']).toBe('Bearer my-token-123');
  });

  it('adds Basic auth header', async () => {
    const config: HttpRequestConfig = {
      url: 'https://api.example.com/data',
      method: 'GET',
      headers: '',
      body: '',
      authType: 'basic',
      authValue: 'user:pass',
    };
    await executeHttpRequest(config, createMockContext());

    const fetchCall = mockFetch.mock.calls[0];
    const expectedBasic = Buffer.from('user:pass').toString('base64');
    expect(fetchCall[1].headers['Authorization']).toBe(`Basic ${expectedBasic}`);
  });

  it('adds API key header', async () => {
    const config: HttpRequestConfig = {
      url: 'https://api.example.com/data',
      method: 'GET',
      headers: '',
      body: '',
      authType: 'api_key',
      authValue: 'my-api-key',
    };
    await executeHttpRequest(config, createMockContext());

    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[1].headers['X-API-Key']).toBe('my-api-key');
  });

  it('merges custom headers with auth headers', async () => {
    const config: HttpRequestConfig = {
      url: 'https://api.example.com/data',
      method: 'POST',
      headers: '{"X-Custom": "value", "Content-Type": "application/json"}',
      body: '{}',
      authType: 'bearer',
      authValue: 'token',
    };
    await executeHttpRequest(config, createMockContext());

    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[1].headers['X-Custom']).toBe('value');
    expect(fetchCall[1].headers['Authorization']).toBe('Bearer token');
  });

  it('returns error when no URL', async () => {
    const config: HttpRequestConfig = {
      url: '',
      method: 'GET',
      headers: '',
      body: '',
      authType: 'none',
      authValue: '',
    };
    const result = await executeHttpRequest(config, createMockContext());

    expect(result.success).toBe(false);
    expect(result.error).toContain('URL');
  });

  it('handles HTTP error responses', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'Server error',
    });

    const config: HttpRequestConfig = {
      url: 'https://api.example.com/data',
      method: 'GET',
      headers: '',
      body: '',
      authType: 'none',
      authValue: '',
    };
    const result = await executeHttpRequest(config, createMockContext());

    // HTTP errors should still succeed (user may want to handle status codes in conditions)
    expect(result.success).toBe(true);
    expect(result.data?.statusCode).toBe(500);
    expect(result.data?.body).toBe('Server error');
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValue(new Error('Connection refused'));

    const config: HttpRequestConfig = {
      url: 'https://api.example.com/data',
      method: 'GET',
      headers: '',
      body: '',
      authType: 'none',
      authValue: '',
    };
    const context = createMockContext();
    const result = await executeHttpRequest(config, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Connection refused');
    expect(context.logger.error).toHaveBeenCalled();
  });

  it('handles invalid JSON headers gracefully', async () => {
    const config: HttpRequestConfig = {
      url: 'https://api.example.com/data',
      method: 'GET',
      headers: 'not valid json',
      body: '',
      authType: 'none',
      authValue: '',
    };
    const context = createMockContext();
    const result = await executeHttpRequest(config, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain('header');
  });

  it('substitutes variables in all fields', async () => {
    const substituteVariables = jest.fn((template: string) => {
      const map: Record<string, string> = {
        '{{apiUrl}}': 'https://api.example.com/data',
        '{{payload}}': '{"key":"value"}',
        '{{token}}': 'secret-token',
        '{{customHeaders}}': '{"X-Custom": "val"}',
      };
      return map[template] || template;
    });

    const config: HttpRequestConfig = {
      url: '{{apiUrl}}',
      method: 'POST',
      headers: '{{customHeaders}}',
      body: '{{payload}}',
      authType: 'bearer',
      authValue: '{{token}}',
    };
    await executeHttpRequest(config, createMockContext({ substituteVariables }));

    expect(substituteVariables).toHaveBeenCalledWith('{{apiUrl}}');
    expect(substituteVariables).toHaveBeenCalledWith('{{payload}}');
    expect(substituteVariables).toHaveBeenCalledWith('{{token}}');
  });

  it('parses JSON response body into data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => '{"name":"John","age":30}',
    });

    const config: HttpRequestConfig = {
      url: 'https://api.example.com/data',
      method: 'GET',
      headers: '',
      body: '',
      authType: 'none',
      authValue: '',
    };
    const result = await executeHttpRequest(config, createMockContext());

    expect(result.data?.parsedBody).toEqual({ name: 'John', age: 30 });
  });
});
