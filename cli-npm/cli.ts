#!/usr/bin/env node
/**
 * @zeitflow/cli — manage ZeitFlow workflows from your terminal.
 *
 * Thin HTTP client over the ZeitFlow API. No proprietary code — just
 * authenticated requests to the public API.
 *
 * Config resolution (same as @zeitflow/mcp):
 *   Token: ZEITFLOW_API_TOKEN env → ~/.zeitflow/config.json → prompt
 *   URL:   ZEITFLOW_URL env       → ~/.zeitflow/config.json → https://www.zeitflow.io
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { createInterface } from "readline";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface ZeitFlowConfig {
  token?: string;
  url?: string;
}

const CONFIG_DIR = join(homedir(), ".zeitflow");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");
const DEFAULT_URL = "https://www.zeitflow.io";

function loadConfig(): ZeitFlowConfig {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function saveConfig(config: ZeitFlowConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", {
    mode: 0o600,
  });
}

function getToken(): string | undefined {
  return process.env.ZEITFLOW_API_TOKEN || loadConfig().token;
}

function requireToken(): string {
  const token = getToken();
  if (!token) {
    error(
      "Not authenticated. Run: zeitflow auth login\n" +
        "Or set ZEITFLOW_API_TOKEN env var."
    );
  }
  return token!;
}

function getBaseUrl(): string {
  return (
    process.env.ZEITFLOW_URL || loadConfig().url || DEFAULT_URL
  ).replace(/\/$/, "");
}

// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------

async function api(
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> {
  const token = requireToken();
  const url = `${getBaseUrl()}${path}`;
  const opts: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const resp = await fetch(url, opts);
  const text = await resp.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!resp.ok) {
    const msg =
      typeof data === "object" && data && "message" in data
        ? (data as { message: string }).message
        : text;
    error(`API error (${resp.status}): ${msg}`);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

let outputJson = false;

function print(msg: string): void {
  console.log(msg);
}

function printSuccess(msg: string): void {
  console.log(`✓ ${msg}`);
}

function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

function printTable(
  headers: string[],
  rows: string[][]
): void {
  if (rows.length === 0) {
    print("  (none)");
    return;
  }
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] || "").length))
  );
  print(headers.map((h, i) => h.padEnd(widths[i])).join("  "));
  print(widths.map((w) => "─".repeat(w)).join("  "));
  for (const row of rows) {
    print(row.map((c, i) => (c || "").padEnd(widths[i])).join("  "));
  }
}

function error(msg: string): never {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Readline helper
// ---------------------------------------------------------------------------

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ---------------------------------------------------------------------------
// Commands: auth
// ---------------------------------------------------------------------------

async function authLogin(args: string[]): Promise<void> {
  const tokenIdx = args.indexOf("--token");
  let token =
    tokenIdx !== -1 && args[tokenIdx + 1] ? args[tokenIdx + 1] : undefined;

  if (!token) {
    const baseUrl = getBaseUrl();
    const connectUrl = `${baseUrl}/connect`;
    console.error(`Opening ${connectUrl} in your browser...`);
    console.error("(If it doesn't open, visit the URL manually)\n");

    // Try to open browser
    try {
      const { exec } = await import("child_process");
      const cmd =
        process.platform === "darwin"
          ? "open"
          : process.platform === "win32"
            ? "start"
            : "xdg-open";
      exec(`${cmd} ${connectUrl}`);
    } catch {
      /* ignore */
    }

    token = await prompt("Paste your API token: ");
    if (!token) error("No token provided.");
  }

  // Validate
  const resp = await fetch(`${getBaseUrl()}/api/workflows`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (resp.status === 401) {
    error(`Invalid token. Check your token at ${getBaseUrl()}/connect`);
  }
  if (!resp.ok) {
    error(`API returned status ${resp.status}. Is the server reachable?`);
  }

  const config = loadConfig();
  config.token = token;
  saveConfig(config);

  if (outputJson) {
    printJson({ success: true, message: "Authenticated" });
  } else {
    printSuccess(
      "Authenticated. Token saved to ~/.zeitflow/config.json"
    );
    console.error("\nTip: Run `zeitflow setup mcp` to configure your IDE.");
  }
}

