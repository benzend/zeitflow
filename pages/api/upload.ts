import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { isRateLimited } from '@/lib/rate-limit';
import { authOptions } from './auth/[...nextauth]';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Check rate limiting
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  if (await isRateLimited({
    key: `${clientIp}:upload`,
    windowMs: 60000, // 1 minute
    maxRequests: 10, // 10 uploads per minute
  })) {
    return res.status(429).json({ success: false, message: 'Too many upload attempts. Please try again later.' });
  }

  try {
    const form = formidable({
      maxFileSize: MAX_FILE_SIZE,
      filter: (part) => {
        return part.mimetype ? ALLOWED_FILE_TYPES.includes(part.mimetype) : false;
      },
    });

    const [, files] = await form.parse(req);

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Validate file type
    if (!file.mimetype || !ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = path.extname(file.originalFilename || '');
    const fileName = `${timestamp}_${randomString}${fileExtension}`;

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save file
    const filePath = path.join(uploadsDir, fileName);
    fs.copyFileSync(file.filepath, filePath);

    // Clean up temporary file
    fs.unlinkSync(file.filepath);

    // Return the public URL
    const publicUrl = `/uploads/${fileName}`;

    res.status(200).json({ 
      success: true, 
      message: 'File uploaded successfully',
      url: publicUrl
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
}