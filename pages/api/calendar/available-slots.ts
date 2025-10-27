import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { CalendarService } from '@/lib/calendar';

interface AvailableSlotsResponse {
  start: Date;
  end: Date;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AvailableSlotsResponse[] | { error: string }>
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ error: 'Unauthorized' });

  // Get user from database
  const { db } = await import('@/lib/db');
  const { usersTable } = await import('@/schema');
  const { eq } = await import('drizzle-orm');
  const user = await db.select().from(usersTable).where(eq(usersTable.email, session.user.email)).limit(1);
  if (user.length === 0) return res.status(401).json({ error: 'User not found' });
  const userId = user[0].id;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { attendees, duration, preferredStart, preferredEnd } = req.query;

  try {
    const attendeesArray = Array.isArray(attendees) ? attendees : attendees ? attendees.split(',') : [];
    const durationValue = Array.isArray(duration) ? duration[0] : duration || '60';
    const preferredStartValue = Array.isArray(preferredStart) ? preferredStart[0] : preferredStart;
    const preferredEndValue = Array.isArray(preferredEnd) ? preferredEnd[0] : preferredEnd;

    const slots = await CalendarService.findAvailableSlots(
      userId,
      attendeesArray,
      parseInt(durationValue),
      preferredStartValue ? new Date(preferredStartValue) : undefined,
      preferredEndValue ? new Date(preferredEndValue) : undefined
    );
    res.status(200).json(slots);
  } catch (error) {
    console.error('Error finding available slots:', error);
    res.status(500).json({ error: 'Failed to find available slots' });
  }
}