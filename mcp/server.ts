#!/usr/bin/env tsx
/**
 * ZeitFlow MCP Server (stdio transport)
 *
 * Exposes workflow management tools via the Model Context Protocol,
 * allowing AI agents to create, configure, and execute workflows.
 *
 * Authentication: Set ZEITFLOW_API_TOKEN env var to a user's API token.
 * The server resolves the user from this token on startup.
 *
 * Usage:
 *   ZEITFLOW_API_TOKEN=<token> DATABASE_URL=<url> pnpm mcp
 *
 * Or add to your MCP client config (e.g. Claude Desktop):
 *   {
 *     "mcpServers": {
 *       "zeitflow": {
 *         "command": "pnpm",
 *         "args": ["mcp"],
 *         "env": {
 *           "ZEITFLOW_API_TOKEN": "<your-api-token>",
 *           "DATABASE_URL": "<your-database-url>"
 *         }
 *       }
 *     }
 *   }
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { usersTable } from "../schema";
import { createMcpServer } from "./create-server";
import { hashValue } from "../lib/encryption";

// ---------------------------------------------------------------------------
// Database & Auth
// ---------------------------------------------------------------------------

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const API_TOKEN = process.env.ZEITFLOW_API_TOKEN;
if (!API_TOKEN) {
  console.error("ZEITFLOW_API_TOKEN environment variable is required");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

/** Resolve the authenticated user once at startup */
async function resolveUser(): Promise<{ id: string; email: string }> {
  const [user] = await db
    .select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.apiTokenHash, hashValue(API_TOKEN!)))
    .limit(1);

  if (!user) {
    console.error("Invalid ZEITFLOW_API_TOKEN – no matching user found");
    process.exit(1);
  }
  return user;
}

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main() {
  const currentUser = await resolveUser();

  const server = createMcpServer(db, currentUser, {
    apiToken: API_TOKEN,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr so it doesn't interfere with MCP stdio protocol
  console.error(
    `ZeitFlow MCP server running (user: ${currentUser.email})`
  );
}

main().catch((err) => {
  console.error("Fatal error starting MCP server:", err);
  process.exit(1);
});
