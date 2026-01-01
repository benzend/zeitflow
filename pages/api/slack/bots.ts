import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { db } from '@/lib/db';
import { slackBotsTable } from '@/schema';
import { eq, and } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user?.email || '';

  switch (req.method) {
    case 'GET':
      try {
        const bots = await db
          .select({
            id: slackBotsTable.id,
            name: slackBotsTable.name,
            teamName: slackBotsTable.teamName,
            teamId: slackBotsTable.teamId,
            isActive: slackBotsTable.isActive,
            createdAt: slackBotsTable.createdAt,
          })
          .from(slackBotsTable)
          .where(eq(slackBotsTable.userId, userId));

        res.json({ success: true, bots });
      } catch {
        res.status(500).json({ success: false, error: 'Failed to fetch bots' });
      }
      break;

    case 'DELETE':
      try {
        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ success: false, error: 'Bot ID required' });
        }

        await db
          .update(slackBotsTable)
          .set({ isActive: false })
          .where(and(
            eq(slackBotsTable.id, Number(id)),
            eq(slackBotsTable.userId, userId)
          ));

        res.json({ success: true });
      } catch {
        res.status(500).json({ success: false, error: 'Failed to delete bot' });
      }
      break;

    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}