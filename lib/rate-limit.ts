import { db } from './db';
import { rateLimitsTable, subscriptionsTable, usersTable } from '@/schema';
import { eq, lt } from 'drizzle-orm';
import { SUBSCRIPTION_PLANS } from './stripe';

interface RateLimitOptions {
  key: string;
  windowMs: number;
  maxRequests: number;
}

export async function isRateLimited({
  key,
  windowMs,
  maxRequests,
}: RateLimitOptions): Promise<boolean> {
  const now = new Date();

  // Clean up expired rate limits
  await db
    .delete(rateLimitsTable)
    .where(lt(rateLimitsTable.expiresAt, now));

  // Check if the key exists and is within the time window
  const existingLimit = await db
    .select()
    .from(rateLimitsTable)
    .where(eq(rateLimitsTable.key, key))
    .limit(1);

  if (existingLimit.length === 0) {
    // First request, create a new rate limit entry
    const expiresAt = new Date(now.getTime() + windowMs);
    await db.insert(rateLimitsTable).values({
      key,
      count: 1,
      expiresAt,
    });
    return false; // Not rate limited
  }

  const limit = existingLimit[0];

  // If the existing limit has expired, reset it
  if (limit.expiresAt < now) {
    const expiresAt = new Date(now.getTime() + windowMs);
    await db
      .update(rateLimitsTable)
      .set({
        count: 1,
        expiresAt,
      })
      .where(eq(rateLimitsTable.key, key));
    return false; // Not rate limited
  }

  // Check if the request count exceeds the maximum allowed
  if (limit.count >= maxRequests) {
    return true; // Rate limited
  }

  // Increment the request count
  await db
    .update(rateLimitsTable)
    .set({
      count: limit.count + 1,
    })
    .where(eq(rateLimitsTable.key, key));

  return false; // Not rate limited
}

// Enhanced rate limiting with subscription support
export async function isRateLimitedWithSubscription(
  userEmail: string,
  key: string,
  windowMs: number = 3600000 // 1 hour default
): Promise<{ isLimited: boolean; tier: string; limit: number; remaining: number }> {
  // Get user and their subscription
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, userEmail))
    .limit(1);

  if (user.length === 0) {
    return { isLimited: true, tier: 'FREE', limit: 0, remaining: 0 };
  }

  // Get user's subscription
  const subscription = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, user[0].id))
    .limit(1);

  // Determine rate limit based on subscription
  let maxRequests = SUBSCRIPTION_PLANS.FREE.queueLimit;
  let tier = 'FREE';

  if (subscription.length > 0 && subscription[0].status === 'active') {
    // Check subscription tier based on price ID
    switch (subscription[0].priceId) {
      case process.env.STRIPE_PRO_PRICE_ID:
        maxRequests = SUBSCRIPTION_PLANS.PRO.queueLimit;
        tier = 'PRO';
        break;
      case process.env.STRIPE_UNLIMITED_PRICE_ID:
        maxRequests = SUBSCRIPTION_PLANS.UNLIMITED.queueLimit;
        tier = 'UNLIMITED';
        break;
      default:
        maxRequests = SUBSCRIPTION_PLANS.FREE.queueLimit;
        tier = 'FREE';
    }
  }

  // Check rate limit
  const now = new Date();
  
  // Clean up expired rate limits
  await db
    .delete(rateLimitsTable)
    .where(lt(rateLimitsTable.expiresAt, now));

  // Check if the key exists and is within the time window
  const existingLimit = await db
    .select()
    .from(rateLimitsTable)
    .where(eq(rateLimitsTable.key, key))
    .limit(1);

  if (existingLimit.length === 0) {
    // First request, create a new rate limit entry
    const expiresAt = new Date(now.getTime() + windowMs);
    await db.insert(rateLimitsTable).values({
      key,
      count: 1,
      expiresAt,
    });
    return { 
      isLimited: false, 
      tier, 
      limit: maxRequests, 
      remaining: maxRequests - 1 
    };
  }

  const limit = existingLimit[0];

  // If the existing limit has expired, reset it
  if (limit.expiresAt < now) {
    const expiresAt = new Date(now.getTime() + windowMs);
    await db
      .update(rateLimitsTable)
      .set({
        count: 1,
        expiresAt,
      })
      .where(eq(rateLimitsTable.key, key));
    return { 
      isLimited: false, 
      tier, 
      limit: maxRequests, 
      remaining: maxRequests - 1 
    };
  }

  // Check if the request count exceeds the maximum allowed
  if (limit.count >= maxRequests) {
    return { 
      isLimited: true, 
      tier, 
      limit: maxRequests, 
      remaining: 0 
    };
  }

  // Increment the request count
  await db
    .update(rateLimitsTable)
    .set({
      count: limit.count + 1,
    })
    .where(eq(rateLimitsTable.key, key));

  return { 
    isLimited: false, 
    tier, 
    limit: maxRequests, 
    remaining: maxRequests - limit.count - 1 
  };
}
