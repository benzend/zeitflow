import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { db } from '@/lib/db';
import { subscriptionsTable, usersTable } from '@/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get user from database
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, session.user.email))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's subscription
    const subscription = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, user[0].id))
      .limit(1);

    if (subscription.length === 0) {
      return res.json({
        hasSubscription: false,
        tier: 'FREE',
        queueLimit: 20,
      });
    }

    const sub = subscription[0];
    const isActive = sub.status === 'active';

    // Determine tier based on price ID (you'll need to map your actual Stripe price IDs)
    let tier = 'FREE';
    let queueLimit = 20;

    // You'll need to update these with your actual Stripe price IDs
    switch (sub.priceId) {
      case process.env.STRIPE_PRO_PRICE_ID:
        tier = 'PRO';
        queueLimit = 100;
        break;
      case process.env.STRIPE_UNLIMITED_PRICE_ID:
        tier = 'UNLIMITED';
        queueLimit = 1000;
        break;
      default:
        tier = 'FREE';
        queueLimit = 20;
    }

    res.json({
      hasSubscription: isActive,
      tier,
      queueLimit,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: Boolean(sub.cancelAtPeriodEnd),
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
}