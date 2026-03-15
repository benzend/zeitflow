import { NextApiRequest, NextApiResponse } from 'next';
import { WebClient } from '@slack/web-api';
import { db } from '@/lib/db';
import { slackBotsTable, usersTable } from '@/schema';
import { eq } from 'drizzle-orm';
import { encrypt } from '@/lib/encryption';

interface SlackOAuthResponse {
  bot_token: string;
  bot_user_id: string;
  team: {
    id: string;
    name: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).json({ error: `Slack OAuth error: ${error}` });
  }

  if (!code || !state) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Verify and decode state
    const decodedState = JSON.parse(Buffer.from(state as string, 'base64').toString());
    
    // Check timestamp (state expires after 10 minutes)
    if (Date.now() - decodedState.timestamp > 10 * 60 * 1000) {
      return res.status(400).json({ error: 'State expired' });
    }

    // Validate that the user exists
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, decodedState.userId))
      .limit(1);

    if (!user) {
      return res.status(400).json({ error: 'Invalid user' });
    }

    // Exchange code for access token
    const oauthResult = await new WebClient().oauth.v2.access({
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      code: code as string,
      redirect_uri: decodedState.redirectUri,
    });

    // Type assert the response for type safety
    const slackResponse = oauthResult as unknown as SlackOAuthResponse;

    // Store bot information
    await db.insert(slackBotsTable).values({
      userId: decodedState.userId,
      name: 'ZeitFlow Bot',
      botToken: encrypt(slackResponse.bot_token)!,
      teamId: slackResponse.team.id,
      teamName: slackResponse.team.name,
      botUserId: slackResponse.bot_user_id,
      isActive: true,
    });

    // Redirect to success page
    res.redirect('/settings?slack=success');
  } catch (error) {
    console.error('Slack OAuth callback error:', error);
    res.redirect('/settings?slack=error');
  }
}