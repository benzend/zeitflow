import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { Footer } from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { BlogPostCard, BlogNavigation } from "@/components/blog";
import { Button } from "@/components/Button";
import { db } from '@/lib/db';
import { blogPostsTable, usersTable } from '@/schema';
import { eq, desc } from 'drizzle-orm';
import { GODMODE_EMAILS } from '@/lib/constants';

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  tags?: string;
  publishedAt?: string;
  author: {
    name?: string;
  };
}

interface BlogPageProps {
  posts: BlogPost[];
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export default function Blog({ posts, currentPage, totalPages, hasNext, hasPrevious }: BlogPageProps) {
  const pageTitle = currentPage > 1 ? `Blog - Page ${currentPage} | ZeitFlow` : 'Blog | ZeitFlow';
  const pageDescription = 'Insights, tutorials, and updates on AI workflow automation';
  
  // Use fallback URL if environment variable is not set
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.zeitflow.io';
  const canonicalUrl = currentPage > 1 
    ? `${baseUrl}/blog?page=${currentPage}`
    : `${baseUrl}/blog`;
  const defaultImage = `${baseUrl}/logo.svg`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "ZeitFlow Blog",
    "description": pageDescription,
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
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content="AI workflow automation, prompt chains, AI automation, productivity, artificial intelligence" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={defaultImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="ZeitFlow" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={defaultImage} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Pagination meta */}
        {hasPrevious && currentPage > 1 && (
          <link rel="prev" href={`${baseUrl}/blog?page=${currentPage - 1}`} />
        )}
        {hasPrevious && currentPage === 1 && (
          <link rel="prev" href={`${baseUrl}/blog`} />
        )}
        {hasNext && (
          <link rel="next" href={`${baseUrl}/blog?page=${currentPage + 1}`} />
        )}
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        
        <div className="max-w-6xl mx-auto px-4 py-16 mt-10">
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
        </div>
      </div>

      <Footer />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const page = parseInt(context.query.page as string) || 1;
  const limit = 12; // Number of posts per page
  const offset = (page - 1) * limit;

  try {
    // Query database directly instead of making HTTP request
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

    // Transform the data to match expected format
    const transformedPosts = posts.map(post => ({
      ...post,
      publishedAt: post.publishedAt?.toISOString(),
      createdAt: post.createdAt?.toISOString(),
      updatedAt: post.updatedAt?.toISOString(),
      author: {
        name: post.authorName || undefined,
        email: post.authorEmail || '',
        isAdmin: GODMODE_EMAILS.includes(post.authorEmail || ''),
      },
    }));

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: blogPostsTable.id })
      .from(blogPostsTable)
      .where(eq(blogPostsTable.published, true));
    
    const total = totalCountResult.length;
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return {
      props: {
        posts: transformedPosts,
        currentPage: page,
        totalPages,
        hasNext,
        hasPrevious,
      },
    };
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    
    return {
      props: {
        posts: [],
        currentPage: 1,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      },
    };
  }
};
