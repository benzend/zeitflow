import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { CalendarService } from '@/lib/calendar';

interface CreateMeetingRequest {
  title: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  description?: string;
}

export default async function handler(
  req: NextApiRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res: NextApiResponse<Record<string, any> | { error: string }>
) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ error: 'Unauthorized' });

  // Get user from database
  const { db } = await import('@/lib/db');
  const { usersTable } = await import('@/schema');
  const { eq } = await import('drizzle-orm');
  const user = await db.select().from(usersTable).where(eq(usersTable.email, session.user.email)).limit(1);
  if (user.length === 0) return res.status(401).json({ error: 'User not found' });
  const userId = user[0].id;

  const body: CreateMeetingRequest = req.body;
  const { title, startTime, endTime, attendees, description } = body;

  try {
    const event = await CalendarService.createMeeting(
      userId,
      title,
      new Date(startTime),
      new Date(endTime),
      attendees || [],
      description
    );
    res.status(200).json(event);
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
}