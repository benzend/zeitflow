import { GetServerSideProps } from "next";
import { db } from "@/lib/db";
import { blogPostsTable } from "@/schema";
import { eq } from "drizzle-orm";
import { getCanonicalSiteOrigin } from "@/lib/site";
import {
  PUBLIC_STATIC_PATHS,
  isPublicSitemapPath,
  publicGuidePaths,
  sitemapChangeFreq,
  sitemapPriority,
} from "@/lib/sitemap-entries";

export default function Sitemap() {
  return null;
}

function renderUrl(origin: string, path: string, lastmod: string): string {
  return `  <url>
    <loc>${origin}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${sitemapChangeFreq(path)}</changefreq>
    <priority>${sitemapPriority(path)}</priority>
  </url>`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const origin = getCanonicalSiteOrigin();
  const now = new Date().toISOString();
  const pages = new Map<string, string>();

  const add = (path: string, lastmod: string) => {
    if (!isPublicSitemapPath(path) || pages.has(path)) return;
    pages.set(path, lastmod);
  };

  for (const path of PUBLIC_STATIC_PATHS) {
    add(path, now);
  }
  for (const path of publicGuidePaths()) {
    add(path, now);
  }

  try {
    const blogPosts = await db
      .select({
        slug: blogPostsTable.slug,
        publishedAt: blogPostsTable.publishedAt,
        updatedAt: blogPostsTable.updatedAt,
      })
      .from(blogPostsTable)
      .where(eq(blogPostsTable.published, true));

    for (const post of blogPosts) {
      const lastmod = (post.publishedAt || post.updatedAt).toISOString();
      add(`/blog/${post.slug}`, lastmod);
    }
  } catch {
    // Static pages and guides are still published when the database is unavailable.
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...pages.entries()]
  .map(([path, lastmod]) => renderUrl(origin, path, lastmod))
  .join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};
