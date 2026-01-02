// This API is no longer needed since preview page now handles authentication server-side
// Keeping this file for backwards compatibility but it's deprecated

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(410).json({ 
    success: false, 
    message: 'This endpoint is deprecated. Preview functionality is now handled server-side in the preview page.' 
  });
}

type ResponseData = {
  success: boolean;
  message: string;
  post?: TransformedPost;
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

  const { id, secret } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res
      .status(400)
      .json({ success: false, message: 'Post ID is required' });
  }

  // Check for preview secret or session authentication
  const session = await getServerSession(req, res, authOptions);
  const isValidSecret = secret && typeof secret === 'string' && secret === process.env.PREVIEW_SECRET;
  const isAuthenticated = session?.user?.email && GODMODE_EMAILS.includes(session.user.email);
  
  if (!isValidSecret && !isAuthenticated) {
    return res
      .status(401)
      .json({ success: false, message: 'Unauthorized' });
  }

  try {
    // Fetch post with author information, ignoring published status for preview
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
      .where(eq(blogPostsTable.id, Number(id)))
      .limit(1);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: 'Post not found' });
    }

    // Transform the data to match the expected format
    const transformedPost: TransformedPost = {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      published: post.published,
      featuredImage: post.featuredImage,
      tags: post.tags,
      authorId: post.authorId,
      publishedAt: post.publishedAt?.toISOString() || null,
      createdAt: post.createdAt?.toISOString() || '',
      updatedAt: post.updatedAt?.toISOString() || '',
      author: {
        name: post.authorName || undefined,
        email: post.authorEmail || '',
        isAdmin: GODMODE_EMAILS.includes(post.authorEmail || ''),
      },
    };
    
    return res.status(200).json({
      success: true,
      message: 'Post retrieved successfully for preview',
      post: transformedPost,
    });

    return res.status(200).json({
      success: true,
      message: 'Post retrieved successfully for preview',
      post: transformedPost,
    });
  } catch (error) {
    console.error('Preview API error:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
}