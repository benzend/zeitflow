import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { queuedChainsTable } from '@/schema';
import { apiHandler, sendError } from '@/lib/api-handler';
import { validationError, notFoundError } from '@/lib/errors';

export default apiHandler({
  POST: async (req, res) => {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return sendError(res, validationError('Invalid chain ID'));
    }

    const queuedChain = await db.select().from(queuedChainsTable).where(eq(queuedChainsTable.id, parseInt(id)));

    if (!queuedChain.length) {
      return sendError(res, notFoundError('Queued chain', { id }));
    }

    await db
      .update(queuedChainsTable)
      .set({
        status: 'processing',
        updatedAt: new Date(),
      })
      .where(eq(queuedChainsTable.id, parseInt(id)));

    fetch(
      `${process.env.HOST}/api/process-queued-chain?id=${id}`,
      { method: 'POST' }
    );

    return res.status(200).json({ success: true });
  },
});
