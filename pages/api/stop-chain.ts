import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { queuedChainsTable } from '@/schema';
import { apiHandler, sendError } from '@/lib/api-handler';
import { validationError } from '@/lib/errors';

export default apiHandler({
  POST: async (req, res) => {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return sendError(res, validationError('Invalid chain ID'));
    }

    await db
      .update(queuedChainsTable)
      .set({
        status: 'stopped',
        updatedAt: new Date(),
      })
      .where(eq(queuedChainsTable.id, parseInt(id)));

    return res.status(200).json({ success: true });
  },
});
