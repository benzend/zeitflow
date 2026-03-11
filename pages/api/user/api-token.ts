import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { db } from '@/lib/db';
import { usersTable } from '@/schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt, hashValue } from '@/lib/encryption';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, session.user.email))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = user[0];

    if (req.method === 'GET') {
      // Get current API token (decrypt for display)
      return res.status(200).json({
        success: true,
        apiToken: decrypt(currentUser.apiToken),
        hasApiToken: !!currentUser.apiToken
      });

    } else if (req.method === 'POST') {
      // Generate new API token (encrypt before storage)
      const newApiToken = crypto.randomUUID();

      await db
        .update(usersTable)
        .set({
          apiToken: encrypt(newApiToken),
          apiTokenHash: hashValue(newApiToken),
        })
        .where(eq(usersTable.id, currentUser.id));

      return res.status(200).json({
        success: true,
        apiToken: newApiToken,
        message: 'New API token generated successfully'
      });
    }
  } catch (error) {
    console.error('API token management error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}