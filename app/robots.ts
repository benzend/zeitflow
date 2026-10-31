import type { MetadataRoute } from "next";
import { getCanonicalSiteOrigin } from "@/lib/site";

/**
 * Public robots.txt. Private app routes are disallowed so crawlers do not
 * treat session pages as indexable content. The sitemap URL uses the www host,
 * which is the host that actually serves the site (apex 307s to www).
 */
export default function robots(): MetadataRoute.Robots {
  const origin = getCanonicalSiteOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/settings",
        "/assets",
        "/workflows",
        "/workflow/",
        "/chain/",
        "/results/",
        "/blog/create",
        "/blog/manage",
        "/blog/edit",
        "/blog/preview",
        "/test-workflow",
        "/auth/verify",
      ],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
