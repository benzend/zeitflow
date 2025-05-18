import { db } from './db';
import { rateLimitsTable } from '@/schema';
import { eq, lt } from 'drizzle-orm';

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
