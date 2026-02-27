import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Return 401 for OAuth/.well-known discovery paths.
 *
 * MCP clients (Claude Code, Cursor, etc.) probe these paths before connecting.
 * If they receive 404 HTML they crash with "Invalid OAuth error response".
 * Returning 401 tells the client that OAuth is not available and it should
 * fall back to the Bearer-token auth it already has configured.
 */
export function middleware(request: NextRequest) {
  return NextResponse.json(
    { error: "unauthorized" },
    { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
  );
}

export const config = {
  matcher: ["/.well-known/:path*"],
};
