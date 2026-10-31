import { GetServerSideProps } from "next";
import { db } from "@/lib/db";
import { blogPostsTable } from "@/schema";
import { eq } from "drizzle-orm";
import { getAllGuides } from "@/lib/guides";
import { getCanonicalSiteOrigin } from "@/lib/site";
import {
  PUBLIC_STATIC_PATHS,
  isPublicSitemapPath,
  sitemapChangeFreq,
  sitemapPriority,
  sitemapStaticLastMod,
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
  const staticLastMod = sitemapStaticLastMod();
  const pages = new Map<string, string>();
  let blogPostsLoaded = true;

  const add = (path: string, lastmod: string) => {
    if (!isPublicSitemapPath(path) || pages.has(path)) return;
    pages.set(path, lastmod);
  };

  for (const path of PUBLIC_STATIC_PATHS) {
    add(path, staticLastMod);
  }
  for (const guide of getAllGuides()) {
    add(
      `/guides/${guide.slug}`,
      new Date(`${guide.updatedAt}T00:00:00.000Z`).toISOString()
    );
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
      const stamp = post.updatedAt ?? post.publishedAt;
      if (!stamp) continue;
      add(`/blog/${post.slug}`, stamp.toISOString());
    }
  } catch (error) {
    blogPostsLoaded = false;
    console.error("Failed to load published blog posts for the sitemap", error);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...pages.entries()]
  .map(([path, lastmod]) => renderUrl(origin, path, lastmod))
  .join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.setHeader(
    "Cache-Control",
    blogPostsLoaded
      ? "public, max-age=3600, s-maxage=3600"
      : "public, max-age=0, s-maxage=60"
  );
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};
