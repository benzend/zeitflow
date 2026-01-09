import Navigation from "@/components/Navigation";
import { BlogPostCard, BlogNavigation } from "@/components/blog";
import { Button } from "@/components/Button";
import { db } from '@/lib/db';
import { blogPostsTable, usersTable } from '@/schema';
import { eq, desc } from 'drizzle-orm';
import { GODMODE_EMAILS } from '@/lib/constants';
import type { Metadata } from "next";

interface BlogPageProps {
  searchParams: { page?: string };
}

export const metadata: Metadata = {
  title: "Blog | ZeitFlow",
  description: "Insights, tutorials, and updates on AI workflow automation",
  keywords: "AI workflow automation, prompt chains, AI automation, productivity, artificial intelligence",
  openGraph: {
    title: "Blog | ZeitFlow",
    description: "Insights, tutorials, and updates on AI workflow automation",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Blog | ZeitFlow",
    description: "Insights, tutorials, and updates on AI workflow automation",
  },
};

// Force dynamic rendering to ensure fresh blog posts
export const dynamic = 'force-dynamic';

async function getBlogPosts(page: number = 1) {
  const limit = 12;
  const offset = (page - 1) * limit;

  try {
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
      .where(eq(blogPostsTable.published, true))
      .orderBy(desc(blogPostsTable.publishedAt || blogPostsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const transformedPosts = posts.map(post => ({
      ...post,
      publishedAt: post.publishedAt?.toISOString() || undefined,
      createdAt: post.createdAt?.toISOString() || undefined,
      updatedAt: post.updatedAt?.toISOString() || undefined,
      excerpt: post.excerpt || undefined,
      content: post.content || undefined,
      featuredImage: post.featuredImage || undefined,
      tags: post.tags || undefined,
      author: {
        name: post.authorName || undefined,
        email: post.authorEmail || '',
        isAdmin: GODMODE_EMAILS.includes(post.authorEmail || ''),
      },
    }));

    const total = await db.$count(blogPostsTable, eq(blogPostsTable.published, true));
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return {
      posts: transformedPosts,
      currentPage: page,
      totalPages,
      hasNext,
      hasPrevious,
    };
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return {
      posts: [],
      currentPage: 1,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    };
  }
}

export default async function Blog({ searchParams }: BlogPageProps) {
  const page = parseInt(searchParams.page || '1');
  const { posts, currentPage, totalPages, hasNext, hasPrevious } = await getBlogPosts(page);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.zeitflow.io';
  const canonicalUrl = page > 1 
    ? `${baseUrl}/blog?page=${page}`
    : `${baseUrl}/blog`;
  const defaultImage = `${baseUrl}/logo.svg`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "ZeitFlow Blog",
    "description": "Insights, tutorials, and updates on AI workflow automation",
    "url": `${baseUrl}/blog`,
    "publisher": {
      "@type": "Organization",
      "name": "ZeitFlow",
      "logo": {
        "@type": "ImageObject",
        "url": defaultImage
      }
    },
    "blogPost": posts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt || '',
      "url": `${baseUrl}/blog/${post.slug}`,
      "datePublished": post.publishedAt,
      "author": {
        "@type": "Person",
        "name": post.author.name || 'ZeitFlow'
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <link rel="canonical" href={canonicalUrl} />
      {hasPrevious && page > 1 && (
        <link rel="prev" href={`${baseUrl}/blog?page=${page - 1}`} />
      )}
      {hasPrevious && page === 1 && (
        <link rel="prev" href={`${baseUrl}/blog`} />
      )}
      {hasNext && (
        <link rel="next" href={`${baseUrl}/blog?page=${page + 1}`} />
      )}
      
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        
        <main className="max-w-6xl mx-auto px-4 py-16 mt-10">
          {/* Header */}
          <div className="text-center mb-12 animate-slide-up-fade">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
              Blog
            </h1>
            <p className="text-xl text-text-muted max-w-2xl mx-auto">
              Insights, tutorials, and updates on AI workflow automation
            </p>
          </div>

          {/* Blog Posts Grid */}
          {posts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {posts.map((post, index) => (
                  <div
                    key={post.id}
                    className="animate-slide-up-fade"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <BlogPostCard post={post} />
                  </div>
                ))}
              </div>

              {/* Navigation */}
              {(hasPrevious || hasNext) && (
                <BlogNavigation
                  currentPage={currentPage}
                  totalPages={totalPages}
                  hasPrevious={hasPrevious}
                  hasNext={hasNext}
                />
              )}
            </>
          ) : (
            <div className="text-center py-16 animate-slide-up-fade">
              <div className="max-w-md mx-auto">
                <div className="bg-surface border border-border rounded-lg p-8">
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">
                    No blog posts yet
                  </h2>
                  <p className="text-text-muted mb-6">
                    We&apos;re working on some great content for you. Check back soon for the latest insights on AI workflow automation.
                  </p>
                  <Button href="/" variant="primary">
                    Back to Home
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
