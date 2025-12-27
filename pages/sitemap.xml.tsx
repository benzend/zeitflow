import { GetServerSideProps } from 'next';
import { db } from '@/lib/db';
import { blogPostsTable } from '@/schema';
import { eq } from 'drizzle-orm';

export default function Sitemap() {
  // This component is never actually rendered
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://zeitflow.io';
  
  try {
    // Static pages that should be included in sitemap
    const staticPages = [
      '',
      '/pricing',
      '/terms',
      '/privacy',
      '/release-notes',
    ];

    // Authentication pages
    const authPages = [
      '/auth/signin',
      '/auth/register',
      '/auth/verify',
    ];

    // Get published blog posts from database
    const blogPosts = await db
      .select({
        slug: blogPostsTable.slug,
        publishedAt: blogPostsTable.publishedAt,
        updatedAt: blogPostsTable.updatedAt,
      })
      .from(blogPostsTable)
      .where(eq(blogPostsTable.published, true));

    // Create blog page URLs
    const blogPages = blogPosts.map(post => `/blog/${post.slug}`);
    
    // Protected/app pages (we'll include them but search engines may not index them)
    const protectedPages = [
      '/dashboard',
      '/workflows',
      '/settings',
      '/assets',
      '/blog',
      '/blog/create',
      '/blog/manage',
      '/test-workflow',
    ];

    // Combine all pages
    const allPages = [...staticPages, ...authPages, ...blogPages, ...protectedPages];

    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map((page) => {
  const url = `${baseUrl}${page}`;
  
  // Find matching blog post for lastmod date
  const blogPost = blogPosts.find(post => page === `/blog/${post.slug}`);
  const lastmod = blogPost ? 
    (blogPost.publishedAt || blogPost.updatedAt).toISOString() : 
    new Date().toISOString();
  
  const priority = page === '' ? '1.0' : 
                  page.startsWith('/blog/') && !page.startsWith('/blog/create') && !page.startsWith('/blog/manage') ? '0.9' :
                  page.startsWith('/auth/') ? '0.6' :
                  protectedPages.includes(page) ? '0.7' : '0.8';
  
  const changefreq = page === '' ? 'daily' : 
                     page.startsWith('/blog/') && !page.startsWith('/blog/create') && !page.startsWith('/blog/manage') ? 'weekly' :
                     page.startsWith('/auth/') ? 'monthly' :
                     protectedPages.includes(page) ? 'weekly' : 'monthly';
  
  return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}).join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'text/xml');
    res.write(sitemap);
    res.end();

  } catch (error) {
    // Fallback to basic sitemap if database query fails
    const fallbackPages = [
      '',
      '/pricing',
      '/terms',
      '/privacy',
      '/release-notes',
      '/auth/signin',
      '/auth/register',
      '/auth/verify',
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${fallbackPages.map((page) => {
  const url = `${baseUrl}${page}`;
  const priority = page === '' ? '1.0' : page.startsWith('/auth/') ? '0.6' : '0.8';
  const changefreq = page === '' ? 'daily' : page.startsWith('/auth/') ? 'monthly' : 'monthly';
  
  return `  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}).join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'text/xml');
    res.write(sitemap);
    res.end();
  }

  return {
    props: {},
  };
};