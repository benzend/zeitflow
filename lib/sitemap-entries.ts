import { getAllGuides } from "@/lib/guides";

/**
 * App pages that require a session or are admin-only.
 * They must not be listed in the public sitemap.
 */
export const PRIVATE_SITEMAP_PATHS = [
  "/dashboard",
  "/workflows",
  "/settings",
  "/assets",
  "/blog/create",
  "/blog/manage",
  "/blog/edit",
  "/blog/preview",
  "/test-workflow",
  "/auth/verify",
  "/auth/signin",
  "/auth/register",
  "/connect",
  "/templates",
] as const;

const PRIVATE_PREFIXES = [
  "/workflow/",
  "/chain/",
  "/results/",
  "/api/",
  // Trailing slash so /blog/preview-of-x and /blog/edit-me stay indexable.
  "/blog/edit/",
  "/blog/preview/",
] as const;

/** Stable public pages. Guide and blog post URLs are added separately. */
export const PUBLIC_STATIC_PATHS = [
  "",
  "/pricing",
  "/terms",
  "/privacy",
  "/release-notes",
  "/contact",
  "/report",
  "/integrations",
  "/guides",
  "/blog",
] as const;

/**
 * Lastmod for pages that do not have their own updated timestamp.
 * SITEMAP_BUILD_DATE is set in next.config.ts when the build starts.
 */
export function sitemapStaticLastMod(): string {
  const raw = process.env.SITEMAP_BUILD_DATE;
  if (raw && !Number.isNaN(Date.parse(raw))) {
    return new Date(raw).toISOString();
  }
  return "2026-10-31T00:00:00.000Z";
}

export function publicGuidePaths(): string[] {
  return getAllGuides().map((guide) => `/guides/${guide.slug}`);
}

export function isPublicSitemapPath(path: string): boolean {
  for (const excluded of PRIVATE_SITEMAP_PATHS) {
    if (path === excluded || path.startsWith(`${excluded}/`)) {
      return false;
    }
  }
  for (const prefix of PRIVATE_PREFIXES) {
    if (path.startsWith(prefix)) {
      return false;
    }
  }
  return path === "" || path.startsWith("/");
}

export function sitemapPriority(path: string): string {
  if (path === "") return "1.0";
  if (path === "/blog" || path.startsWith("/blog/")) return "0.9";
  if (path.startsWith("/guides")) return "0.8";
  if (path.startsWith("/auth/")) return "0.6";
  return "0.7";
}

export function sitemapChangeFreq(path: string): string {
  if (path === "") return "daily";
  if (
    path === "/blog" ||
    path.startsWith("/blog/") ||
    path.startsWith("/guides")
  ) {
    return "weekly";
  }
  return "monthly";
}
