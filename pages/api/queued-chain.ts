import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { queuedChainsTable } from '@/schema';
import { isRateLimited } from '@/lib/rate-limit';
import { eq } from 'drizzle-orm';
import { config } from 'dotenv';

config({ path: '.env.local' });

type ResponseData = {
  success: boolean;
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'DELETE') {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' });
  }

  // Get client IP for rate limiting
  const ip = req.headers['x-forwarded-for'] ||
    req.socket.remoteAddress ||
    'unknown-ip';

  const clientIp = Array.isArray(ip) ? ip[0] : ip;

  // Check rate limit (20 requests per IP address per hour)
  const isLimited = await isRateLimited({
    key: `process_chain:${clientIp}`,
    windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
    maxRequests: 20
  });

  if (isLimited) {
    return res
      .status(429)
      .json({ success: false, message: 'Too many requests. Please try again later.' });
  }

  try {
    const queuedChainId = req.query.id ? parseInt(req.query.id as string, 10) : null;

    if (!queuedChainId) {
      return res.status(400)
        .json({ success: false, message: 'Queued chain ID is required' });
    }

    await db.delete(queuedChainsTable)
      .where(eq(queuedChainsTable.id, queuedChainId));

      return res.status(200)
        .json({ success: true, message: 'Successfully deleted queued chain!' });

  } catch (error) {
    console.error('Failed to delete queued chain:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to process request' });
  }
}

