import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { isRateLimited } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { assetsTable, usersTable } from '@/schema';
import { eq, desc, like, or } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  // Get client IP for rate limiting
  const ip = req.headers['x-forwarded-for'] || 
             req.socket.remoteAddress || 
             'unknown-ip';
  
  const clientIp = Array.isArray(ip) ? ip[0] : ip;

  // Check rate limiting
  if (await isRateLimited({
    key: `asset-list:${clientIp}`,
    windowMs: 60 * 1000,
    maxRequests: 30
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
    const {
      page = '1',
      limit = '20',
      search,
      tags,
      mimeType,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions
    const whereConditions = [];

    if (search) {
      whereConditions.push(
        or(
          like(assetsTable.originalName, `%${search}%`),
          like(assetsTable.altText, `%${search}%`),
          like(assetsTable.description, `%${search}%`)
        )
      );
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      console.log(`[ASSETS-API] Adding tags condition for: ${tagArray.join(', ')}`);
      for (const tag of tagArray) {
        whereConditions.push(like(assetsTable.tags, `%"${tag}"%`));
      }
    }

    if (mimeType) {
      console.log(`[ASSETS-API] Adding mimeType condition for: ${mimeType}`);
      whereConditions.push(eq(assetsTable.mimeType, mimeType as string));
    }

    console.log(`[ASSETS-API] Total where conditions: ${whereConditions.length}`);

    // Query assets with pagination
    console.log(`[ASSETS-API] Executing database queries with offset=${offset}, limit=${limitNum}`);
    const dbQueryStart = Date.now();
    const [assets, totalCount] = await Promise.all([
      db
        .select({
          id: assetsTable.id,
          filename: assetsTable.filename,
          originalName: assetsTable.originalName,
          mimeType: assetsTable.mimeType,
          size: assetsTable.size,
          url: assetsTable.url,
          altText: assetsTable.altText,
          description: assetsTable.description,
          tags: assetsTable.tags,
          createdAt: assetsTable.createdAt,
          updatedAt: assetsTable.updatedAt,
          uploadedBy: {
            name: usersTable.name,
            email: usersTable.email,
          },
        })
        .from(assetsTable)
        .leftJoin(usersTable, eq(assetsTable.uploadedBy, usersTable.id))
        .where(whereConditions.length > 0 ? sql`${whereConditions.join(' AND ')}` : undefined)
        .orderBy(desc(assetsTable.createdAt))
        .limit(limitNum)
        .offset(offset),

      db
        .select({ count: assetsTable.id })
        .from(assetsTable)
        .where(whereConditions.length > 0 ? sql`${whereConditions.join(' AND ')}` : undefined)
    ]);

    const dbQueryTime = Date.now() - dbQueryStart;
    console.log(`[ASSETS-API] Database queries completed in ${dbQueryTime}ms`);
    console.log(`[ASSETS-API] Found ${assets.length} assets, total count: ${totalCount[0].count}`);

    // Parse tags for each asset
    console.log(`[ASSETS-API] Parsing tags for ${assets.length} assets`);
    const assetsWithParsedTags = assets.map((asset, index) => {
      try {
        return {
          ...asset,
          tags: asset.tags ? JSON.parse(asset.tags) : [],
        };
      } catch (error) {
        console.error(`[ASSETS-API] Error parsing tags for asset ${asset.id}:`, error);
        return {
          ...asset,
          tags: [],
        };
      }
    });
    console.log(`[ASSETS-API] Tag parsing completed`);

    const totalPages = Math.ceil(totalCount[0].count / limitNum);
    const totalTime = Date.now() - startTime;

    console.log(`[ASSETS-API] Successfully completed request in ${totalTime}ms`);
    console.log(`[ASSETS-API] Returning page ${pageNum}/${totalPages} with ${assetsWithParsedTags.length} assets`);

    return res.status(200).json({
      success: true,
      data: {
        assets: assetsWithParsedTags,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount[0].count,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[ASSETS-API] Error after ${totalTime}ms:`, error);
    console.error(`[ASSETS-API] User: ${session?.user?.email || 'unknown'}`);
    console.error(`[ASSETS-API] Query params:`, req.query);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
