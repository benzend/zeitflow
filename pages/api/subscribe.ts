import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { subscribersTable } from '@/schema';
import { eq } from 'drizzle-orm';

type ResponseData = {
  success: boolean;
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid email address' });
  }

  try {
    // Check if email already exists
    const existingSubscriber = await db
      .select()
      .from(subscribersTable)
      .where(eq(subscribersTable.email, email))
      .limit(1);

    if (existingSubscriber.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Email already subscribed' });
    }

    // Add new subscriber
    await db.insert(subscribersTable).values({ email });

    return res
      .status(200)
      .json({ success: true, message: 'Successfully subscribed!' });
  } catch (error) {
    console.error('Subscription error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to subscribe' });
  }
}
