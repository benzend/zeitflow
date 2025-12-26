import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { blogPostsTable, usersTable } from '@/schema';
import { eq, and } from 'drizzle-orm';

type ResponseData = {
  success: boolean;
  message: string;
  post?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' });
  }

  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res
      .status(400)
      .json({ success: false, message: 'Slug is required' });
  }

  try {
    // Fetch the blog post with author information
    const [post] = await db
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
      .where(and(eq(blogPostsTable.slug, slug), eq(blogPostsTable.published, true)))
      .limit(1);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: 'Post not found' });
    }

    // Transform the post data to match the expected format
    const transformedPost = {
      ...post,
      author: {
        name: post.authorName || undefined,
        email: post.authorEmail || '',
      },
    };

    // Remove the temporary fields
    delete (transformedPost as any).authorName;
    delete (transformedPost as any).authorEmail;

    return res.status(200).json({
      success: true,
      message: 'Post retrieved successfully',
      post: transformedPost,
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
}