import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { db } from '@/lib/db';
import { blogPostsTable, usersTable } from '@/schema';
import { eq } from 'drizzle-orm';
import { notFound } from "next/navigation";
import { GODMODE_EMAILS } from '@/lib/constants';
import Navigation from "@/components/Navigation";
import { BlogPost } from "@/components/blog";
import { Button } from "@/components/Button";

interface PreviewPageProps {
  searchParams: Promise<{ id?: string; data?: string }>;
}

interface PostData {
  id: number;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  tags?: string;
  publishedAt?: string;
  updatedAt?: string;
}

async function getPostData(id: string): Promise<PostData | null> {
  try {
    // Fetch post directly from database with authentication check
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
      return null;
    }

    return {
      ...post,
      tags: post.tags || undefined,
      publishedAt: post.publishedAt?.toISOString() || undefined,
      updatedAt: post.updatedAt?.toISOString() || undefined,
    };
  } catch (error) {
    console.error('Error fetching post for preview:', error);
    return null;
  }
}

export default async function PreviewPage({ searchParams }: PreviewPageProps) {
  // Check authentication
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.email ? GODMODE_EMAILS.includes(session.user.email) : false;
  
  if (!isAdmin) {
    notFound();
  }

  const { id, data } = await searchParams;

  let postData: PostData | null = null;

  if (id) {
    postData = await getPostData(id);
  } else if (data) {
    try {
      postData = JSON.parse(decodeURIComponent(data));
    } catch (error) {
      console.error('Error parsing preview data:', error);
    }
  }

  if (!postData) {
    notFound();
  }

  // Parse tags if they exist
  const tags = postData.tags ? (Array.isArray(postData.tags) ? postData.tags : JSON.parse(postData.tags)) : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-16 mt-10">
        {/* Preview Banner */}
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-yellow-400 font-medium">Preview Mode</span>
            </div>
            <div className="text-sm text-yellow-300">
              This is how your post will appear when published
            </div>
          </div>
        </div>

        <div className="mb-8">
          <Button 
            href="/blog" 
            variant="tertiary" 
            className="!bg-transparent !p-0 text-text-muted hover:text-primary transition-colors duration-200 mb-4"
          >
            ← Back to Blog
          </Button>
        </div>

        <BlogPost post={{
          id: postData.id,
          slug: postData.slug,
          title: postData.title,
          excerpt: postData.excerpt,
          content: postData.content,
          featuredImage: postData.featuredImage,
          tags: JSON.stringify(tags),
          publishedAt: postData.publishedAt,
          author: {
            name: postData.authorName || 'Preview Author',
            email: postData.authorEmail || 'preview@zeitflow.io',
            isAdmin: true,
          },
        }} />
      </div>
    </div>
  );
}