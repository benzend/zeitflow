#!/usr/bin/env node
/**
 * @zeitflow/mcp — stdio-to-HTTP bridge
 *
 * Connects to the remote ZeitFlow MCP endpoint and exposes it locally via
 * stdio so that MCP clients that only support the stdio transport (e.g. some
 * older Claude Desktop versions) can still use the remote server.
 *
 * Token resolution order:
 *   1. ZEITFLOW_API_TOKEN env var (highest priority)
 *   2. ~/.zeitflow/config.json → token field
 *
 * URL resolution order:
 *   1. ZEITFLOW_URL env var
 *   2. ~/.zeitflow/config.json → url field
 *   3. https://www.zeitflow.io (default)
 *
 * Usage:
 *   npx @zeitflow/mcp                                    # uses shared config
 *   ZEITFLOW_API_TOKEN=xxx npx @zeitflow/mcp             # env var override
 *   ZEITFLOW_API_TOKEN=xxx ZEITFLOW_URL=https://... npx @zeitflow/mcp
 */

import { createInterface } from "readline";
import { readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

interface ZeitFlowConfig {
  token?: string;
  url?: string;
}

function loadConfigFile(): ZeitFlowConfig {
  try {
    const configPath = join(homedir(), ".zeitflow", "config.json");
    const contents = readFileSync(configPath, "utf-8");
    return JSON.parse(contents);
  } catch {
    return {};
  }
}

const fileConfig = loadConfigFile();

const API_TOKEN = process.env.ZEITFLOW_API_TOKEN || fileConfig.token;
const BASE_URL = (
  process.env.ZEITFLOW_URL || fileConfig.url || "https://www.zeitflow.io"
).replace(/\/$/, "");

if (!API_TOKEN) {
  process.stderr.write(
    "Error: No API token found.\n" +
      "Run: zeitflow auth login\n" +
      "Or set ZEITFLOW_API_TOKEN env var.\n"
  );
  process.exit(1);
}

const MCP_ENDPOINT = `${BASE_URL}/api/mcp`;

/**
 * Read JSON-RPC messages line-by-line from stdin, POST them to the remote
 * MCP endpoint, and write the responses to stdout.
 *
 * The MCP stdio transport frames messages as newline-delimited JSON. Each
 * line is a complete JSON-RPC 2.0 message.
 */
async function main() {
  process.stderr.write(`ZeitFlow MCP bridge → ${MCP_ENDPOINT}\n`);

  const rl = createInterface({
    input: process.stdin,
    terminal: false,
  });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const response = await fetch(MCP_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: trimmed,
      });

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream")) {
        // SSE response — parse event stream and emit each data line
        const text = await response.text();
        for (const sseLine of text.split("\n")) {
          if (sseLine.startsWith("data: ")) {
            const data = sseLine.slice(6).trim();
            if (data) {
              process.stdout.write(data + "\n");
            }
          }
        }
      } else {
        // JSON response
        const body = await response.text();
        if (body.trim()) {
          process.stdout.write(body.trim() + "\n");
        }
      }
    } catch (err) {
      // Return a JSON-RPC error so the client doesn't hang
      const errorResponse = {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message:
            err instanceof Error
              ? err.message
              : "Failed to reach ZeitFlow API",
        },
        id: null,
      };
      process.stdout.write(JSON.stringify(errorResponse) + "\n");
    }
  }
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err}\n`);
  process.exit(1);
});
