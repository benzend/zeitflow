import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { db } from '@/lib/db';
import { slackBotsTable, usersTable } from '@/schema';
import { eq } from 'drizzle-orm';
import { sendSlackMessage } from '@/lib/slack';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { teamId } = req.body;

  if (!teamId) {
    return res.status(400).json({ error: 'Team ID required' });
  }

  try {
    // Get user from database
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, session.user.email))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get the Slack bot for this team
    const [bot] = await db
      .select()
      .from(slackBotsTable)
      .where(eq(slackBotsTable.teamId, teamId))
      .limit(1);

    if (!bot) {
      return res.status(404).json({ error: 'Slack bot not found' });
    }

    if (bot.userId !== user.id) {
      return res.status(403).json({ error: 'Unauthorized access to this bot' });
    }

    // Send a test message to the general channel (usually #general)
    const testResponse = await sendSlackMessage(user.id, '#general', '🧪 Test message from ZeitFlow - Slack integration is working correctly!');

    if ('error' in testResponse) {
      return res.status(500).json({ error: testResponse.error });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Slack test error:', error);
    res.status(500).json({ error: 'Failed to send test message' });
  }
}