async function authLogout(): Promise<void> {
  const config = loadConfig();
  delete config.token;
  saveConfig(config);
  if (outputJson) {
    printJson({ success: true });
  } else {
    printSuccess("Logged out. Token removed.");
  }
}

async function authStatus(): Promise<void> {
  const config = loadConfig();
  const authenticated = !!config.token;
  const url = getBaseUrl();

  if (outputJson) {
    printJson({ authenticated, url });
  } else {
    print(`API URL: ${url}`);
    print(`Status:  ${authenticated ? "authenticated" : "not authenticated"}`);
  }
}

// ---------------------------------------------------------------------------
// Commands: workflow
// ---------------------------------------------------------------------------

async function workflowList(args: string[]): Promise<void> {
  const statusIdx = args.indexOf("--status");
  const status = statusIdx !== -1 ? args[statusIdx + 1] : undefined;
  const path = status ? `/api/workflows?status=${status}` : "/api/workflows";
  const data = (await api("GET", path)) as {
    workflows?: Array<Record<string, unknown>>;
  };
  const workflows = data.workflows || [];

  if (outputJson) {
    printJson(data);
  } else {
    const rows = workflows.map((w) => [
      String(w.id),
      String(w.name || "(unnamed)"),
      String(w.status || "unknown"),
      String(w.executionCount ?? 0),
    ]);
    printTable(["ID", "NAME", "STATUS", "RUNS"], rows);
  }
}

async function workflowGet(id: string): Promise<void> {
  const data = await api("GET", `/api/workflow/${id}`);
  printJson(data);
}

async function workflowCreate(args: string[]): Promise<void> {
  const nameIdx = args.indexOf("--name");
  const descIdx = args.indexOf("--description");
  const name = nameIdx !== -1 ? args[nameIdx + 1] : undefined;
  const description = descIdx !== -1 ? args[descIdx + 1] : undefined;

  if (!name) error("--name is required");

  const body: Record<string, string> = { name };
  if (description) body.description = description;

  const data = (await api("POST", "/api/workflows", body)) as {
    workflow?: { id: number };
  };

  if (outputJson) {
    printJson(data);
  } else {
    const id = data.workflow?.id;
    printSuccess(`Workflow created (id: ${id})`);
  }
}

async function workflowDelete(id: string): Promise<void> {
  const data = await api("DELETE", `/api/workflow/${id}`);
  if (outputJson) {
    printJson(data);
  } else {
    printSuccess(`Workflow ${id} deleted`);
  }
}

async function workflowRun(id: string, args: string[]): Promise<void> {
  const inputIdx = args.indexOf("--input");
  const inputStr = inputIdx !== -1 ? args[inputIdx + 1] : undefined;
  const entryIdx = args.indexOf("--entry-node");
  const entryNode = entryIdx !== -1 ? args[entryIdx + 1] : undefined;

  const body: Record<string, unknown> = {};
  if (inputStr) {
    try {
      body.inputData = JSON.parse(inputStr);
    } catch {
      error("Invalid JSON for --input");
    }
  }
  if (entryNode) body.entryNodeId = entryNode;

  const data = (await api("POST", `/api/workflow/${id}/execute`, body)) as {
    success?: boolean;
    executionId?: number;
  };

  if (outputJson) {
    printJson(data);
  } else if (data.success) {
    printSuccess(`Execution started (id: ${data.executionId})`);
    print(`  View: zeitflow execution get ${data.executionId}`);
  } else {
    error("Execution failed to start");
  }
}

