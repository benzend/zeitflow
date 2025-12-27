import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { isRateLimited } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { assetsTable } from '@/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const assetId = parseInt(id as string);

  if (isNaN(assetId)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid asset ID' 
    });
  }

  // Get client IP for rate limiting
  const ip = req.headers['x-forwarded-for'] || 
             req.socket.remoteAddress || 
             'unknown-ip';
  
  const clientIp = Array.isArray(ip) ? ip[0] : ip;

  // Check rate limiting
  if (await isRateLimited({
    key: `asset-upload:${clientIp}`,
    windowMs: 60 * 1000,
    maxRequests: 10
  })) {
    return res.status(429).json({ 
      success: false, 
      message: 'Too many requests. Please try again later.' 
    });
  }

  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  try {
    if (req.method === 'GET') {
      // Get single asset
      const [asset] = await db
        .select()
        .from(assetsTable)
        .where(eq(assetsTable.id, assetId))
        .limit(1);

      if (!asset) {
        return res.status(404).json({ 
          success: false, 
          message: 'Asset not found' 
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          ...asset,
          tags: asset.tags ? JSON.parse(asset.tags) : [],
        },
      });

    } else if (req.method === 'PUT') {
      // Update asset metadata
      const { altText, description, tags } = req.body;

      const updateData: any = {};
      if (altText !== undefined) updateData.altText = altText;
      if (description !== undefined) updateData.description = description;
      if (tags !== undefined) updateData.tags = tags ? JSON.stringify(tags) : null;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'No valid fields to update' 
        });
      }

      const [updatedAsset] = await db
        .update(assetsTable)
        .set(updateData)
        .where(eq(assetsTable.id, assetId))
        .returning();

      if (!updatedAsset) {
        return res.status(404).json({ 
          success: false, 
          message: 'Asset not found' 
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Asset updated successfully',
        data: {
          ...updatedAsset,
          tags: updatedAsset.tags ? JSON.parse(updatedAsset.tags) : [],
        },
      });

    } else if (req.method === 'DELETE') {
      // Delete asset
      const [deletedAsset] = await db
        .delete(assetsTable)
        .where(eq(assetsTable.id, assetId))
        .returning();

      if (!deletedAsset) {
        return res.status(404).json({ 
          success: false, 
          message: 'Asset not found' 
        });
      }

      // Optionally delete the actual file from filesystem
      // This would require additional file system operations

      return res.status(200).json({
        success: true,
        message: 'Asset deleted successfully',
      });

    } else {
      return res.status(405).json({ 
        success: false, 
        message: 'Method not allowed' 
      });
    }

  } catch (error) {
    console.error('Asset operation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
