import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { db } from '@/lib/db';
import { usersTable } from '@/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { name } = req.body;
  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (name.trim().length > 100) {
    return res.status(400).json({ error: 'Name must be 100 characters or less' });
  }

  try {
    await db
      .update(usersTable)
      .set({ name: name.trim() })
      .where(eq(usersTable.email, session.user.email));

    return res.status(200).json({ name: name.trim() });
  } catch (error) {
    console.error('Error updating user name:', error);
    return res.status(500).json({ error: 'Failed to update name' });
  }
}
