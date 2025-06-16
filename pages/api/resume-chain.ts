import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { queuedChainsTable } from '@/schema';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' });
  }

  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid chain ID' });
  }

  try {
    const queuedChain = await db.select().from(queuedChainsTable).where(eq(queuedChainsTable.id, parseInt(id)))
    
    if (!queuedChain.length) {
      return res
        .status(404)
        .json({ success: false, message: `Chain ID of (${id}) not found`})
    }
    // Update the queued chain status to 'stopped'
    await db
      .update(queuedChainsTable)
      .set({
        status: 'processing',
        updatedAt: new Date(),
      })
      .where(eq(queuedChainsTable.id, parseInt(id)));


    fetch(
      `${process.env.HOST}/api/process-queued-chain?id=${id}`,
      {
        method: 'POST',
      }
    );
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error stopping chain:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to stop chain',
    });
  }
}
