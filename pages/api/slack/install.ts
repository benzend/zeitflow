import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

const SLACK_SCOPES = [
  'chat:write',
  'channels:read', 
  'users:read'
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const origin = process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_APP_URL 
    : 'http://localhost:3000';
  
  const redirectUri = `${origin}/api/slack/callback`;
  
  // Generate state with user ID for security
  const state = Buffer.from(JSON.stringify({
    userId: session.user?.email || '',
    redirectUri,
    timestamp: Date.now()
  })).toString('base64');

  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!,
    scope: SLACK_SCOPES.join(','),
    redirect_uri: redirectUri,
    state,
  });

  const authUrl = `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  
  res.json({ authUrl });
}