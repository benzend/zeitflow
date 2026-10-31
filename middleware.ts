import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { wellKnownDiscoveryBody } from "@/lib/well-known-oauth";

/**
 * Answer /.well-known probes with public JSON.
 *
 * MCP clients request OAuth discovery documents before connecting. An HTML 404
 * makes some of them throw "Invalid OAuth error response". A 401 makes the
 * documents look authentication-gated, which fails registry checks that require
 * discovery URLs to be publicly readable.
 *
 * ZeitFlow does not implement an MCP OAuth authorization server, so these
 * routes return 404 JSON explaining that. They do not advertise issuer,
 * authorization, or token endpoints.
 */
export function middleware(request: NextRequest) {
  const { status, body } = wellKnownDiscoveryBody(request.nextUrl.pathname);

  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}

export const config = {
  matcher: [
    "/.well-known/oauth-protected-resource",
    "/.well-known/oauth-protected-resource/:path*",
    "/.well-known/oauth-authorization-server",
    "/.well-known/oauth-authorization-server/:path*",
  ],
};
