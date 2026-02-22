import { db } from '@/lib/db';
import { subscribersTable } from '@/schema';
import { eq } from 'drizzle-orm';
import { apiHandler, sendError } from '@/lib/api-handler';
import { validationError } from '@/lib/errors';

export default apiHandler({
  public: true,
  rateLimitKey: 'subscribe',
  rateLimitMax: 5,

  POST: async (req, res) => {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return sendError(res, validationError('Invalid email address'));
    }

    const existingSubscriber = await db
      .select()
      .from(subscribersTable)
      .where(eq(subscribersTable.email, email))
      .limit(1);

    if (existingSubscriber.length > 0) {
      return sendError(res, validationError('Email already subscribed'));
    }

    await db.insert(subscribersTable).values({ email });

    return res.status(200).json({ success: true, message: 'Successfully subscribed!' });
  },
});
