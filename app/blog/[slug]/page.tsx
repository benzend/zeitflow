import { Footer } from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { BlogPost } from "@/components/blog";
import { Button } from "@/components/Button";
import { db } from '@/lib/db';
import { blogPostsTable, usersTable } from '@/schema';
import { eq, and } from 'drizzle-orm';
import { GODMODE_EMAILS } from '@/lib/constants';
import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
  author: {
    name?: string;
    email?: string;
    isAdmin: boolean;
  };
}

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

async function getBlogPost(slug: string): Promise<BlogPostData | null> {
  try {
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
      return null;
    }

    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt || undefined,
      content: post.content || '',
      featuredImage: post.featuredImage || undefined,
      tags: post.tags || undefined,
      publishedAt: post.publishedAt?.toISOString() || undefined,
      author: {
        name: post.authorName || undefined,
        email: post.authorEmail || undefined,
        isAdmin: GODMODE_EMAILS.includes(post.authorEmail || ''),
      },
    };
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return {
      title: 'Post Not Found | ZeitFlow',
      description: 'The blog post you are looking for does not exist.',
    };
  }

  const tags = post.tags ? JSON.parse(post.tags) : [];
  const metaDescription = post.excerpt || (post.content ? post.content.substring(0, 160).replace(/[#*`]/g, '').trim() + '...' : '');
  const authorName = post.author.isAdmin ? 'ZeitFlow' : post.author.name;
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.zeitflow.io';
  const canonicalUrl = `${baseUrl}/blog/${post.slug}`;
  const defaultImage = `${baseUrl}/logo.svg`;

  return {
    title: `${post.title} | ZeitFlow Blog`,
    description: metaDescription,
    keywords: tags.join(', '),
    authors: [{ name: authorName || 'ZeitFlow' }],
    openGraph: {
      title: post.title,
      description: metaDescription,
      type: 'article',
      url: canonicalUrl,
      images: post.featuredImage ? [{ url: post.featuredImage }] : [{ url: defaultImage }],
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt || undefined,
      authors: post.author.isAdmin ? ['ZeitFlow'] : [authorName || ''],
      tags: tags,
      siteName: 'ZeitFlow',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: metaDescription,
      images: post.featuredImage ? [post.featuredImage] : [defaultImage],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const tags = post.tags ? JSON.parse(post.tags) : [];
  const metaDescription = post.excerpt || (post.content ? post.content.substring(0, 160).replace(/[#*`]/g, '').trim() + '...' : '');
  const authorName = post.author.isAdmin ? 'ZeitFlow' : post.author.name;
  const publishedDate = post.publishedAt ? new Date(post.publishedAt).toISOString() : '';
  const modifiedDate = post.updatedAt ? new Date(post.updatedAt).toISOString() : '';
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.zeitflow.io';
  const canonicalUrl = `${baseUrl}/blog/${post.slug}`;
  const defaultImage = `${baseUrl}/logo.svg`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": metaDescription,
    "image": post.featuredImage || defaultImage,
    "datePublished": publishedDate,
    "dateModified": modifiedDate,
    "author": {
      "@type": post.author.isAdmin ? "Organization" : "Person",
      "name": authorName || 'ZeitFlow',
      "url": post.author.isAdmin ? "https://www.zeitflow.io" : undefined
    },
    "publisher": {
      "@type": "Organization",
      "name": "ZeitFlow",
      "url": "https://www.zeitflow.io",
      "logo": {
        "@type": "ImageObject",
        "url": defaultImage
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    },
    "keywords": tags.join(', '),
    "about": {
      "@type": "Thing",
      "name": "AI Workflow Automation"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
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
          
          <BlogPost post={{
            id: post.id,
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt || undefined,
            content: post.content || '',
            featuredImage: post.featuredImage || undefined,
            tags: post.tags || undefined,
            publishedAt: post.publishedAt || undefined,
            author: post.author,
          }} />
        </div>

        <Footer />
      </div>
    </>
  );
}