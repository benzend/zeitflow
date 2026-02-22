/**
 * YouTube Integration Executor Tests
 */

import { executeYouTube } from '@/lib/integrations/executors/youtube';
import { ExecutionContext, IntegrationLogger } from '@/lib/integrations/types';
import { YouTubeConfig } from '@/lib/integrations/definitions/youtube';

// Mock database
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([{ id: 'account-1', userId: 'user-1' }]),
  },
}));

jest.mock('@/schema', () => ({
  accountsTable: {},
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
}));

// Mock YouTube service
const mockGetVideoData = jest.fn();
const mockPostComment = jest.fn();
const mockExtractVideoId = jest.fn();

jest.mock('@/lib/youtube', () => ({
  YouTubeService: {
    getVideoData: (...args: unknown[]) => mockGetVideoData(...args),
    postComment: (...args: unknown[]) => mockPostComment(...args),
  },
  extractVideoId: (...args: unknown[]) => mockExtractVideoId(...args),
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

describe('executeYouTube', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExtractVideoId.mockReturnValue('dQw4w9WgXcQ');
    mockGetVideoData.mockResolvedValue({
      title: 'Test Video',
      viewCount: '1000000',
    });
    mockPostComment.mockResolvedValue({ commentId: 'comment-123' });

    // Reset db mock to return an account
    const { db } = require('@/lib/db');
    db.select.mockReturnThis();
    db.from.mockReturnThis();
    db.where.mockReturnThis();
    db.limit.mockResolvedValue([{ id: 'account-1', userId: 'user-1' }]);
  });

  it('fetches video data successfully', async () => {
    const config: YouTubeConfig = {
      mode: 'fetch',
      videoUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      commentText: '',
    };
    const result = await executeYouTube(config, createMockContext());

    expect(result.success).toBe(true);
    expect(result.data?.title).toBe('Test Video');
    expect(result.data?.status).toBe('success');
  });

  it('posts comment successfully', async () => {
    const config: YouTubeConfig = {
      mode: 'comment',
      videoUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      commentText: 'Great video!',
    };
    const result = await executeYouTube(config, createMockContext());

    expect(result.success).toBe(true);
    expect(result.data?.commentId).toBe('comment-123');
  });

  it('returns error when no Google account connected', async () => {
    const { db } = require('@/lib/db');
    db.limit.mockResolvedValue([]);

    const config: YouTubeConfig = {
      mode: 'fetch',
      videoUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      commentText: '',
    };
    const result = await executeYouTube(config, createMockContext());

    expect(result.success).toBe(false);
    expect(result.error).toContain('No Google account connected');
  });

  it('returns error for invalid video URL', async () => {
    mockExtractVideoId.mockReturnValue(null);

    const config: YouTubeConfig = {
      mode: 'fetch',
      videoUrl: 'not-a-url',
      commentText: '',
    };
    const result = await executeYouTube(config, createMockContext());

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid video URL');
  });

  it('returns error when comment text is empty in comment mode', async () => {
    const config: YouTubeConfig = {
      mode: 'comment',
      videoUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      commentText: '',
    };
    const result = await executeYouTube(config, createMockContext());

    expect(result.success).toBe(false);
    expect(result.error).toBe('Comment text is required');
  });

  it('handles auth errors with helpful message', async () => {
    mockGetVideoData.mockRejectedValue(new Error('insufficient permissions'));

    const config: YouTubeConfig = {
      mode: 'fetch',
      videoUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      commentText: '',
    };
    const result = await executeYouTube(config, createMockContext());

    expect(result.success).toBe(false);
    expect(result.error).toContain('authorization error');
    expect(result.error).toContain('reconnect');
  });

  it('handles generic API errors', async () => {
    mockGetVideoData.mockRejectedValue(new Error('Network timeout'));

    const config: YouTubeConfig = {
      mode: 'fetch',
      videoUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      commentText: '',
    };
    const result = await executeYouTube(config, createMockContext());

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network timeout');
  });
});
