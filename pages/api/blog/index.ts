import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { db } from '@/lib/db';
import { blogPostsTable, usersTable, SelectBlogPost } from '@/schema';
import { isRateLimited } from '@/lib/rate-limit';
import { isAdmin } from '@/lib/admin';
import { eq, desc, and, like } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for blog post creation/update
const blogPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  published: z.boolean().optional(),
  featuredImage: z.string().optional(),
  tags: z.string().optional(),
});

type ResponseData = {
  success: boolean;
  message: string;
  post?: SelectBlogPost;
  posts?: any[];
  total?: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (!req.method || !['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' });
  }

  // Get client IP for rate limiting
  const ip = req.headers['x-forwarded-for'] ||
    req.socket.remoteAddress ||
    'unknown-ip';

  // Apply rate limiting
  const clientIp = Array.isArray(ip) ? ip[0] : ip;
  const isLimited = await isRateLimited({
    key: `blog:${req.method?.toLowerCase()}:${clientIp}`,
    windowMs: req.method === 'GET' ? 60 * 1000 : 60 * 60 * 1000,
    maxRequests: 1000
  });

  if (isLimited) {
    return res
      .status(429)
      .json({ success: false, message: 'Too many requests' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        return res
          .status(405)
          .json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Blog API error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { 
    id,
    page = 1, 
    limit = 12, 
    published = 'true', 
    search, 
    tag 
  } = req.query;
  
  // If id is provided, fetch single post
  if (id && typeof id === 'string') {
    const posts = await db
      .select({
        id: blogPostsTable.id,
        slug: blogPostsTable.slug,
        title: blogPostsTable.title,
        excerpt: blogPostsTable.excerpt,
        content: blogPostsTable.content,
        published: blogPostsTable.published,
        featuredImage: blogPostsTable.featuredImage,
        tags: blogPostsTable.tags,
        publishedAt: blogPostsTable.publishedAt,
        createdAt: blogPostsTable.createdAt,
        updatedAt: blogPostsTable.updatedAt,
        authorId: blogPostsTable.authorId,
        authorName: usersTable.name,
        authorEmail: usersTable.email,
      })
      .from(blogPostsTable)
      .leftJoin(usersTable, eq(blogPostsTable.authorId, usersTable.id))
      .where(eq(blogPostsTable.id, Number(id)))
      .limit(1);

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const post = posts[0];
    const transformedPost = {
      ...post,
      author: {
        name: post.authorName || undefined,
        email: post.authorEmail,
      },
      // Convert Date objects to ISO strings for serialization
      createdAt: post.createdAt?.toISOString(),
      updatedAt: post.updatedAt?.toISOString(),
      publishedAt: post.publishedAt?.toISOString() || null,
    } as any;

    return res.status(200).json({
      success: true,
      message: 'Post retrieved successfully',
      post: transformedPost,
    });
  }
  
  // Otherwise, fetch list of posts
  const offset = (Number(page) - 1) * Number(limit);
  const publishedFilter = published === 'true' ? true : false;
  
  // Build query conditions
  const whereConditions = [];
  if (published !== undefined && published !== null && published !== '') {
    whereConditions.push(eq(blogPostsTable.published, publishedFilter));
  }
  
  if (search && typeof search === 'string') {
    whereConditions.push(
      like(blogPostsTable.title, `%${search}%`)
    );
  }
  
  if (tag && typeof tag === 'string') {
    whereConditions.push(
      like(blogPostsTable.tags, `%"${tag}"%`)
    );
  }
  
  // Fetch posts with author information
  const posts = await db
    .select({
      id: blogPostsTable.id,
      slug: blogPostsTable.slug,
      title: blogPostsTable.title,
      excerpt: blogPostsTable.excerpt,
      content: blogPostsTable.content,
      published: blogPostsTable.published,
      featuredImage: blogPostsTable.featuredImage,
      tags: blogPostsTable.tags,
      publishedAt: blogPostsTable.publishedAt,
      createdAt: blogPostsTable.createdAt,
      updatedAt: blogPostsTable.updatedAt,
      authorId: blogPostsTable.authorId,
      authorName: usersTable.name,
      authorEmail: usersTable.email,
    })
    .from(blogPostsTable)
    .leftJoin(usersTable, eq(blogPostsTable.authorId, usersTable.id))
    .where(and(...whereConditions))
    .orderBy(desc(blogPostsTable.publishedAt || blogPostsTable.createdAt))
    .limit(Number(limit))
    .offset(offset);

  // Transform the data to match the expected format
  const transformedPosts = posts.map(post => ({
    ...post,
    author: {
      name: post.authorName || undefined,
      email: post.authorEmail,
    },
  }));
  
  // Get total count
  const totalCountResult = await db
    .select({ count: blogPostsTable.id })
    .from(blogPostsTable)
    .where(and(...whereConditions));
  
  const total = totalCountResult.length;
  
  return res.status(200).json({
    success: true,
    message: 'Posts retrieved successfully',
    posts: transformedPosts,
    total,
  });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  // Check authentication for creating posts
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res
      .status(401)
      .json({ success: false, message: 'Unauthorized' });
  }

  // Check if user is admin
  if (!isAdmin(session.user.email)) {
    return res
      .status(403)
      .json({ success: false, message: 'Admin access required' });
  }

  // Validate request body
  const validationResult = blogPostSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid input data' });
  }

  const { title, excerpt, content, published, featuredImage, tags } = validationResult.data;

  // Get user from database
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, session.user.email));

  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: 'User not found' });
  }

  // Use provided slug or generate one from title
  let slug: string;
  if (validationResult.data.slug && validationResult.data.slug.trim()) {
    slug = validationResult.data.slug.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  } else {
    // Generate slug from title
    slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();
  }

  // Check if slug already exists and make it unique if needed
  const existingPost = await db
    .select({ id: blogPostsTable.id })
    .from(blogPostsTable)
    .where(eq(blogPostsTable.slug, slug))
    .limit(1);

  if (existingPost.length > 0) {
    slug = slug + '-' + Date.now();
  }

  // Create blog post
  const insertData: any = {
    slug,
    title,
    excerpt,
    content,
    published,
    featuredImage,
    tags,
    authorId: user.id,
    publishedAt: published ? new Date() : null,
  };

  const [newPost] = await db
    .insert(blogPostsTable)
    .values(insertData)
    .returning();

  return res.status(201).json({
    success: true,
    message: 'Post created successfully',
    post: newPost,
  });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res
      .status(401)
      .json({ success: false, message: 'Unauthorized' });
  }

  // Check if user is admin
  if (!isAdmin(session.user.email)) {
    return res
      .status(403)
      .json({ success: false, message: 'Admin access required' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res
      .status(400)
      .json({ success: false, message: 'Post ID is required' });
  }

  // Validate request body
  const validationResult = blogPostSchema.partial().safeParse(req.body);
  if (!validationResult.success) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid input data' });
  }

  // Check if post exists and user has permission
  const [existingPost] = await db
    .select()
    .from(blogPostsTable)
    .where(eq(blogPostsTable.id, Number(id)));

  if (!existingPost) {
    return res
      .status(404)
      .json({ success: false, message: 'Post not found' });
  }

  // Get user from database
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, session.user.email));

  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: 'User not found' });
  }

  const updateData: any = validationResult.data;
  if (updateData.published && !existingPost.published) {
    updateData.publishedAt = new Date();
  }

  // Handle slug update
  if (updateData.slug && updateData.slug !== existingPost.slug) {
    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(updateData.slug)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid slug format. Use only lowercase letters, numbers, and hyphens.' });
    }

    // Check if slug already exists (excluding current post)
    const [existingSlug] = await db
      .select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.slug, updateData.slug));

    if (existingSlug && existingSlug.id !== Number(id)) {
      return res
        .status(409)
        .json({ success: false, message: 'Slug already exists. Please choose a different slug.' });
    }
  }

  // Update blog post
  const [updatedPost] = await db
    .update(blogPostsTable)
    .set(updateData)
    .where(eq(blogPostsTable.id, Number(id)))
    .returning();

  return res.status(200).json({
    success: true,
    message: 'Post updated successfully',
    post: updatedPost,
  });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res
      .status(401)
      .json({ success: false, message: 'Unauthorized' });
  }

  // Check if user is admin
  if (!isAdmin(session.user.email)) {
    return res
      .status(403)
      .json({ success: false, message: 'Admin access required' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res
      .status(400)
      .json({ success: false, message: 'Post ID is required' });
  }

  // Check if post exists and user has permission
  const [existingPost] = await db
    .select()
    .from(blogPostsTable)
    .where(eq(blogPostsTable.id, Number(id)));

  if (!existingPost) {
    return res
      .status(404)
      .json({ success: false, message: 'Post not found' });
  }

  // Get user from database
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, session.user.email));

  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: 'User not found' });
  }

  // Delete blog post
  await db
    .delete(blogPostsTable)
    .where(eq(blogPostsTable.id, Number(id)));

  return res.status(200).json({
    success: true,
    message: 'Post deleted successfully',
  });
}
