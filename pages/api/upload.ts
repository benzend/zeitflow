import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { isRateLimited } from '@/lib/rate-limit';
import { authOptions } from './auth/[...nextauth]';
import { put } from '@vercel/blob';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { sendError } from '@/lib/api-handler';
import {
  authenticationError,
  rateLimitError,
  validationError,
  internalError,
} from '@/lib/errors';

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return sendError(res, { category: 'VALIDATION', message: 'Method not allowed', statusCode: 405, code: 'METHOD_NOT_ALLOWED' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return sendError(res, authenticationError());
  }

  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  if (await isRateLimited({ key: `${clientIp}:upload`, windowMs: 60000, maxRequests: 10 })) {
    return sendError(res, rateLimitError('Too many upload attempts. Please try again later.'));
  }

  try {
    const form = formidable({
      maxFileSize: MAX_FILE_SIZE,
      filter: (part) => part.mimetype ? ALLOWED_FILE_TYPES.includes(part.mimetype) : false,
    });

    const [, files] = await form.parse(req);
    const file = files.file?.[0];

    if (!file) {
      return sendError(res, validationError('No file uploaded'));
    }

    if (!file.mimetype || !ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      return sendError(res, validationError('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = path.extname(file.originalFilename || '');
    const fileName = `blog-${timestamp}_${randomString}${fileExtension}`;

    const fileData = fs.readFileSync(file.filepath);

    const blob = await put(fileName, fileData, {
      access: 'public',
      contentType: file.mimetype || 'image/jpeg',
    });

    fs.unlinkSync(file.filepath);

    res.status(200).json({ success: true, message: 'File uploaded successfully', url: blob.url });
  } catch (error) {
    console.error('Upload error:', error);
    return sendError(res, internalError('Upload failed'));
  }
}
