/**
 * Read-only dump of workflows, nodes, connections, and executions.
 *
 * Safe to point at Neon with a read-only role. The session is set to
 * READ ONLY and every statement is checked before it is sent. The script
 * only issues SELECT, plus the session commands that keep the transaction
 * read-only. It rolls the transaction back.
 *
 *   DATABASE_URL='postgres://readonly:...@host/db' pnpm tsx scripts/export-workflow-fixtures.ts
 *   pnpm tsx scripts/export-workflow-fixtures.ts --limit 5 --out engine/fixtures/exported
 *
 * Output is gitignored. It can still contain user content (prompts, form
 * payloads). Do not commit it. Secret-shaped config values are replaced
 * with "***".
 */

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

const SECRET_KEYS = new Set([
  "apiKey",
  "apiToken",
  "botToken",
  "token",
  "accessToken",
  "secretKey",
  "authToken",
  "authValue",
  "twilioAuthToken",
  "smtpPass",
  "resendApiKey",
  "webhookUrl",
  "webhookSecret",
  "password",
  "authorization",
]);

const SECRET_VALUE =
  /^(sk_live_|sk_test_|rk_live_|rk_test_|xox[baprs]-|zf_|ghp_|github_pat_|enc:v1:)/;

interface Args {
  limit: number;
  executionsPerWorkflow: number;
  out: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    limit: 5,
    executionsPerWorkflow: 3,
    out: path.resolve("engine/fixtures/exported"),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === "--limit" && value) {
      args.limit = Number(value);
      i += 1;
    } else if (flag === "--executions-per-workflow" && value) {
      args.executionsPerWorkflow = Number(value);
      i += 1;
    } else if (flag === "--out" && value) {
      args.out = path.resolve(value);
      i += 1;
    } else if (flag === "--help") {
      console.log("Usage: pnpm tsx scripts/export-workflow-fixtures.ts [--limit N] [--executions-per-workflow N] [--out dir]");
      process.exit(0);
    }
  }
  if (!Number.isInteger(args.limit) || args.limit < 1) {
    throw new Error("--limit must be a positive integer");
  }
  if (!Number.isInteger(args.executionsPerWorkflow) || args.executionsPerWorkflow < 0) {
    throw new Error("--executions-per-workflow must be a non-negative integer");
  }
  const handwritten = path.resolve("engine/fixtures/handwritten");
  if (args.out === handwritten || args.out.startsWith(`${handwritten}${path.sep}`)) {
    throw new Error("refusing to write into engine/fixtures/handwritten");
  }
  return args;
}

function assertReadOnly(sql: string): void {
  const trimmed = sql.trim().toUpperCase();
  const allowed = ["SELECT", "SET", "BEGIN", "ROLLBACK", "SHOW"];
  if (!allowed.some((keyword) => trimmed.startsWith(keyword))) {
    throw new Error(`refusing non-read-only statement: ${sql}`);
  }
  if (/\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|GRANT|REVOKE|COPY|CREATE)\b/.test(trimmed)) {
    throw new Error(`refusing statement that mentions a write: ${sql}`);
  }
}

async function query(client: Client, sql: string, params: unknown[] = []) {
  assertReadOnly(sql);
  return client.query(sql, params);
}

function redact(value: unknown): unknown {
  if (typeof value === "string") {
    if (value.includes("enc:v1:") || SECRET_VALUE.test(value)) return "***";
    return value;
  }
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SECRET_KEYS.has(key) ? "***" : redact(child);
    }
    return out;
  }
  return value;
}

function parseJson(text: string | null): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    if (text.includes("enc:v1:") || SECRET_VALUE.test(text)) return "***";
    return text;
  }
}

function redactConfig(text: string | null): unknown {
  const parsed = parseJson(text);
  if (parsed == null) return null;
  return redact(parsed);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required (use a read-only connection string)");
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await query(client, "SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY");
    await query(client, "BEGIN READ ONLY");

    const workflows = await query(
      client,
      `SELECT w.id, w.name, w.description, w.status
       FROM workflows w
       WHERE EXISTS (SELECT 1 FROM workflow_nodes n WHERE n.workflow_id = w.id)
       ORDER BY w.id
       LIMIT $1`,
      [args.limit],
    );

    const ids = workflows.rows.map((row) => row.id as number);
    if (ids.length === 0) {
      console.log("no workflows with nodes");
      await query(client, "ROLLBACK");
      return;
    }

    const nodes = await query(
      client,
      `SELECT id, workflow_id, type, label, config, entry_type, position_x, position_y
       FROM workflow_nodes
       WHERE workflow_id = ANY($1::int[])
       ORDER BY workflow_id, position_x, position_y, id`,
      [ids],
    );
    const connections = await query(
      client,
      `SELECT id, workflow_id, from_node_id, to_node_id, source_handle, target_handle
       FROM workflow_connections
       WHERE workflow_id = ANY($1::int[])
       ORDER BY id`,
      [ids],
    );
    const executions = await query(
      client,
      `SELECT id, workflow_id, status, input_data, output_data, started_at
       FROM workflow_executions
       WHERE workflow_id = ANY($1::int[])
       ORDER BY id DESC`,
      [ids],
    );

    await query(client, "ROLLBACK");

    mkdirSync(args.out, { recursive: true });
    const index: Array<{ file: string; workflowId: number; status: string }> = [];

    for (const workflow of workflows.rows) {
      const workflowId = workflow.id as number;
      const workflowNodes = nodes.rows.filter((row) => row.workflow_id === workflowId);
      const workflowConnections = connections.rows.filter((row) => row.workflow_id === workflowId);
      const workflowExecutions = executions.rows
        .filter((row) => row.workflow_id === workflowId)
        .slice(0, args.executionsPerWorkflow);

      const document = {
        _warning: "Local read-only export. May contain user content. Do not commit.",
        name: `workflow-${workflowId}`,
        workflow: {
          id: workflowId,
          name: workflow.name,
          description: workflow.description,
          status: workflow.status,
        },
        nodes: workflowNodes.map((row) => ({
          id: row.id,
          type: row.type,
          label: row.label,
          entryType: row.entry_type,
          position: { x: row.position_x, y: row.position_y },
          config: redactConfig(row.config as string | null),
        })),
        connections: workflowConnections.map((row) => ({
          id: String(row.id),
          fromNodeId: row.from_node_id,
          toNodeId: row.to_node_id,
          sourceHandle: row.source_handle,
          targetHandle: row.target_handle,
        })),
        executions: workflowExecutions.map((row) => ({
          id: row.id,
          status: row.status,
          startedAt: row.started_at,
          inputData: redact(parseJson(row.input_data as string | null)),
          outputData: redact(parseJson(row.output_data as string | null)),
        })),
      };

      const file = `workflow-${workflowId}.json`;
      writeFileSync(path.join(args.out, file), `${JSON.stringify(document, null, 2)}\n`);
      index.push({ file, workflowId, status: String(workflow.status) });
    }

    writeFileSync(
      path.join(args.out, "_index.json"),
      `${JSON.stringify({ warning: "Do not commit this directory.", workflows: index }, null, 2)}\n`,
    );
    console.log(`wrote ${index.length} workflow(s) to ${args.out}`);
    console.log("export is gitignored and may contain user content; do not commit it");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
