import { GetServerSideProps } from 'next';
import Head from 'next/head';
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
  updatedAt?: string;
  createdAt?: string;
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

  const tags = post.tags ? JSON.parse(post.tags) : [];
  const metaDescription = post.excerpt || post.content.substring(0, 160).replace(/[#*`]/g, '').trim() + '...';
  const authorName = post.author.isAdmin ? 'ZeitFlow' : post.author.name;
  const publishedDate = post.publishedAt ? new Date(post.publishedAt).toISOString() : '';
  const modifiedDate = post.updatedAt ? new Date(post.updatedAt).toISOString() : '';

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": metaDescription,
    "image": post.featuredImage || `${process.env.NEXT_PUBLIC_APP_URL}/logo.svg`,
    "datePublished": publishedDate,
    "dateModified": modifiedDate,
    "author": {
      "@type": "Organization",
      "name": "ZeitFlow"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ZeitFlow",
      "logo": {
        "@type": "ImageObject",
        "url": `${process.env.NEXT_PUBLIC_APP_URL}/logo.svg`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${process.env.NEXT_PUBLIC_APP_URL}/blog/${post.slug}`
    },
    "keywords": tags.join(', ')
  };

  return (
    <>
      <Head>
        <title>{post.title} | ZeitFlow Blog</title>
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content={tags.join(', ')} />
        <meta name="author" content={authorName || 'ZeitFlow'} />
        
        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={post.featuredImage || `${process.env.NEXT_PUBLIC_APP_URL}/logo.svg`} />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_APP_URL}/blog/${post.slug}`} />
        <meta property="og:site_name" content="ZeitFlow" />
        <meta property="article:published_time" content={publishedDate} />
        <meta property="article:modified_time" content={modifiedDate} />
        <meta property="article:author" content={authorName || 'ZeitFlow'} />
        {tags.map((tag: string) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={post.featuredImage || `${process.env.NEXT_PUBLIC_APP_URL}/logo.svg`} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_APP_URL}/blog/${post.slug}`} />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      
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
    </>
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