async function workflowPublish(id: string, args: string[]): Promise<void> {
  const statusIdx = args.indexOf("--status");
  const status = statusIdx !== -1 ? args[statusIdx + 1] : "published";
  const valid = ["draft", "published", "archived"];
  if (!valid.includes(status)) {
    error(`Invalid status '${status}'. Must be one of: ${valid.join(", ")}`);
  }

  const data = await api("PUT", `/api/workflow/${id}`, { status });
  if (outputJson) {
    printJson(data);
  } else {
    printSuccess(`Workflow ${id} status changed to '${status}'`);
  }
}

// ---------------------------------------------------------------------------
// Commands: execution
// ---------------------------------------------------------------------------

async function executionList(args: string[]): Promise<void> {
  const wfIdx = args.indexOf("--workflow");
  const workflowId = wfIdx !== -1 ? args[wfIdx + 1] : undefined;
  if (!workflowId) error("--workflow is required");

  const data = (await api(
    "GET",
    `/api/workflow/${workflowId}/stats`
  )) as Record<string, unknown>;

  if (outputJson) {
    printJson(data);
  } else {
    const executions = (
      (data.executions as unknown[]) ||
      (data.recentExecutions as unknown[]) ||
      []
    ) as Array<Record<string, unknown>>;

    if (executions.length === 0) {
      print(`Workflow ${workflowId} stats:`);
      if (data.totalExecutions !== undefined)
        print(`  Total executions: ${data.totalExecutions}`);
      if (data.completedExecutions !== undefined)
        print(`  Completed: ${data.completedExecutions}`);
      if (data.failedExecutions !== undefined)
        print(`  Failed: ${data.failedExecutions}`);
    } else {
      const rows = executions.map((e) => [
        String(e.id),
        String(e.status || "unknown"),
        String(e.createdAt || e.startedAt || ""),
      ]);
      printTable(["ID", "STATUS", "STARTED"], rows);
    }
  }
}

async function executionGet(id: string): Promise<void> {
  const data = (await api("GET", `/api/workflow/execution/${id}`)) as Record<
    string,
    unknown
  >;

  if (outputJson) {
    printJson(data);
    return;
  }

  const exec = (data.execution || data) as Record<string, unknown>;
  print(`Execution #${id}  status: ${exec.status || "unknown"}`);

  const wf = data.workflow as Record<string, unknown> | undefined;
  if (wf) print(`Workflow: ${wf.name || "?"}`);

  if (exec.inputData && exec.inputData !== null) {
    print(`\nInput:\n  ${JSON.stringify(exec.inputData, null, 2)}`);
  }
  if (exec.outputData && exec.outputData !== null) {
    print(`\nOutput:\n  ${JSON.stringify(exec.outputData, null, 2)}`);
  }
  if (exec.error && exec.error !== null) {
    print(`\nError: ${exec.error}`);
  }

  const logs = Array.isArray(exec.logs) ? exec.logs.length : 0;
  if (logs > 0) {
    print(`\n${logs} log entries. Run: zeitflow execution logs ${id}`);
  }
}

