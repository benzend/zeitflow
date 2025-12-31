import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { isRateLimited } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { assetsTable, usersTable } from '@/schema';
import { eq } from 'drizzle-orm';
import { put } from '@vercel/blob';
import imageSize from 'image-size';
import sharp from 'sharp';

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
    const assetsWithDefaultDimensions = []; // Track assets that got default dimensions

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
      const extension = file.name.split('.').pop() || '';
      const filename = `${timestamp}_${randomString}.${extension}`;

      // Convert base64 to buffer
      const base64Data = file.data.replace(/^data:.*?;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Upload to Vercel Blob
      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: file.type,
      });

      // Extract image dimensions for image files
      let width = null;
      let height = null;
      let blurDataURL = null;

      if (file.type.startsWith('image/')) {
        try {
          // Get image dimensions
          const dimensions = imageSize(buffer);
          width = dimensions.width;
          height = dimensions.height;

          // Generate blur placeholder for Next.js Image
          const blurBuffer = await sharp(buffer)
            .resize(20, 20, { fit: 'inside', withoutEnlargement: true })
            .blur(10)
            .png({ quality: 80, compressionLevel: 9 })
            .toBuffer();
          
          blurDataURL = `data:image/png;base64,${blurBuffer.toString('base64')}`;
        } catch (error) {
          console.warn('Failed to process image dimensions:', error);
          // Set default dimensions for failed processing
          width = 800;
          height = 600;
          // Track this asset for notification
          assetsWithDefaultDimensions.push(filename);
          console.info('Using default dimensions (800x600) due to processing failure');
        }
      }

      // Use blob URL
      const assetUrl = blob.url;

      // Save asset to database
      const [newAsset] = await db.insert(assetsTable).values({
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: buffer.length,
        width,
        height,
        blurDataURL,
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

    let message = `${uploadedAssets.length} file(s) uploaded successfully`;
    if (assetsWithDefaultDimensions.length > 0) {
      message += `. Default dimensions (800x600) applied to ${assetsWithDefaultDimensions.length} file(s) due to processing issues.`;
    }

    return res.status(201).json({ 
      success: true, 
      message,
      data: uploadedAssets,
      warnings: assetsWithDefaultDimensions.length > 0 ? [
        `Default dimensions applied to: ${assetsWithDefaultDimensions.join(', ')}`
      ] : undefined
    });

  } catch (error) {
    console.error('Asset upload error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
