import React from 'react';
import { z } from 'zod';
import { IntegrationDefinition } from '../types';

/**
 * YouTube play-button icon
 */
const YouTubeIcon = ({ className, color }: { className?: string; color?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.5.6c-1 .3-1.7 1.1-2 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1 1.8 2 2.1 1.9.6 9.5.6 9.5.6s7.6 0 9.5-.6c1-.3 1.7-1.1 2-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8z"
      fill={color || 'currentColor'}
    />
    <path
      d="M9.75 15.02l6.35-3.02-6.35-3.02v6.04z"
      fill="white"
    />
  </svg>
);

/**
 * Zod schema for YouTube configuration
 */
export const YouTubeConfigSchema = z.object({
  mode: z.enum(['fetch', 'comment']).default('fetch'),
  videoUrl: z.string().optional().default(''),
  commentText: z.string().optional().default(''),
});

export type YouTubeConfig = z.infer<typeof YouTubeConfigSchema>;

/**
 * YouTube integration definition (client-safe metadata only)
 * Execute function is defined in executors/youtube.ts
 */
export const youtubeIntegration: Omit<IntegrationDefinition<typeof YouTubeConfigSchema>, 'execute'> = {
  id: 'youtube',
  name: 'YouTube',
  description: 'Fetch video data or post comments via YouTube API',
  category: 'data',

  icon: YouTubeIcon,
  color: '#FF0000',

  configSchema: YouTubeConfigSchema,
  defaultConfig: {
    mode: 'fetch',
    videoUrl: '',
    commentText: '',
  },

  uiConfig: {
    mode: {
      hint: 'select',
      label: 'Mode',
      options: [
        { value: 'fetch', label: 'Fetch Video Data' },
        { value: 'comment', label: 'Post Comment' },
      ],
      supportsVariables: false,
    },
    videoUrl: {
      hint: 'text',
      label: 'Video URL or ID',
      placeholder: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      supportsVariables: true,
    },
    commentText: {
      hint: 'textarea',
      label: 'Comment Text',
      placeholder: 'Great video! {{previousOutput}}',
      supportsVariables: true,
    },
  },

  auth: {
    type: 'oauth',
    requiresUserAuth: true,
  },

  outputVariables: [
    { name: 'title', type: 'string', description: 'Video title' },
    { name: 'description', type: 'string', description: 'Video description' },
    { name: 'viewCount', type: 'string', description: 'Number of views' },
    { name: 'likeCount', type: 'string', description: 'Number of likes' },
    { name: 'commentCount', type: 'string', description: 'Number of comments' },
    { name: 'channelName', type: 'string', description: 'Channel name' },
    { name: 'publishedAt', type: 'string', description: 'Publish date (ISO 8601)' },
    { name: 'thumbnailUrl', type: 'string', description: 'Thumbnail image URL' },
    { name: 'commentId', type: 'string', description: 'Posted comment ID (comment mode)' },
    { name: 'status', type: 'string', description: 'Operation status (success/failed)' },
  ],
};
