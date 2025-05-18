import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { subscribersTable } from '@/schema';
import { eq } from 'drizzle-orm';
import { isRateLimited } from '@/lib/rate-limit';

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

  // Get client IP for rate limiting
  const ip = req.headers['x-forwarded-for'] || 
             req.socket.remoteAddress || 
             'unknown-ip';
  
  const clientIp = Array.isArray(ip) ? ip[0] : ip;
  
  // Check rate limit (5 requests per IP address per hour)
  const isLimited = await isRateLimited({
    key: `subscribe:${clientIp}`,
    windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
    maxRequests: 5
  });

  if (isLimited) {
    return res
      .status(429)
      .json({ success: false, message: 'Too many requests. Please try again later.' });
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
