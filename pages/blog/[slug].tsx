import { GetServerSideProps } from 'next';
import { Footer } from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { BlogPost } from "@/components/blog";
import { Button } from "@/components/Button";
import { db } from '@/lib/db';
import { blogPostsTable, usersTable } from '@/schema';
import { eq, and } from 'drizzle-orm';
import { GODMODE_EMAILS } from '@/lib/constants';

interface BlogPostData {
  id: number;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  tags?: string;
  publishedAt?: string;
  author: {
    name?: string;
    email: string;
    isAdmin: boolean;
  };
}

interface BlogPostPageProps {
  post: BlogPostData | null;
  notFound?: boolean;
}

export default function BlogPostPage({ post, notFound }: BlogPostPageProps) {
  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        
        <div className="max-w-4xl mx-auto px-4 py-16 mt-10">
          <div className="text-center py-16 animate-slide-up-fade">
            <div className="bg-surface border border-border rounded-lg p-8">
              <h1 className="text-4xl font-bold mb-4 text-foreground">Post Not Found</h1>
              <p className="text-xl text-text-muted mb-6">
                Sorry, the blog post you&apos;re looking for doesn&apos;t exist or has been removed.
              </p>
              <Button href="/blog" variant="primary">
                Back to Blog
              </Button>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-16 mt-10">
        <div className="mb-8">
          <Button 
            href="/blog" 
            variant="tertiary" 
            className="!bg-transparent !p-0 text-text-muted hover:text-primary transition-colors duration-200 mb-8"
          >
            ← Back to Blog
          </Button>
        </div>
        
        <BlogPost post={post} />
      </div>

      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string };

  try {
    // Query database directly instead of making HTTP request
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
      return {
        props: {
          post: null,
          notFound: true,
        },
      };
    }

    // Transform the data to match expected format
    const transformedPost = {
      ...post,
      publishedAt: post.publishedAt?.toISOString(),
      createdAt: post.createdAt?.toISOString(),
      updatedAt: post.updatedAt?.toISOString(),
      author: {
        name: post.authorName || undefined,
        email: post.authorEmail || '',
        isAdmin: GODMODE_EMAILS.includes(post.authorEmail || ''),
      },
    };

    return {
      props: {
        post: transformedPost,
        notFound: false,
      },
    };
  } catch (error) {
    console.error('Error fetching blog post:', error);
    
    return {
      props: {
        post: null,
        notFound: true,
      },
    };
  }
};
