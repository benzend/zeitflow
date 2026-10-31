import { CANONICAL_MCP_URL, CANONICAL_SITE_ORIGIN } from "@/lib/site";

/**
 * Public explanation returned for OAuth discovery paths.
 *
 * This is intentionally NOT RFC 9728 Protected Resource Metadata or RFC 8414
 * Authorization Server Metadata. ZeitFlow has no OAuth 2.1 authorization server
 * for MCP clients (see the PR description). Publishing fake issuer / endpoint
 * fields would make clients start an OAuth flow that cannot succeed.
 */
export const OAUTH_NOT_SUPPORTED_BODY = {
  error: "oauth_not_supported",
  error_description:
    "ZeitFlow does not implement an OAuth 2.1 authorization server. " +
    `MCP clients authenticate to ${CANONICAL_MCP_URL} with a Bearer API token from ${CANONICAL_SITE_ORIGIN}/connect. ` +
    "This document is not OAuth Protected Resource Metadata (RFC 9728) or Authorization Server Metadata (RFC 8414).",
} as const;

export function isOAuthDiscoveryPath(pathname: string): boolean {
  return (
    pathname === "/.well-known/oauth-protected-resource" ||
    pathname.startsWith("/.well-known/oauth-protected-resource/") ||
    pathname === "/.well-known/oauth-authorization-server" ||
    pathname.startsWith("/.well-known/oauth-authorization-server/")
  );
}

export function wellKnownDiscoveryBody(pathname: string): {
  status: 404;
  body: { error: string; error_description: string };
} {
  if (isOAuthDiscoveryPath(pathname)) {
    return { status: 404, body: { ...OAUTH_NOT_SUPPORTED_BODY } };
  }

  return {
    status: 404,
    body: {
      error: "not_found",
      error_description: "No discovery document is published at this path.",
    },
  };
}
