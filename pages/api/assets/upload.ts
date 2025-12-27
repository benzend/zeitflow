import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { isRateLimited } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { assetsTable, usersTable } from '@/schema';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Adjust file size limit as needed
    },
  },
};

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
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
      message: 'Too many upload attempts. Please try again later.' 
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
    const { files } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No files provided' 
      });
    }

    // Look up user ID from email
    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, session.user.email))
      .limit(1);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const uploadedAssets = [];
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure uploads directory exists
    await mkdir(uploadDir, { recursive: true });

    for (const file of files) {
      // Validate file data
      if (!file.data || !file.name || !file.type) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid file data' 
        });
      }

      // Validate mime type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return res.status(400).json({ 
          success: false, 
          message: `File type ${file.type} is not allowed` 
        });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const extension = path.extname(file.name);
      const filename = `${timestamp}_${randomString}${extension}`;
      const filePath = path.join(uploadDir, filename);

      // Convert base64 to buffer and save file
      const base64Data = file.data.replace(/^data:.*?;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      await writeFile(filePath, buffer);

      // Create asset URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.HOST || 'http://localhost:3000';
      const assetUrl = `${baseUrl}/uploads/${filename}`;

      // Save asset to database
      const [newAsset] = await db.insert(assetsTable).values({
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: buffer.length,
        url: assetUrl,
        altText: file.altText || '',
        description: file.description || '',
        tags: file.tags && file.tags.length > 0 ? JSON.stringify(file.tags) : null,
        uploadedBy: user.id, // Using email as foreign key (matches schema)
      }).returning();

      uploadedAssets.push({
        ...newAsset,
        tags: newAsset.tags ? JSON.parse(newAsset.tags) : [],
      });
    }

    return res.status(201).json({ 
      success: true, 
      message: `${uploadedAssets.length} file(s) uploaded successfully`,
      data: uploadedAssets 
    });

  } catch (error) {
    console.error('Asset upload error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
