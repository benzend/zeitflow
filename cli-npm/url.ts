/**
 * Apex zeitflow.io 307-redirects to www. MCP and API clients that do not follow
 * redirects need the www host, so an apex base URL is rewritten here.
 * Unparseable values are returned trimmed, without the www fallback, so a
 * custom or partial URL in local config is not replaced.
 */
export function canonicalizeBaseUrl(url: string): string {
  const trimmed = url.replace(/\/$/, "");
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname === "zeitflow.io") {
      parsed.hostname = "www.zeitflow.io";
      return parsed.toString().replace(/\/$/, "");
    }
  } catch {
    return trimmed;
  }
  return trimmed;
}
