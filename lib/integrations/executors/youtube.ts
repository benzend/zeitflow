/**
 * YouTube Integration Executor (Server-Side Only)
 *
 * This file contains the server-side execution logic for the YouTube integration.
 * It should only be imported in server-side code (API routes, server components).
 */

import { ExecutionContext, IntegrationResult } from '../types';
import { YouTubeConfig } from '../definitions/youtube';

/**
 * Execute the YouTube integration
 */
export async function executeYouTube(
  config: YouTubeConfig,
  context: ExecutionContext
): Promise<IntegrationResult> {
  const { logger } = context;
  const endTimer = logger.startTimer('youtube_execute');

  logger.info('Starting YouTube integration', {
    mode: config.mode,
    hasVideoUrl: !!config.videoUrl,
  });

  // Substitute variables
  const videoUrl = context.substituteVariables(config.videoUrl || '');
  const commentText = context.substituteVariables(config.commentText || '');

  // Dynamically import to avoid bundling issues
  const { YouTubeService, extractVideoId } = await import('@/lib/youtube');

  // Extract and validate video ID
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    logger.error('Invalid video URL or ID', { videoUrl });
    endTimer();
    return {
      success: false,
      error: `Invalid video URL or ID: ${videoUrl}`,
      data: { status: 'failed' },
    };
  }

  logger.debug('Video ID extracted', { videoId, originalInput: videoUrl });

  try {
    if (config.mode === 'fetch') {
      logger.info('Fetching video data', { videoId });
      const data = await YouTubeService.getVideoData(context.userId, videoId);

      endTimer();
      logger.info('Video data fetched successfully', {
        title: data.title,
        viewCount: data.viewCount,
      });

      return {
        success: true,
        data: { ...data, status: 'success' },
      };
    } else {
      // comment mode
      if (!commentText) {
        logger.error('No comment text provided');
        endTimer();
        return {
          success: false,
          error: 'Comment text is required',
          data: { status: 'failed' },
        };
      }

      logger.info('Posting comment', { videoId, commentLength: commentText.length });
      const result = await YouTubeService.postComment(context.userId, videoId, commentText);

      endTimer();
      logger.info('Comment posted successfully', { commentId: result.commentId });

      return {
        success: true,
        data: {
          commentId: result.commentId,
          status: 'success',
        },
      };
    }
  } catch (err) {
    endTimer();
    const errorMessage = err instanceof Error ? err.message : 'YouTube operation failed';

    // Provide a helpful message if it's a scope/auth issue
    const isAuthError = errorMessage.includes('insufficient') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('401') ||
      errorMessage.includes('403');

    const displayError = isAuthError
      ? `YouTube authorization error: ${errorMessage}. You may need to re-authenticate with Google to grant YouTube permissions.`
      : errorMessage;

    logger.error('YouTube operation failed', { error: displayError });
    return {
      success: false,
      error: displayError,
      data: { status: 'failed' },
    };
  }
}
