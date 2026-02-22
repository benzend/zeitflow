import { db } from '@/lib/db';
import { queuedChainsTable } from '@/schema';
import { eq } from 'drizzle-orm';
import { apiHandler, sendError } from '@/lib/api-handler';
import { validationError } from '@/lib/errors';

export default apiHandler({
  rateLimitKey: 'process_chain',
  rateLimitMax: 20,

  DELETE: async (req, res) => {
    const queuedChainId = req.query.id ? parseInt(req.query.id as string, 10) : null;

    if (!queuedChainId) {
      return sendError(res, validationError('Queued chain ID is required'));
    }

    await db.delete(queuedChainsTable)
      .where(eq(queuedChainsTable.id, queuedChainId));

    return res.status(200).json({ success: true, message: 'Successfully deleted queued chain!' });
  },
});
