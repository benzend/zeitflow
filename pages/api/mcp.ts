/**
 * Remote MCP endpoint — Streamable HTTP transport (stateless).
 *
 * Clients can connect with just a URL + Bearer token:
 *
 *   {
 *     "mcpServers": {
 *       "zeitflow": {
 *         "serverUrl": "https://www.zeitflow.io/api/mcp",
 *         "headers": { "Authorization": "Bearer <token>" }
 *       }
 *     }
 *   }
 *
 * Supports POST (client → server messages) in stateless mode.
 * No DATABASE_URL or local setup required by the client.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { db } from "@/lib/db";
import { usersTable } from "@/schema";
import { eq } from "drizzle-orm";
import { createMcpServer } from "@/mcp/create-server";
import { hashValue } from "@/lib/encryption";

// Disable Next.js body parsing — the MCP transport reads the raw stream.
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Resolve a user from a Bearer token.
 */
async function resolveUserFromToken(
  token: string
): Promise<{ id: string; email: string } | null> {
  const [user] = await db
    .select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.apiTokenHash, hashValue(token)))
    .limit(1);

  return user ?? null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ---- Auth ----------------------------------------------------------
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      jsonrpc: "2.0",
      error: {
        code: -32001,
        message:
          "Missing or invalid Authorization header. Use: Bearer <api-token>",
      },
      id: null,
    });
  }

  const token = authHeader.slice(7);
  const user = await resolveUserFromToken(token);

  if (!user) {
    return res.status(401).json({
      jsonrpc: "2.0",
      error: {
        code: -32001,
        message: "Invalid API token — no matching user found.",
      },
      id: null,
    });
  }

  // ---- Build MCP server + transport for this request -----------------
  const host =
    process.env.HOST ||
    process.env.NEXTAUTH_URL ||
    `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`;

  const server = createMcpServer(db, user, { host, apiToken: token });

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — no session tracking
  });

  await server.connect(transport);

  try {
    await transport.handleRequest(req, res);
  } catch (err) {
    // If the response hasn't been sent yet, return a JSON-RPC error.
    if (!res.writableEnded) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message:
            err instanceof Error ? err.message : "Internal server error",
        },
        id: null,
      });
    }
  } finally {
    // Clean up the transport + server for this request.
    await transport.close?.();
    await server.close();
  }
}