async function executionLogs(id: string, args: string[]): Promise<void> {
  const levelIdx = args.indexOf("--level");
  const level = levelIdx !== -1 ? args[levelIdx + 1] : undefined;
  const nodeIdx = args.indexOf("--node");
  const node = nodeIdx !== -1 ? args[nodeIdx + 1] : undefined;

  const data = (await api("GET", `/api/workflow/execution/${id}`)) as Record<
    string,
    unknown
  >;
  const exec = (data.execution || data) as Record<string, unknown>;
  const allLogs = (exec.logs as Array<Record<string, unknown>>) || [];

  const filtered = allLogs.filter((log) => {
    if (level && log.level !== level) return false;
    if (node && log.nodeId !== node) return false;
    return true;
  });

  if (outputJson) {
    printJson(filtered);
    return;
  }

  if (filtered.length === 0) {
    print("  (no logs matching filter)");
    return;
  }

  for (const log of filtered) {
    const ts = log.timestamp || "";
    const lvl = `[${log.level || "info"}]`;
    const nid = `[${log.nodeId || "?"}]`;
    const msg = log.message || "";
    print(`${ts} ${lvl.padEnd(7)} ${nid} ${msg}`);
    if (log.data && log.data !== null) {
      print(`         ${JSON.stringify(log.data)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Commands: setup mcp
// ---------------------------------------------------------------------------

interface McpClientMeta {
  id: string;
  label: string;
  path: string | null;
}

const MCP_CLIENTS: McpClientMeta[] = [
  {
    id: "claude-desktop",
    label: "Claude Desktop",
    path:
      process.platform === "darwin"
        ? join(
            homedir(),
            "Library",
            "Application Support",
            "Claude",
            "claude_desktop_config.json"
          )
        : process.platform === "win32"
          ? join(
              process.env.APPDATA || "",
              "Claude",
              "claude_desktop_config.json"
            )
          : join(homedir(), ".config", "Claude", "claude_desktop_config.json"),
  },
  { id: "claude-code", label: "Claude Code", path: ".mcp.json" },
  {
    id: "cursor",
    label: "Cursor",
    path: join(homedir(), ".cursor", "mcp.json"),
  },
  { id: "vscode", label: "VS Code", path: join(".vscode", "mcp.json") },
  {
    id: "windsurf",
    label: "Windsurf",
    path: join(homedir(), ".codeium", "windsurf", "mcp_config.json"),
  },
];

async function setupMcp(args: string[]): Promise<void> {
  const token = requireToken();
  const baseUrl = getBaseUrl();
  const mcpUrl = `${baseUrl}/api/mcp`;

  const clientIdx = args.indexOf("--client");
  let clientId = clientIdx !== -1 ? args[clientIdx + 1] : undefined;
  const save = args.includes("--save");

  if (!clientId) {
    // Interactive prompt
    console.error("Select a client:\n");
    MCP_CLIENTS.forEach((c, i) =>
      console.error(`  ${i + 1}. ${c.label}`)
    );
    console.error();
    const choice = await prompt(`Enter number (1-${MCP_CLIENTS.length}): `);
    const idx = parseInt(choice, 10) - 1;
    if (idx < 0 || idx >= MCP_CLIENTS.length) error("Invalid selection");
    clientId = MCP_CLIENTS[idx].id;
  }

  const client = MCP_CLIENTS.find((c) => c.id === clientId);
  if (!client) {
    error(
      `Unknown client '${clientId}'. Options: ${MCP_CLIENTS.map((c) => c.id).join(", ")}`
    );
  }

  const zeitflowEntry = {
    serverUrl: mcpUrl,
    headers: { Authorization: `Bearer ${token}` },
  };
  const fullConfig = { mcpServers: { zeitflow: zeitflowEntry } };

  const cliCmd =
    client.id === "claude-code"
      ? `claude mcp add zeitflow --transport http "${mcpUrl}" --header "Authorization: Bearer ${token}"`
      : undefined;

  if (outputJson) {
    const result: Record<string, unknown> = {
      client: client.label,
      config: fullConfig,
      saved: false,
    };
    if (client.path) result.file_path = client.path;
    if (cliCmd) result.cli_command = cliCmd;
    if (save && client.path) {
      mergeAndSave(client.path, zeitflowEntry);
      result.saved = true;
    }
    printJson(result);
    return;
  }

  print(`\nMCP config for ${client.label}:\n`);
  print(JSON.stringify(fullConfig, null, 2));

  if (client.path) print(`\nConfig file: ${client.path}`);
  if (cliCmd) print(`\nOr run this command instead:\n  ${cliCmd}`);

  if (save && client.path) {
    mergeAndSave(client.path, zeitflowEntry);
    printSuccess(`Saved to ${client.path}`);
  } else if (client.path) {
    print("\nRe-run with --save to write automatically.");
  }
}

function mergeAndSave(
  filePath: string,
  zeitflowEntry: Record<string, unknown>
): void {
  let root: Record<string, unknown> = {};
  if (existsSync(filePath)) {
    try {
      root = JSON.parse(readFileSync(filePath, "utf-8"));
    } catch {
      root = {};
    }
  }
  if (typeof root !== "object" || root === null) root = {};
  if (!root.mcpServers || typeof root.mcpServers !== "object") {
    root.mcpServers = {};
  }
  (root.mcpServers as Record<string, unknown>).zeitflow = zeitflowEntry;

  const dir = join(filePath, "..");
  if (dir && dir !== ".") mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, JSON.stringify(root, null, 2) + "\n");
}

// ---------------------------------------------------------------------------
// Commands: doctor
// ---------------------------------------------------------------------------

interface DoctorCheck {
  check: string;
  status: "ok" | "warn" | "fail";
  detail: string;
}

async function doctor(): Promise<void> {
  const checks: DoctorCheck[] = [];

  // 1. Config file
  if (existsSync(CONFIG_PATH)) {
    checks.push({ check: "Config file", status: "ok", detail: CONFIG_PATH });
  } else {
    checks.push({
      check: "Config file",
      status: "warn",
      detail: `Not found at ${CONFIG_PATH}. Run: zeitflow auth login`,
    });
  }

  // 2. Config permissions (unix)
  if (existsSync(CONFIG_PATH) && process.platform !== "win32") {
    try {
      const { statSync } = await import("fs");
      const stat = statSync(CONFIG_PATH);
      const mode = stat.mode & 0o777;
      if (mode === 0o600) {
        checks.push({
          check: "Config permissions",
          status: "ok",
          detail: "0600 (owner read/write only)",
        });
      } else {
        checks.push({
          check: "Config permissions",
          status: "warn",
          detail: `0${mode.toString(8)} — expected 0600. Run: chmod 600 ~/.zeitflow/config.json`,
        });
      }
    } catch {
      checks.push({
        check: "Config permissions",
        status: "warn",
        detail: "Could not read file metadata",
      });
    }
  }

  // 3. Auth token
  const token = getToken();
  if (token) {
    checks.push({ check: "Auth token", status: "ok", detail: "Token configured" });
  } else {
    checks.push({
      check: "Auth token",
      status: "fail",
      detail: "No token found. Run: zeitflow auth login",
    });
  }

  // 4. API reachable
  const baseUrl = getBaseUrl();
  try {
    const resp = await fetch(`${baseUrl}/api/workflows`, {
      method: "HEAD",
      signal: AbortSignal.timeout(10_000),
    });
    checks.push({
      check: "API reachable",
      status: "ok",
      detail: `${baseUrl} (HTTP ${resp.status})`,
    });
  } catch (e) {
    checks.push({
      check: "API reachable",
      status: "fail",
      detail: `${baseUrl} — ${e instanceof Error ? e.message : "connection failed"}`,
    });
  }

  // 5. Token validity (only if token is present)
  if (token) {
    try {
      const resp = await fetch(`${baseUrl}/api/workflows`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10_000),
      });
      if (resp.status === 401) {
        checks.push({
          check: "Token valid",
          status: "fail",
          detail: `Token rejected (401). Generate a new one at ${baseUrl}/connect`,
        });
      } else if (resp.ok) {
        checks.push({
          check: "Token valid",
          status: "ok",
          detail: "Authenticated successfully",
        });
      } else {
        checks.push({
          check: "Token valid",
          status: "warn",
          detail: `Unexpected status: ${resp.status}`,
        });
      }
    } catch (e) {
      checks.push({
        check: "Token valid",
        status: "fail",
        detail: `Request failed: ${e instanceof Error ? e.message : e}`,
      });
    }
  }

  // Output
  if (outputJson) {
    printJson({
      checks,
      ok: checks.every((c) => c.status === "ok"),
    });
    return;
  }

  print("ZeitFlow Doctor");
  print("═".repeat(40));
  print("");

  for (const c of checks) {
    const icon =
      c.status === "ok" ? "✓" : c.status === "warn" ? "!" : "✗";
    print(`${icon} ${c.check}: ${c.detail}`);
  }

  print("");
  const fails = checks.filter((c) => c.status === "fail").length;
  const warns = checks.filter((c) => c.status === "warn").length;
  if (fails > 0) {
    print(`${fails} issue(s) found. See above for details.`);
  } else if (warns > 0) {
    print(`All checks passed with ${warns} warning(s).`);
  } else {
    print("All checks passed.");
  }
}

// ---------------------------------------------------------------------------
// CLI router
// ---------------------------------------------------------------------------

const HELP = `
zeitflow — CLI for ZeitFlow workflow automation

USAGE
  zeitflow <command> [subcommand] [options]

COMMANDS
  auth login [--token <t>]            Authenticate (opens browser)
  auth logout                         Remove stored credentials
  auth status                         Show auth status

  workflow list [--status <s>]        List workflows
  workflow get <id>                   Get workflow details (JSON)
  workflow create --name <n>          Create a workflow
  workflow delete <id>                Delete a workflow
  workflow run <id> [--input <json>]  Execute a workflow
  workflow publish <id> [--status s]  Change workflow status

  execution list --workflow <id>      List executions
  execution get <id>                  Get execution details
  execution logs <id> [--level l]     View execution logs

  setup mcp [--client <c>] [--save]  Generate MCP config for your IDE

  doctor                             Check CLI config and connectivity

OPTIONS
  --output json    Output JSON instead of text (works with all commands)
  --help           Show this help
  --version        Show version
`.trim();

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Global flags
  if (args.includes("--output") && args[args.indexOf("--output") + 1] === "json") {
    outputJson = true;
  }
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    print(HELP);
    return;
  }
  if (args.includes("--version") || args.includes("-v")) {
    print("zeitflow 0.1.0");
    return;
  }

  const [cmd, sub, ...rest] = args.filter(
    (a, i) =>
      a !== "--output" &&
      !(args[i - 1] === "--output") &&
      a !== "json"
  );

  switch (cmd) {
    case "auth":
      switch (sub) {
        case "login":
          return authLogin(rest);
        case "logout":
          return authLogout();
        case "status":
          return authStatus();
        default:
          error(`Unknown auth command: ${sub}\nRun: zeitflow auth login`);
      }
      break;

    case "workflow":
    case "wf":
      switch (sub) {
        case "list":
        case "ls":
          return workflowList(rest);
        case "get":
          if (!rest[0]) error("Usage: zeitflow workflow get <id>");
          return workflowGet(rest[0]);
        case "create":
          return workflowCreate(rest);
        case "delete":
        case "rm":
          if (!rest[0]) error("Usage: zeitflow workflow delete <id>");
          return workflowDelete(rest[0]);
        case "run":
        case "execute":
          if (!rest[0]) error("Usage: zeitflow workflow run <id>");
          return workflowRun(rest[0], rest.slice(1));
        case "publish":
          if (!rest[0]) error("Usage: zeitflow workflow publish <id>");
          return workflowPublish(rest[0], rest.slice(1));
        default:
          error(
            `Unknown workflow command: ${sub}\nRun: zeitflow workflow list`
          );
      }
      break;

    case "execution":
    case "exec":
      switch (sub) {
        case "list":
        case "ls":
          return executionList(rest);
        case "get":
          if (!rest[0]) error("Usage: zeitflow execution get <id>");
          return executionGet(rest[0]);
        case "logs":
          if (!rest[0]) error("Usage: zeitflow execution logs <id>");
          return executionLogs(rest[0], rest.slice(1));
        default:
          error(
            `Unknown execution command: ${sub}\nRun: zeitflow execution list --workflow <id>`
          );
      }
      break;

    case "setup":
      if (sub === "mcp") return setupMcp(rest);
      error(`Unknown setup command: ${sub}\nRun: zeitflow setup mcp`);
      break;

    case "doctor":
      return doctor();

    default:
      error(`Unknown command: ${cmd}\nRun: zeitflow --help`);
  }
}

main().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
