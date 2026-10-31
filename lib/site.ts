/**
 * Canonical public origin.
 *
 * https://zeitflow.io 307-redirects to https://www.zeitflow.io at the edge.
 * MCP clients that do not follow redirects fail if they are given the apex URL,
 * so every advertised MCP URL and public absolute link uses the www host.
 */
export const CANONICAL_SITE_ORIGIN = "https://www.zeitflow.io";

export const CANONICAL_MCP_URL = `${CANONICAL_SITE_ORIGIN}/api/mcp`;

/**
 * Rewrite the apex host to www. Other hosts (localhost, preview URLs) are unchanged.
 */
export function canonicalizeSiteOrigin(origin: string): string {
  const trimmed = origin.trim().replace(/\/$/, "");
  try {
    const url = new URL(trimmed);
    if (url.hostname === "zeitflow.io") {
      url.hostname = "www.zeitflow.io";
      return url.toString().replace(/\/$/, "");
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return CANONICAL_SITE_ORIGIN;
  }
}

/**
 * Origin for canonical tags, sitemap, and robots.
 * Env values that still point at the apex host are rewritten to www.
 */
export function getCanonicalSiteOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_URL ||
    CANONICAL_SITE_ORIGIN;
  return canonicalizeSiteOrigin(raw);
}
