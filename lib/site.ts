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
 * Rewrite the apex host to www and return only the origin (no path or query).
 * Other hosts (localhost, preview URLs) are unchanged.
 * Unparseable values log a warning and fall back to the canonical www origin.
 */
export function canonicalizeSiteOrigin(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch (error) {
    console.warn(
      `Invalid site origin "${raw}". Falling back to ${CANONICAL_SITE_ORIGIN}.`,
      error
    );
    return CANONICAL_SITE_ORIGIN;
  }

  if (url.hostname === "zeitflow.io") {
    url.hostname = "www.zeitflow.io";
  }
  return url.origin;
}

/**
 * Public site URL env vars, in priority order.
 * Production should set NEXT_PUBLIC_APP_URL to https://www.zeitflow.io.
 * NEXT_PUBLIC_BASE_URL and NEXT_PUBLIC_URL are legacy aliases used only here.
 */
export function readConfiguredPublicOrigin(): string | undefined {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_URL;
  return raw || undefined;
}

/**
 * Origin for canonical tags, sitemap, robots, and other absolute public links.
 */
export function getCanonicalSiteOrigin(): string {
  const raw = readConfiguredPublicOrigin();
  if (!raw) return CANONICAL_SITE_ORIGIN;
  return canonicalizeSiteOrigin(raw);
}

/**
 * Host for server-to-server calls that carry tokens or secrets.
 *
 * Rewrites only the apex zeitflow.io host to www. Every other host is kept.
 * A bare localhost or 127.0.0.1 value gets an http scheme. Unparseable or
 * empty values are returned unchanged and never replaced with the public site.
 */
export function canonicalizeInternalHost(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    console.warn(
      "Internal host is empty. Not falling back to the public site."
    );
    return trimmed;
  }

  const withScheme = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(trimmed)
    ? `http://${trimmed}`
    : trimmed;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch (error) {
    console.warn(
      `Invalid internal host "${raw}". Leaving it unchanged so it is not rewritten to production.`,
      error
    );
    return trimmed;
  }

  if (url.hostname === "zeitflow.io") {
    url.hostname = "www.zeitflow.io";
  }
  return url.origin;
}

/**
 * HOST, then NEXTAUTH_URL. Undefined when neither is set.
 */
export function getInternalOrigin(): string | undefined {
  const raw = process.env.HOST || process.env.NEXTAUTH_URL;
  if (!raw) return undefined;
  return canonicalizeInternalHost(raw);
}
