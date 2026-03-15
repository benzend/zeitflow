import { google } from 'googleapis';
import { db } from './db';
import { accountsTable } from '../schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from './encryption';

/**
 * Extract a YouTube video ID from a URL or bare ID.
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - bare VIDEO_ID strings
 */
export function extractVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // youtube.com/watch?v=ID
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtube.com')) {
      return url.searchParams.get('v') || null;
    }
    // youtu.be/ID
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.slice(1);
      return id || null;
    }
  } catch {
    // Not a URL — treat as bare ID
  }

  // Bare video ID (11 characters, alphanumeric + - + _)
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export class YouTubeService {
  private static async getOAuth2Client(userId: string) {
    const account = await db.select()
      .from(accountsTable)
      .where(eq(accountsTable.userId, userId))
      .limit(1);

    if (account.length === 0) {
      throw new Error('No Google account linked');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    );

    oauth2Client.setCredentials({
      access_token: decrypt(account[0].access_token),
      refresh_token: decrypt(account[0].refresh_token),
    });

    // Handle token refresh — encrypt before persisting
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        await db.update(accountsTable)
          .set({
            refresh_token: encrypt(tokens.refresh_token),
            access_token: encrypt(tokens.access_token ?? null),
            expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
          })
          .where(eq(accountsTable.userId, userId));
      } else {
        await db.update(accountsTable)
          .set({
            access_token: encrypt(tokens.access_token ?? null),
            expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
          })
          .where(eq(accountsTable.userId, userId));
      }
    });

    return oauth2Client;
  }

  static async getVideoData(userId: string, videoId: string) {
    const oauth2Client = await this.getOAuth2Client(userId);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const response = await youtube.videos.list({
      part: ['snippet', 'statistics'],
      id: [videoId],
    });

    const video = response.data.items?.[0];
    if (!video) {
      throw new Error(`Video not found: ${videoId}`);
    }

    return {
      title: video.snippet?.title || '',
      description: video.snippet?.description || '',
      viewCount: video.statistics?.viewCount || '0',
      likeCount: video.statistics?.likeCount || '0',
      commentCount: video.statistics?.commentCount || '0',
      channelName: video.snippet?.channelTitle || '',
      publishedAt: video.snippet?.publishedAt || '',
      thumbnailUrl: video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.default?.url || '',
    };
  }

  static async postComment(userId: string, videoId: string, text: string) {
    const oauth2Client = await this.getOAuth2Client(userId);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const response = await youtube.commentThreads.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          videoId,
          topLevelComment: {
            snippet: {
              textOriginal: text,
            },
          },
        },
      },
    });

    return {
      commentId: response.data.id || '',
    };
  }
}
