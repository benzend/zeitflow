#!/usr/bin/env node
"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const readline_1 = require("readline");
const CONFIG_DIR = (0, path_1.join)((0, os_1.homedir)(), ".zeitflow");
const CONFIG_PATH = (0, path_1.join)(CONFIG_DIR, "config.json");
const DEFAULT_URL = "https://www.zeitflow.io";
function loadConfig() {
    try {
        return JSON.parse((0, fs_1.readFileSync)(CONFIG_PATH, "utf-8"));
    }
    catch {
        return {};
    }
}
function saveConfig(config) {
    (0, fs_1.mkdirSync)(CONFIG_DIR, { recursive: true, mode: 0o700 });
    (0, fs_1.writeFileSync)(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", {
        mode: 0o600,
    });
}
function getToken() {
    return process.env.ZEITFLOW_API_TOKEN || loadConfig().token;
}
function requireToken() {
    const token = getToken();
    if (!token) {
        error("Not authenticated. Run: zeitflow auth login\n" +
            "Or set ZEITFLOW_API_TOKEN env var.");
    }
    return token;
}
function getBaseUrl() {
    return (process.env.ZEITFLOW_URL || loadConfig().url || DEFAULT_URL).replace(/\/$/, "");
}
// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------
async function api(method, path, body) {
    const token = requireToken();
    const url = `${getBaseUrl()}${path}`;
    const opts = {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    };
    if (body !== undefined)
        opts.body = JSON.stringify(body);
    const resp = await fetch(url, opts);
    const text = await resp.text();
    let data;
    try {
        data = JSON.parse(text);
    }
    catch {
        data = text;
    }
    if (!resp.ok) {
        const msg = typeof data === "object" && data && "message" in data
            ? data.message
            : text;
        error(`API error (${resp.status}): ${msg}`);
    }
    return data;
}
// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------
let outputJson = false;
function print(msg) {
    console.log(msg);
}
function printSuccess(msg) {
    console.log(`✓ ${msg}`);
}
function printJson(data) {
    console.log(JSON.stringify(data, null, 2));
}
function printTable(headers, rows) {
    if (rows.length === 0) {
        print("  (none)");
        return;
    }
    const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => (r[i] || "").length)));
    print(headers.map((h, i) => h.padEnd(widths[i])).join("  "));
    print(widths.map((w) => "─".repeat(w)).join("  "));
    for (const row of rows) {
        print(row.map((c, i) => (c || "").padEnd(widths[i])).join("  "));
    }
}
function error(msg) {
    console.error(`Error: ${msg}`);
    process.exit(1);
}
// ---------------------------------------------------------------------------
// Readline helper
// ---------------------------------------------------------------------------
function prompt(question) {
    const rl = (0, readline_1.createInterface)({ input: process.stdin, output: process.stderr });
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
async function authLogin(args) {
    const tokenIdx = args.indexOf("--token");
    let token = tokenIdx !== -1 && args[tokenIdx + 1] ? args[tokenIdx + 1] : undefined;
    if (!token) {
        const baseUrl = getBaseUrl();
        const connectUrl = `${baseUrl}/connect`;
        console.error(`Opening ${connectUrl} in your browser...`);
        console.error("(If it doesn't open, visit the URL manually)\n");
        // Try to open browser
        try {
            const { exec } = await import("child_process");
            const cmd = process.platform === "darwin"
                ? "open"
                : process.platform === "win32"
                    ? "start"
                    : "xdg-open";
            exec(`${cmd} ${connectUrl}`);
        }
        catch {
            /* ignore */
        }
        token = await prompt("Paste your API token: ");
        if (!token)
            error("No token provided.");
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
    }
    else {
        printSuccess("Authenticated. Token saved to ~/.zeitflow/config.json");
        console.error("\nTip: Run `zeitflow setup mcp` to configure your IDE.");
    }
}
async function authLogout() {
    const config = loadConfig();
    delete config.token;
    saveConfig(config);
    if (outputJson) {
        printJson({ success: true });
    }
    else {
        printSuccess("Logged out. Token removed.");
    }
}
async function authStatus() {
    const config = loadConfig();
    const authenticated = !!config.token;
    const url = getBaseUrl();
    if (outputJson) {
        printJson({ authenticated, url });
    }
    else {
        print(`API URL: ${url}`);
        print(`Status:  ${authenticated ? "authenticated" : "not authenticated"}`);
    }
}
// ---------------------------------------------------------------------------
// Commands: workflow
// ---------------------------------------------------------------------------
async function workflowList(args) {
    const statusIdx = args.indexOf("--status");
    const status = statusIdx !== -1 ? args[statusIdx + 1] : undefined;
    const path = status ? `/api/workflows?status=${status}` : "/api/workflows";
    const data = (await api("GET", path));
    const workflows = data.workflows || [];
    if (outputJson) {
        printJson(data);
    }
    else {
        const rows = workflows.map((w) => [
            String(w.id),
            String(w.name || "(unnamed)"),
            String(w.status || "unknown"),
            String(w.executionCount ?? 0),
        ]);
        printTable(["ID", "NAME", "STATUS", "RUNS"], rows);
    }
}
async function workflowGet(id) {
    const data = await api("GET", `/api/workflow/${id}`);
    printJson(data);
}
async function workflowCreate(args) {
    const nameIdx = args.indexOf("--name");
    const descIdx = args.indexOf("--description");
    const name = nameIdx !== -1 ? args[nameIdx + 1] : undefined;
    const description = descIdx !== -1 ? args[descIdx + 1] : undefined;
    if (!name)
        error("--name is required");
    const body = { name };
    if (description)
        body.description = description;
    const data = (await api("POST", "/api/workflows", body));
    if (outputJson) {
        printJson(data);
    }
    else {
        const id = data.workflow?.id;
        printSuccess(`Workflow created (id: ${id})`);
    }
}
async function workflowDelete(id) {
    const data = await api("DELETE", `/api/workflow/${id}`);
    if (outputJson) {
        printJson(data);
    }
    else {
        printSuccess(`Workflow ${id} deleted`);
    }
}
async function workflowRun(id, args) {
    const inputIdx = args.indexOf("--input");
    const inputStr = inputIdx !== -1 ? args[inputIdx + 1] : undefined;
    const entryIdx = args.indexOf("--entry-node");
    const entryNode = entryIdx !== -1 ? args[entryIdx + 1] : undefined;
    const body = {};
    if (inputStr) {
        try {
            body.inputData = JSON.parse(inputStr);
        }
        catch {
            error("Invalid JSON for --input");
        }
    }
    if (entryNode)
        body.entryNodeId = entryNode;
    const data = (await api("POST", `/api/workflow/${id}/execute`, body));
    if (outputJson) {
        printJson(data);
    }
    else if (data.success) {
        printSuccess(`Execution started (id: ${data.executionId})`);
        print(`  View: zeitflow execution get ${data.executionId}`);
    }
    else {
        error("Execution failed to start");
    }
}
async function workflowPublish(id, args) {
    const statusIdx = args.indexOf("--status");
    const status = statusIdx !== -1 ? args[statusIdx + 1] : "published";
    const valid = ["draft", "published", "archived"];
    if (!valid.includes(status)) {
        error(`Invalid status '${status}'. Must be one of: ${valid.join(", ")}`);
    }
    const data = await api("PUT", `/api/workflow/${id}`, { status });
    if (outputJson) {
        printJson(data);
    }
    else {
        printSuccess(`Workflow ${id} status changed to '${status}'`);
    }
}
async function workflowStats(id) {
    const data = await api("GET", `/api/workflow/${id}/stats`);
    printJson(data);
}
// ---------------------------------------------------------------------------
// Node helpers
// ---------------------------------------------------------------------------
const VALID_NODE_TYPES = [
    "entry", "ai", "email", "slack", "sms", "telegram",
    "youtube", "condition", "scheduler", "review",
];
const ALL_CONFIG_KEYS = [
    "aiConfig", "schedulerConfig", "reviewConfig", "emailConfig",
    "slackConfig", "smsConfig", "telegramConfig", "conditionConfig",
    "youtubeConfig",
];
function remapNodeForSave(n) {
    const node = {
        id: n.id || "",
        type: n.type || "",
        label: n.label || "",
        x: n.x ?? n.positionX ?? 0,
        y: n.y ?? n.positionY ?? 0,
    };
    if (n.entryType)
        node.entryType = n.entryType;
    if (n.fields != null)
        node.fields = n.fields;
    // Parse config JSON string from GET response → spread keys into node
    if (typeof n.config === "string") {
        try {
            const parsed = JSON.parse(n.config);
            if (typeof parsed === "object" && parsed !== null) {
                for (const [k, v] of Object.entries(parsed)) {
                    node[k] = v;
                }
            }
        }
        catch { /* ignore */ }
    }
    // Copy inline config keys
    for (const key of ALL_CONFIG_KEYS) {
        if (n[key] != null)
            node[key] = n[key];
    }
    return node;
}
function remapConnectionForSave(c) {
    return {
        from: c.fromNodeId || c.from || "",
        to: c.toNodeId || c.to || "",
        sourceHandle: c.sourceHandle ?? null,
        targetHandle: c.targetHandle ?? null,
    };
}
function getArg(args, flag) {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : undefined;
}
// ---------------------------------------------------------------------------
// Commands: workflow node management
// ---------------------------------------------------------------------------
async function workflowAddNode(args) {
    const workflowId = getArg(args, "--workflow");
    const nodeType = getArg(args, "--type") || getArg(args, "--node-type");
    const label = getArg(args, "--label");
    const xStr = getArg(args, "--x");
    const yStr = getArg(args, "--y");
    const configStr = getArg(args, "--config");
    const entryType = getArg(args, "--entry-type");
    if (!workflowId)
        error("--workflow is required");
    if (!nodeType)
        error("--type is required");
    if (!label)
        error("--label is required");
    if (!VALID_NODE_TYPES.includes(nodeType)) {
        error(`Invalid node type '${nodeType}'. Must be one of: ${VALID_NODE_TYPES.join(", ")}`);
    }
    const x = xStr ? parseFloat(xStr) : 250;
    const y = yStr ? parseFloat(yStr) : 200;
    // Fetch existing workflow
    const existing = (await api("GET", `/api/workflow/${workflowId}`));
    const nodes = (existing.nodes || []).slice();
    const connections = existing.connections || [];
    // Generate node ID
    const nodeId = `${nodeType}_${Date.now()}`;
    const newNode = { id: nodeId, type: nodeType, x, y, label };
    if (nodeType === "entry") {
        newNode.entryType = entryType || "form";
    }
    if (configStr) {
        try {
            const cfg = JSON.parse(configStr);
            newNode[`${nodeType}Config`] = cfg;
        }
        catch {
            error("Invalid JSON for --config");
        }
    }
    nodes.push(newNode);
    const body = {
        nodes: nodes.map(remapNodeForSave),
        connections: connections.map(remapConnectionForSave),
    };
    const result = (await api("POST", `/api/workflow/${workflowId}`, body));
    if (outputJson) {
        printJson({ success: result.success ?? true, nodeId });
    }
    else {
        printSuccess(`Node '${label}' added (id: ${nodeId})`);
    }
}
async function workflowUpdateNode(args) {
    const workflowId = getArg(args, "--workflow");
    const nodeId = getArg(args, "--node");
    const newLabel = getArg(args, "--label");
    const newXStr = getArg(args, "--x");
    const newYStr = getArg(args, "--y");
    const newConfig = getArg(args, "--config");
    const newEntryType = getArg(args, "--entry-type");
    const newFields = getArg(args, "--fields");
    if (!workflowId)
        error("--workflow is required");
    if (!nodeId)
        error("--node is required");
    const existing = (await api("GET", `/api/workflow/${workflowId}`));
    const nodes = existing.nodes || [];
    const connections = existing.connections || [];
    const found = nodes.some((n) => n.id === nodeId);
    if (!found)
        error(`Node '${nodeId}' not found in workflow ${workflowId}`);
    const saveNodes = nodes.map((n) => {
        const remapped = remapNodeForSave(n);
        if (n.id === nodeId) {
            if (newLabel)
                remapped.label = newLabel;
            if (newXStr)
                remapped.x = parseFloat(newXStr);
            if (newYStr)
                remapped.y = parseFloat(newYStr);
            if (newEntryType)
                remapped.entryType = newEntryType;
            if (newFields) {
                try {
                    remapped.fields = JSON.parse(newFields);
                }
                catch {
                    error("Invalid JSON for --fields");
                }
            }
            if (newConfig) {
                try {
                    const cfg = JSON.parse(newConfig);
                    const configKey = `${n.type}Config`;
                    remapped[configKey] = cfg;
                }
                catch {
                    error("Invalid JSON for --config");
                }
            }
        }
        return remapped;
    });
    const body = {
        nodes: saveNodes,
        connections: connections.map(remapConnectionForSave),
    };
    const result = (await api("POST", `/api/workflow/${workflowId}`, body));
    if (outputJson) {
        printJson({ success: result.success ?? true, nodeId });
    }
    else {
        printSuccess(`Node '${nodeId}' updated`);
    }
}
async function workflowListNodes(id) {
    const data = (await api("GET", `/api/workflow/${id}`));
    const nodes = data.nodes || [];
    if (outputJson) {
        printJson(nodes);
    }
    else {
        const rows = nodes.map((n) => [
            String(n.id || "?"),
            String(n.type || "?"),
            String(n.label || "(unlabeled)"),
        ]);
        printTable(["ID", "TYPE", "LABEL"], rows);
    }
}
async function workflowRemoveNode(args) {
    const workflowId = getArg(args, "--workflow");
    const nodeId = getArg(args, "--node");
    if (!workflowId)
        error("--workflow is required");
    if (!nodeId)
        error("--node is required");
    const existing = (await api("GET", `/api/workflow/${workflowId}`));
    const nodes = existing.nodes || [];
    const connections = existing.connections || [];
    const saveNodes = nodes
        .filter((n) => n.id !== nodeId)
        .map(remapNodeForSave);
    const saveConnections = connections
        .filter((c) => {
        const from = (c.fromNodeId || c.from);
        const to = (c.toNodeId || c.to);
        return from !== nodeId && to !== nodeId;
    })
        .map(remapConnectionForSave);
    const result = await api("POST", `/api/workflow/${workflowId}`, {
        nodes: saveNodes,
        connections: saveConnections,
    });
    if (outputJson) {
        printJson(result);
    }
    else {
        printSuccess(`Node '${nodeId}' removed`);
    }
}
async function workflowConnect(args) {
    const workflowId = getArg(args, "--workflow");
    const from = getArg(args, "--from");
    const to = getArg(args, "--to");
    const sourceHandle = getArg(args, "--source-handle");
    if (!workflowId)
        error("--workflow is required");
    if (!from)
        error("--from is required");
    if (!to)
        error("--to is required");
    const existing = (await api("GET", `/api/workflow/${workflowId}`));
    const nodes = existing.nodes || [];
    const connections = (existing.connections || []).map(remapConnectionForSave);
    const newConn = { from, to };
    if (sourceHandle)
        newConn.sourceHandle = sourceHandle;
    connections.push(newConn);
    const result = await api("POST", `/api/workflow/${workflowId}`, {
        nodes: nodes.map(remapNodeForSave),
        connections,
    });
    if (outputJson) {
        printJson(result);
    }
    else {
        const arrow = sourceHandle ? `${from} --[${sourceHandle}]--> ${to}` : `${from} --> ${to}`;
        printSuccess(`Connected: ${arrow}`);
    }
}
// ---------------------------------------------------------------------------
// Commands: workflow validate
// ---------------------------------------------------------------------------
function labelToVarName(label) {
    let result = "";
    for (const ch of label) {
        if (/[a-zA-Z0-9]/.test(ch)) {
            result += ch.toLowerCase();
        }
        else if (result.length > 0 && !result.endsWith("_")) {
            result += "_";
        }
    }
    return result.replace(/_+$/, "");
}
function extractVarRefs(s) {
    const refs = [];
    let start = 0;
    while (true) {
        const open = s.indexOf("{{", start);
        if (open === -1)
            break;
        const close = s.indexOf("}}", open + 2);
        if (close === -1)
            break;
        const varName = s.slice(open + 2, close).trim();
        const root = varName.split(".")[0];
        if (root)
            refs.push([varName, root]);
        start = close + 2;
    }
    return refs;
}
async function workflowValidate(id) {
    const existing = (await api("GET", `/api/workflow/${id}`));
    const nodes = existing.nodes || [];
    const connections = existing.connections || [];
    const issues = [];
    if (nodes.length === 0) {
        issues.push({ level: "error", node: null, message: "Workflow has no nodes" });
        if (outputJson) {
            printJson({ valid: false, issueCount: 1, issues });
        }
        else {
            print("Found 1 issue(s): 1 error(s), 0 warning(s)\n");
            print("  ✗ [workflow] Workflow has no nodes");
        }
        return;
    }
    // Build lookups
    const nodeMap = new Map();
    const labelVarMap = new Map();
    for (const n of nodes) {
        const nid = String(n.id || "");
        nodeMap.set(nid, n);
        const label = String(n.label || nid);
        labelVarMap.set(nid, labelToVarName(label));
    }
    const allVarNames = new Set(labelVarMap.values());
    // Adjacency
    const incoming = new Map();
    const outgoing = new Map();
    for (const n of nodes) {
        const nid = String(n.id || "");
        incoming.set(nid, []);
        outgoing.set(nid, []);
    }
    for (const c of connections) {
        const from = String(c.fromNodeId || c.from || "");
        const to = String(c.toNodeId || c.to || "");
        if (from && to) {
            incoming.get(to)?.push(c);
            outgoing.get(from)?.push(c);
        }
    }
    // Entry points (no incoming)
    const entryNodes = nodes
        .map((n) => String(n.id || ""))
        .filter((nid) => (incoming.get(nid) || []).length === 0);
    if (entryNodes.length === 0) {
        issues.push({ level: "error", node: null, message: "No entry points found — all nodes have incoming connections (possible cycle)" });
    }
    // BFS reachability
    const reachable = new Set();
    const queue = [...entryNodes];
    while (queue.length > 0) {
        const cur = queue.shift();
        if (reachable.has(cur))
            continue;
        reachable.add(cur);
        for (const c of outgoing.get(cur) || []) {
            const to = String(c.toNodeId || c.to || "");
            if (to && !reachable.has(to))
                queue.push(to);
        }
    }
    // BFS ancestors
    const ancestorsOf = (nodeId) => {
        const visited = new Set();
        const q = [];
        for (const c of incoming.get(nodeId) || []) {
            const from = String(c.fromNodeId || c.from || "");
            if (from && !visited.has(from)) {
                visited.add(from);
                q.push(from);
            }
        }
        while (q.length > 0) {
            const cur = q.shift();
            for (const c of incoming.get(cur) || []) {
                const from = String(c.fromNodeId || c.from || "");
                if (from && !visited.has(from)) {
                    visited.add(from);
                    q.push(from);
                }
            }
        }
        return visited;
    };
    // Check each node
    for (const n of nodes) {
        const nid = String(n.id || "");
        const nodeType = String(n.type || "");
        const label = String(n.label || nid);
        const nodeLabel = `${label} (${nid})`;
        let config = {};
        if (typeof n.config === "string") {
            try {
                config = JSON.parse(n.config);
            }
            catch { /* */ }
        }
        if (!reachable.has(nid)) {
            issues.push({ level: "error", node: nodeLabel, message: "Node is unreachable from any entry point" });
            continue;
        }
        if (nodeType === "entry") {
            const fields = config.fields || [];
            if (fields.length === 0) {
                issues.push({ level: "error", node: nodeLabel, message: "Entry node has no input fields defined" });
            }
        }
        if (nodeType === "ai") {
            const aiCfg = (config.aiConfig || {});
            if (!aiCfg.userPrompt) {
                issues.push({ level: "error", node: nodeLabel, message: "AI node has no user prompt" });
            }
        }
        if (nodeType === "email") {
            const emailCfg = (config.emailConfig || {});
            const to = emailCfg.to;
            if (!to || !to.some((r) => typeof r === "string" && r.length > 0)) {
                issues.push({ level: "warning", node: nodeLabel, message: "Email node has no recipients — users will need to configure this" });
            }
        }
        if (nodeType === "condition") {
            const out = outgoing.get(nid) || [];
            if (out.length === 0) {
                issues.push({ level: "error", node: nodeLabel, message: "Condition node has no outgoing connections" });
            }
            else {
                for (const c of out) {
                    const handle = c.sourceHandle || "";
                    if (!handle) {
                        const toId = String(c.toNodeId || c.to || "?");
                        issues.push({ level: "error", node: nodeLabel, message: `Outgoing connection to ${toId} is missing sourceHandle ('true' or 'false')` });
                    }
                }
            }
        }
        // Variable reference validation
        const configJson = JSON.stringify(config);
        const varRefs = extractVarRefs(configJson);
        if (varRefs.length > 0) {
            const ancestors = ancestorsOf(nid);
            const ancestorVarNames = new Set();
            for (const aid of ancestors) {
                const vn = labelVarMap.get(aid);
                if (vn)
                    ancestorVarNames.add(vn);
            }
            for (const [fullRef, root] of varRefs) {
                if (!ancestorVarNames.has(root)) {
                    if (allVarNames.has(root)) {
                        issues.push({ level: "error", node: nodeLabel, message: `{{${fullRef}}} references node "${root}" which exists but is not an upstream ancestor` });
                    }
                    else {
                        issues.push({ level: "error", node: nodeLabel, message: `{{${fullRef}}} references unknown node "${root}" — no node with that label exists` });
                    }
                }
            }
            // Entry field reference check
            for (const [fullRef, root] of varRefs) {
                if (root === "entry") {
                    const fieldName = fullRef.replace(/^entry\./, "");
                    if (!fieldName)
                        continue;
                    for (const aid of ancestors) {
                        const ancestorNode = nodeMap.get(aid);
                        if (!ancestorNode || ancestorNode.type !== "entry")
                            continue;
                        let aCfg = {};
                        if (typeof ancestorNode.config === "string") {
                            try {
                                aCfg = JSON.parse(ancestorNode.config);
                            }
                            catch { /* */ }
                        }
                        const fields = aCfg.fields || [];
                        const fieldKeys = fields.map((f) => String(f.key || "")).filter(Boolean);
                        if (fieldKeys.length > 0 && !fieldKeys.includes(fieldName)) {
                            issues.push({ level: "error", node: nodeLabel, message: `{{${fullRef}}} references field "${fieldName}" but entry node only has fields: [${fieldKeys.join(", ")}]` });
                        }
                    }
                }
            }
        }
    }
    if (outputJson) {
        printJson({ valid: issues.length === 0, issueCount: issues.length, issues });
        return;
    }
    if (issues.length === 0) {
        printSuccess("Workflow is valid — no issues found");
    }
    else {
        const errors = issues.filter((i) => i.level === "error").length;
        const warnings = issues.filter((i) => i.level === "warning").length;
        print(`Found ${issues.length} issue(s): ${errors} error(s), ${warnings} warning(s)\n`);
        for (const issue of issues) {
            const icon = issue.level === "error" ? "✗" : "⚠";
            const nodeStr = issue.node || "workflow";
            print(`  ${icon} [${nodeStr}] ${issue.message}`);
        }
    }
}
// ---------------------------------------------------------------------------
// Commands: workflow generate
// ---------------------------------------------------------------------------
async function workflowGenerate(description, args) {
    const model = getArg(args, "--model") || "google/gemini-2.0-flash-001";
    const workflowId = getArg(args, "--workflow");
    const body = { prompt: description, model };
    if (workflowId)
        body.workflowId = parseInt(workflowId, 10);
    const result = (await api("POST", "/api/chat/workflow", body));
    if (outputJson) {
        printJson(result);
    }
    else {
        if (result.response)
            print(String(result.response));
        const proposed = result.proposedWorkflow;
        if (proposed) {
            const nodeCount = Array.isArray(proposed.nodes) ? proposed.nodes.length : 0;
            const connCount = Array.isArray(proposed.connections) ? proposed.connections.length : 0;
            print(`\nProposed workflow: ${nodeCount} nodes, ${connCount} connections`);
            print("Use --output json to see the full structure.");
        }
        if (result.threadId)
            print(`\nThread ID: ${result.threadId} (use to continue conversation)`);
    }
}
// ---------------------------------------------------------------------------
// Commands: template
// ---------------------------------------------------------------------------
async function templateList(args) {
    const category = getArg(args, "--category");
    const search = getArg(args, "--search");
    const visibility = getArg(args, "--visibility");
    const limit = getArg(args, "--limit") || "50";
    const params = [`limit=${limit}`];
    if (category)
        params.push(`category=${category}`);
    if (search)
        params.push(`search=${search}`);
    if (visibility)
        params.push(`visibility=${visibility}`);
    const data = (await api("GET", `/api/templates?${params.join("&")}`));
    if (outputJson) {
        printJson(data);
    }
    else {
        const templates = data.templates || [];
        const rows = templates.map((t) => [
            String(t.id),
            String(t.name || "(unnamed)"),
            String(t.category || ""),
            String(t.visibility || ""),
            String(t.useCount ?? 0),
        ]);
        printTable(["ID", "NAME", "CATEGORY", "VISIBILITY", "USES"], rows);
    }
}
async function templateGet(id) {
    const data = await api("GET", `/api/templates/${id}`);
    printJson(data);
}
async function templateUse(id, args) {
    const name = getArg(args, "--name");
    const body = {};
    if (name)
        body.workflowName = name;
    const data = (await api("POST", `/api/templates/${id}/use`, body));
    if (outputJson) {
        printJson(data);
    }
    else {
        const wf = data.workflow;
        const wfId = wf?.id;
        const wfName = wf?.name || "(unnamed)";
        printSuccess(`Workflow '${wfName}' created from template (id: ${wfId})`);
        print(`  Edit: zeitflow workflow get ${wfId}`);
    }
}
async function templateCreate(args) {
    const workflowId = getArg(args, "--workflow");
    const name = getArg(args, "--name");
    const category = getArg(args, "--category");
    const description = getArg(args, "--description");
    const visibility = getArg(args, "--visibility") || "private";
    const tags = getArg(args, "--tags");
    if (!workflowId)
        error("--workflow is required");
    if (!name)
        error("--name is required");
    if (!category)
        error("--category is required");
    const body = {
        sourceWorkflowId: parseInt(workflowId, 10),
        name,
        category,
        visibility,
    };
    if (description)
        body.description = description;
    if (tags)
        body.tags = tags.split(",").map((t) => t.trim());
    const data = (await api("POST", "/api/templates", body));
    if (outputJson) {
        printJson(data);
    }
    else {
        const tmpl = data.template;
        printSuccess(`Template '${name}' created (id: ${tmpl?.id})`);
    }
}
async function templateDelete(id) {
    const data = await api("DELETE", `/api/templates/${id}`);
    if (outputJson) {
        printJson(data);
    }
    else {
        printSuccess(`Template ${id} deleted`);
    }
}
const INTEGRATIONS = [
    { id: "email", name: "Email", description: "Send emails via Resend", category: "communication", configFields: ["to", "subject", "message", "from"], envVar: "RESEND_API_KEY" },
    { id: "slack", name: "Slack", description: "Send messages to Slack channels", category: "communication", configFields: ["botId", "channel", "message"], envVar: "(OAuth - user auth)" },
    { id: "sms", name: "SMS", description: "Send text messages via Twilio", category: "communication", configFields: ["to", "message", "twilioAccountSid", "twilioAuthToken", "twilioPhoneNumber"], envVar: "TWILIO_ACCOUNT_SID" },
    { id: "telegram", name: "Telegram", description: "Send messages to Telegram chats", category: "communication", configFields: ["chatId", "message", "botToken"], envVar: "TELEGRAM_BOT_TOKEN" },
    { id: "condition", name: "Condition", description: "Branch workflow based on a condition", category: "utility", configFields: ["leftValue", "operator", "rightValue"], envVar: "(none)" },
    { id: "youtube", name: "YouTube", description: "Fetch video data or post comments via YouTube API", category: "data", configFields: ["mode", "videoUrl", "commentText"], envVar: "(OAuth - user auth)" },
    { id: "discord", name: "Discord", description: "Send messages to Discord channels via webhook", category: "communication", configFields: ["webhookUrl", "message", "username"], envVar: "(none)" },
    { id: "http_request", name: "HTTP Request", description: "Make HTTP requests to any API endpoint", category: "utility", configFields: ["url", "method", "headers", "body", "authType", "authValue"], envVar: "(none)" },
    { id: "google_sheets", name: "Google Sheets", description: "Read and write data in Google Sheets", category: "data", configFields: ["mode", "spreadsheetId", "range", "values"], envVar: "(OAuth - user auth)" },
    { id: "github", name: "GitHub", description: "Create issues, comments, and manage GitHub repositories", category: "data", configFields: ["action", "repo", "title", "body", "token"], envVar: "GITHUB_TOKEN" },
    { id: "notion", name: "Notion", description: "Create pages, query databases, and manage Notion content", category: "data", configFields: ["action", "databaseId", "title", "content", "apiKey"], envVar: "NOTION_API_KEY" },
    { id: "airtable", name: "Airtable", description: "Read and write records in Airtable bases", category: "data", configFields: ["action", "baseId", "tableId", "recordId", "fields", "apiKey"], envVar: "AIRTABLE_API_KEY" },
    { id: "whatsapp", name: "WhatsApp", description: "Send WhatsApp messages via Twilio", category: "communication", configFields: ["to", "message", "twilioAccountSid", "twilioAuthToken", "twilioPhoneNumber"], envVar: "TWILIO_ACCOUNT_SID" },
    { id: "jira", name: "Jira", description: "Create and manage Jira issues", category: "data", configFields: ["action", "domain", "email", "apiToken", "projectKey", "issueKey", "summary", "description", "issueType", "priority", "transitionId", "comment", "jql"], envVar: "JIRA_API_TOKEN" },
    { id: "hubspot", name: "HubSpot", description: "Manage contacts and deals in HubSpot CRM", category: "data", configFields: ["action", "accessToken", "email", "firstName", "lastName", "phone", "company", "contactId", "dealName", "dealStage", "amount", "pipeline", "dealId", "searchQuery"], envVar: "HUBSPOT_ACCESS_TOKEN" },
    { id: "webhook", name: "Webhook", description: "Send data to any URL via outgoing webhook", category: "utility", configFields: ["url", "method", "headers", "bodyTemplate", "authType", "authValue", "retryOnFailure", "maxRetries"], envVar: "(none)" },
    { id: "linear", name: "Linear", description: "Create and manage Linear issues and projects", category: "data", configFields: ["action", "apiKey", "teamId", "title", "description", "issueId", "status", "priority", "assigneeId", "labelIds", "comment", "filterQuery"], envVar: "LINEAR_API_KEY" },
    { id: "google_drive", name: "Google Drive", description: "Upload, create, and share files in Google Drive", category: "data", configFields: ["action", "accessToken", "fileName", "fileContent", "mimeType", "folderId", "folderName", "fileId", "shareEmail", "shareRole", "query"], envVar: "GOOGLE_DRIVE_ACCESS_TOKEN" },
    { id: "stripe", name: "Stripe", description: "Create customers, invoices, and payment links via Stripe", category: "data", configFields: ["action", "secretKey", "email", "name", "description", "customerId", "amount", "currency", "invoiceDescription", "productName", "query", "limit"], envVar: "STRIPE_SECRET_KEY" },
    { id: "shopify", name: "Shopify", description: "Manage orders, products, and customers in Shopify", category: "data", configFields: ["action", "shopDomain", "accessToken", "orderId", "orderStatus", "productTitle", "productDescription", "productType", "productVendor", "variantPrice", "variantSku", "customerEmail", "customerFirstName", "customerLastName", "limit"], envVar: "SHOPIFY_ACCESS_TOKEN" },
];
async function integrationList() {
    if (outputJson) {
        printJson(INTEGRATIONS.map((i) => ({
            id: i.id, name: i.name, description: i.description, category: i.category,
        })));
    }
    else {
        const rows = INTEGRATIONS.map((i) => [i.id, i.name, i.category, i.description]);
        printTable(["ID", "NAME", "CATEGORY", "DESCRIPTION"], rows);
    }
}
async function integrationInfo(id) {
    const meta = INTEGRATIONS.find((i) => i.id === id);
    if (!meta)
        error(`Unknown integration: ${id}`);
    if (outputJson) {
        printJson({ id: meta.id, name: meta.name, description: meta.description, category: meta.category, configFields: meta.configFields, envVar: meta.envVar });
    }
    else {
        print(`${meta.name} (${meta.id})`);
        print(`  ${meta.description}`);
        print(`  Category: ${meta.category}`);
        print(`  Env var:  ${meta.envVar}`);
        print(`  Config fields:`);
        for (const field of meta.configFields) {
            print(`    - ${field}`);
        }
    }
}
// ---------------------------------------------------------------------------
// Commands: execution
// ---------------------------------------------------------------------------
async function executionList(args) {
    const wfIdx = args.indexOf("--workflow");
    const workflowId = wfIdx !== -1 ? args[wfIdx + 1] : undefined;
    if (!workflowId)
        error("--workflow is required");
    const data = (await api("GET", `/api/workflow/${workflowId}/stats`));
    if (outputJson) {
        printJson(data);
    }
    else {
        const executions = (data.executions ||
            data.recentExecutions ||
            []);
        if (executions.length === 0) {
            print(`Workflow ${workflowId} stats:`);
            if (data.totalExecutions !== undefined)
                print(`  Total executions: ${data.totalExecutions}`);
            if (data.completedExecutions !== undefined)
                print(`  Completed: ${data.completedExecutions}`);
            if (data.failedExecutions !== undefined)
                print(`  Failed: ${data.failedExecutions}`);
        }
        else {
            const rows = executions.map((e) => [
                String(e.id),
                String(e.status || "unknown"),
                String(e.createdAt || e.startedAt || ""),
            ]);
            printTable(["ID", "STATUS", "STARTED"], rows);
        }
    }
}
async function executionGet(id) {
    const data = (await api("GET", `/api/workflow/execution/${id}`));
    if (outputJson) {
        printJson(data);
        return;
    }
    const exec = (data.execution || data);
    print(`Execution #${id}  status: ${exec.status || "unknown"}`);
    const wf = data.workflow;
    if (wf)
        print(`Workflow: ${wf.name || "?"}`);
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
async function executionLogs(id, args) {
    const levelIdx = args.indexOf("--level");
    const level = levelIdx !== -1 ? args[levelIdx + 1] : undefined;
    const nodeIdx = args.indexOf("--node");
    const node = nodeIdx !== -1 ? args[nodeIdx + 1] : undefined;
    const data = (await api("GET", `/api/workflow/execution/${id}`));
    const exec = (data.execution || data);
    const allLogs = exec.logs || [];
    const filtered = allLogs.filter((log) => {
        if (level && log.level !== level)
            return false;
        if (node && log.nodeId !== node)
            return false;
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
const MCP_CLIENTS = [
    {
        id: "claude-desktop",
        label: "Claude Desktop",
        path: process.platform === "darwin"
            ? (0, path_1.join)((0, os_1.homedir)(), "Library", "Application Support", "Claude", "claude_desktop_config.json")
            : process.platform === "win32"
                ? (0, path_1.join)(process.env.APPDATA || "", "Claude", "claude_desktop_config.json")
                : (0, path_1.join)((0, os_1.homedir)(), ".config", "Claude", "claude_desktop_config.json"),
    },
    { id: "claude-code", label: "Claude Code", path: ".mcp.json" },
    {
        id: "cursor",
        label: "Cursor",
        path: (0, path_1.join)((0, os_1.homedir)(), ".cursor", "mcp.json"),
    },
    { id: "vscode", label: "VS Code", path: (0, path_1.join)(".vscode", "mcp.json") },
    {
        id: "windsurf",
        label: "Windsurf",
        path: (0, path_1.join)((0, os_1.homedir)(), ".codeium", "windsurf", "mcp_config.json"),
    },
];
async function setupMcp(args) {
    const token = requireToken();
    const baseUrl = getBaseUrl();
    const mcpUrl = `${baseUrl}/api/mcp`;
    const clientIdx = args.indexOf("--client");
    let clientId = clientIdx !== -1 ? args[clientIdx + 1] : undefined;
    const save = args.includes("--save");
    if (!clientId) {
        // Interactive prompt
        console.error("Select a client:\n");
        MCP_CLIENTS.forEach((c, i) => console.error(`  ${i + 1}. ${c.label}`));
        console.error();
        const choice = await prompt(`Enter number (1-${MCP_CLIENTS.length}): `);
        const idx = parseInt(choice, 10) - 1;
        if (idx < 0 || idx >= MCP_CLIENTS.length)
            error("Invalid selection");
        clientId = MCP_CLIENTS[idx].id;
    }
    const client = MCP_CLIENTS.find((c) => c.id === clientId);
    if (!client) {
        error(`Unknown client '${clientId}'. Options: ${MCP_CLIENTS.map((c) => c.id).join(", ")}`);
    }
    const zeitflowEntry = {
        serverUrl: mcpUrl,
        headers: { Authorization: `Bearer ${token}` },
    };
    const fullConfig = { mcpServers: { zeitflow: zeitflowEntry } };
    const cliCmd = client.id === "claude-code"
        ? `claude mcp add zeitflow --transport http "${mcpUrl}" --header "Authorization: Bearer ${token}"`
        : undefined;
    if (outputJson) {
        const result = {
            client: client.label,
            config: fullConfig,
            saved: false,
        };
        if (client.path)
            result.file_path = client.path;
        if (cliCmd)
            result.cli_command = cliCmd;
        if (save && client.path) {
            mergeAndSave(client.path, zeitflowEntry);
            result.saved = true;
        }
        printJson(result);
        return;
    }
    print(`\nMCP config for ${client.label}:\n`);
    print(JSON.stringify(fullConfig, null, 2));
    if (client.path)
        print(`\nConfig file: ${client.path}`);
    if (cliCmd)
        print(`\nOr run this command instead:\n  ${cliCmd}`);
    if (save && client.path) {
        mergeAndSave(client.path, zeitflowEntry);
        printSuccess(`Saved to ${client.path}`);
    }
    else if (client.path) {
        print("\nRe-run with --save to write automatically.");
    }
}
function mergeAndSave(filePath, zeitflowEntry) {
    let root = {};
    if ((0, fs_1.existsSync)(filePath)) {
        try {
            root = JSON.parse((0, fs_1.readFileSync)(filePath, "utf-8"));
        }
        catch {
            root = {};
        }
    }
    if (typeof root !== "object" || root === null)
        root = {};
    if (!root.mcpServers || typeof root.mcpServers !== "object") {
        root.mcpServers = {};
    }
    root.mcpServers.zeitflow = zeitflowEntry;
    const dir = (0, path_1.join)(filePath, "..");
    if (dir && dir !== ".")
        (0, fs_1.mkdirSync)(dir, { recursive: true });
    (0, fs_1.writeFileSync)(filePath, JSON.stringify(root, null, 2) + "\n");
}
async function doctor() {
    const checks = [];
    // 1. Config file
    if ((0, fs_1.existsSync)(CONFIG_PATH)) {
        checks.push({ check: "Config file", status: "ok", detail: CONFIG_PATH });
    }
    else {
        checks.push({
            check: "Config file",
            status: "warn",
            detail: `Not found at ${CONFIG_PATH}. Run: zeitflow auth login`,
        });
    }
    // 2. Config permissions (unix)
    if ((0, fs_1.existsSync)(CONFIG_PATH) && process.platform !== "win32") {
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
            }
            else {
                checks.push({
                    check: "Config permissions",
                    status: "warn",
                    detail: `0${mode.toString(8)} — expected 0600. Run: chmod 600 ~/.zeitflow/config.json`,
                });
            }
        }
        catch {
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
    }
    else {
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
    }
    catch (e) {
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
            }
            else if (resp.ok) {
                checks.push({
                    check: "Token valid",
                    status: "ok",
                    detail: "Authenticated successfully",
                });
            }
            else {
                checks.push({
                    check: "Token valid",
                    status: "warn",
                    detail: `Unexpected status: ${resp.status}`,
                });
            }
        }
        catch (e) {
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
        const icon = c.status === "ok" ? "✓" : c.status === "warn" ? "!" : "✗";
        print(`${icon} ${c.check}: ${c.detail}`);
    }
    print("");
    const fails = checks.filter((c) => c.status === "fail").length;
    const warns = checks.filter((c) => c.status === "warn").length;
    if (fails > 0) {
        print(`${fails} issue(s) found. See above for details.`);
    }
    else if (warns > 0) {
        print(`All checks passed with ${warns} warning(s).`);
    }
    else {
        print("All checks passed.");
    }
}
// ---------------------------------------------------------------------------
// Commands: guide
// ---------------------------------------------------------------------------
const GUIDE_TEXT = `ZeitFlow CLI — Manage Workflows from the Terminal
==================================================

## Overview

The ZeitFlow CLI is a lightweight command-line tool that lets you create workflows, execute
runs, inspect results, and configure MCP—all without opening a browser. It's designed with
AI agents in mind: every command supports \`--output json\` for machine-readable responses,
uses a consistent \`zeitflow <resource> <action>\` grammar, and is fully discoverable via \`--help\`.

## Installation

    npm install -g @zeitflow/cli

Requirements: Node.js 18+

## Quick Start

    # 1. Authenticate (opens browser to /connect)
    zeitflow auth login

    # 2. Verify
    zeitflow auth status

    # 3. List your workflows
    zeitflow workflow list

## Global Options

Every command supports these flags:

  --output json    Machine-readable JSON output (default: text)
  --help           Show help
  --version        Print version

You can set ZEITFLOW_URL as an environment variable to override the default API URL.

## Authentication — zeitflow auth

  zeitflow auth login                  Open browser to /connect, paste token to authenticate
  zeitflow auth login --token <TOKEN>  Save token directly (for scripting)
  zeitflow auth logout                 Remove stored credentials
  zeitflow auth status                 Show current auth state and API URL

Configuration is stored at ~/.zeitflow/config.json — the same file used by @zeitflow/mcp,
so if you've already authenticated with one, the other picks it up automatically.

## Workflows — zeitflow workflow (alias: wf)

### Listing and Creating

    # List all workflows
    zeitflow workflow list

    # Filter by status
    zeitflow workflow list --status published

    # Create a new workflow
    zeitflow workflow create --name "Customer Onboarding"
    zeitflow workflow create --name "Daily Report" --description "Summarizes metrics"

    # Get full details (nodes, connections, config)
    zeitflow workflow get 42

### Status Management

    # Publish a workflow so it can be executed
    zeitflow workflow publish 42

    # Archive it
    zeitflow workflow publish 42 --status archived

    # Revert to draft
    zeitflow workflow publish 42 --status draft

### Deleting

    zeitflow workflow delete 42

### Executing

    # Run with no input
    zeitflow workflow run 42

    # Pass input data as JSON
    zeitflow workflow run 42 --input '{"email":"alice@example.com","name":"Alice"}'

    # Trigger a specific entry node
    zeitflow workflow run 42 --entry-node entry_abc123

## Executions — zeitflow execution (alias: exec)

    zeitflow execution list --workflow 42           List executions for a workflow
    zeitflow execution get <ID>                     Get execution details (status, input, output)
    zeitflow execution logs <ID>                    View full execution logs
    zeitflow execution logs <ID> --level error      Filter to errors only
    zeitflow execution logs <ID> --node ai_123      Filter to a specific node

## Node Management — zeitflow workflow

Build workflows entirely from the CLI by adding nodes, connecting them, and updating their config.

### Adding Nodes

    # Add an AI node (config is the INNER config — the CLI wraps it under aiConfig automatically)
    zeitflow workflow add-node --workflow 42 --type ai --label "Summarize" \\
      --config '{"model":"google/gemini-2.0-flash-001","systemPrompt":"You are a summarizer.","userPrompt":"Summarize: {{entry.content}}","outputType":"text"}'

    # Add an email node
    zeitflow workflow add-node --workflow 42 --type email --label "Send Summary" \\
      --config '{"to":["{{entry.email}}"],"subject":"Summary: {{entry.title}}","message":"{{summarize.output}}"}'

    # Add a condition node
    zeitflow workflow add-node --workflow 42 --type condition --label "Is Urgent" \\
      --config '{"leftValue":"{{classify.output}}","operator":"contains","rightValue":"urgent"}'

### Connecting Nodes

    # Simple connection
    zeitflow workflow connect --workflow 42 --from entry_abc --to ai_def

    # Condition node — specify which branch (true/false)
    zeitflow workflow connect --workflow 42 --from condition_123 --to slack_456 --source-handle true
    zeitflow workflow connect --workflow 42 --from condition_123 --to email_789 --source-handle false

### Updating Nodes

    # Update a node's label
    zeitflow workflow update-node --workflow 42 --node ai_def --label "Classify Ticket"

    # Update config
    zeitflow workflow update-node --workflow 42 --node ai_def \\
      --config '{"model":"google/gemini-2.0-flash-001","userPrompt":"Classify: {{entry.message}}"}'

    # Add entry fields (required for input data to flow through)
    zeitflow workflow update-node --workflow 42 --node entry_abc \\
      --fields '[{"key":"name","name":"Name","type":"text"},{"key":"email","name":"Email","type":"text"}]'

### Other Node Commands

    zeitflow workflow list-nodes 42                                  List all nodes in a workflow
    zeitflow workflow remove-node --workflow 42 --node ai_def        Remove a node and its connections

### Variable Reference Syntax

Nodes reference outputs from upstream nodes using {{node_label.field}}. Labels are
converted to snake_case:

  - Entry node labeled "New Ticket" with field key \`subject\` → {{new_ticket.subject}}
  - AI node labeled "Classify" → {{classify.output}}
  - Email node labeled "Send Alert" → {{send_alert.status}}

## Validating — zeitflow workflow validate

Check a workflow for common issues before executing.

    zeitflow workflow validate 42

Checks for:
  - Missing entry fields — entry node has no input fields defined
  - Broken variable references — {{foo.bar}} but no upstream node named "foo" exists
  - Unreachable nodes — nodes that can't be reached from any entry point
  - Missing AI prompts — AI nodes with no user prompt
  - Empty email recipients — email nodes with no \`to\` addresses
  - Bad condition wiring — condition node connections missing sourceHandle
  - Entry field mismatches — {{entry.name}} but the entry node doesn't have a "name" field

Returns exit code 1 if errors are found, making it usable in CI/scripts.

    # JSON output for automation
    zeitflow workflow validate 42 --output json

## Diagnostics — zeitflow doctor

    zeitflow doctor

Checks: Config file exists and is readable, API token is present and valid,
API server is reachable, token has correct permissions.

## Templates — zeitflow template (alias: tpl)

    zeitflow template list                          List available templates
    zeitflow template list --visibility public      List public templates
    zeitflow template get <ID>                      Get template details
    zeitflow template use <ID>                      Create a workflow from a template
    zeitflow template use <ID> --name "My Workflow" Create with a custom name
    zeitflow template create --workflow 42 \\
      --name "Customer Support Triage" \\
      --category "Customer Support" \\
      --description "Classify tickets and route" \\
      --visibility public --tags "ai,slack,email"   Create template from workflow
    zeitflow template delete <ID>                   Delete a template

## Integrations — zeitflow integration (alias: int)

    zeitflow integration list                       List available integrations
    zeitflow integration info <ID>                  Show integration details and config schema

## Generating Workflows — zeitflow workflow generate

Describe a workflow in natural language and let AI build it.

    zeitflow workflow generate "Take a support ticket, classify it as urgent or normal, send urgent ones to Slack"

    # Use with an existing workflow to modify it
    zeitflow workflow generate "Add an SMS notification node after the email" --workflow 42

## Setup MCP — zeitflow setup mcp

    zeitflow setup mcp                              Interactive — prompts you to pick a client
    zeitflow setup mcp --client claude-desktop      Specify client directly
    zeitflow setup mcp --client cursor --save       Auto-write config file
    zeitflow setup mcp --client claude-code --output json

Supported clients: claude-desktop, claude-code, cursor, vscode, windsurf.

## End-to-End Example

    # 1. Create the workflow
    zeitflow workflow create --name "Content Summarizer"

    # 2. Add entry fields
    zeitflow workflow update-node --workflow 42 --node entry_abc \\
      --fields '[{"key":"title","name":"Title","type":"text"},{"key":"content","name":"Content","type":"text"},{"key":"email","name":"Email","type":"text"}]'

    # 3. Add an AI summarizer node
    zeitflow workflow add-node --workflow 42 --type ai --label "Summarize" \\
      --config '{"model":"google/gemini-2.0-flash-001","systemPrompt":"Summarize content with bullet points.","userPrompt":"Summarize:\\n\\n{{entry.content}}","outputType":"text"}'

    # 4. Add an email node
    zeitflow workflow add-node --workflow 42 --type email --label "Send Summary" \\
      --config '{"to":["{{entry.email}}"],"subject":"Summary: {{entry.title}}","message":"{{summarize.output}}"}'

    # 5. Connect the nodes
    zeitflow workflow connect --workflow 42 --from entry_abc --to ai_def
    zeitflow workflow connect --workflow 42 --from ai_def --to email_ghi

    # 6. Validate
    zeitflow workflow validate 42

    # 7. Execute
    zeitflow workflow run 42 --input '{"title":"ZeitFlow","content":"ZeitFlow is...","email":"me@example.com"}'

    # 8. Check result
    zeitflow execution logs 99

## Tips for AI Agents

  1. Always use --output json — parse structured data, not formatted tables
  2. Set ZEITFLOW_URL in your environment to point at a custom API endpoint
  3. Check zeitflow auth status --output json before making API calls
  4. Run --help to discover all available commands and flags
  5. Aliases save keystrokes: wf (workflow), exec (execution), ls (list), rm (delete)

## Troubleshooting

  "Not authenticated" → Run zeitflow auth login
  "API error (401)"   → Token invalid/expired, re-authenticate
  "API error (429)"   → Rate limited, wait a minute (100 req/hr)
  "Request failed"    → Check URL with zeitflow auth status
`;
async function guide(args) {
    const sub = args[0];
    if (sub === "search" && args[1]) {
        const query = args.slice(1).join(" ").toLowerCase();
        const sections = GUIDE_TEXT.split("\n## ");
        const matches = sections.filter((s) => s.toLowerCase().includes(query));
        if (outputJson) {
            printJson({ query, matchCount: matches.length, sections: matches });
            return;
        }
        if (matches.length === 0) {
            print(`No sections found matching "${query}"`);
            print("Run \`zeitflow guide\` to see the full guide.");
            return;
        }
        print(`Found ${matches.length} section(s) matching "${query}":\n`);
        for (const section of matches) {
            const display = section.startsWith("ZeitFlow") ? section : `## ${section}`;
            print(display);
            print("─".repeat(60));
        }
        return;
    }
    // Default: show full guide
    if (outputJson) {
        printJson({ guide: GUIDE_TEXT });
    }
    else {
        print(GUIDE_TEXT);
    }
}
// ---------------------------------------------------------------------------
// Commands: workflow open & visualize
// ---------------------------------------------------------------------------
async function workflowOpen(id) {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/workflow/${id}`;
    console.error(`Opening ${url} in your browser...`);
    try {
        const { exec } = await import("child_process");
        const cmd = process.platform === "darwin"
            ? "open"
            : process.platform === "win32"
                ? "start"
                : "xdg-open";
        exec(`${cmd} ${url}`);
    }
    catch {
        /* ignore — user can open manually */
    }
    printSuccess(`Opened workflow ${id} in browser`);
}
async function workflowVisualize(id) {
    const data = (await api("GET", `/api/workflow/${id}`));
    const name = data.name || "Untitled";
    const nodes = data.nodes || [];
    const connections = data.connections || [];
    if (outputJson) {
        const graphNodes = nodes.map((n) => ({
            id: n.id,
            type: n.type,
            label: n.label || "(unlabeled)",
        }));
        const graphEdges = connections.map((c) => {
            const edge = {
                from: c.fromNodeId || c.from,
                to: c.toNodeId || c.to,
            };
            const handle = c.sourceHandle;
            if (handle)
                edge.sourceHandle = handle;
            return edge;
        });
        printJson({ nodes: graphNodes, edges: graphEdges });
        return;
    }
    if (nodes.length === 0) {
        print("  (empty workflow)");
        return;
    }
    // Build lookup maps
    const nodeInfo = new Map();
    for (const n of nodes) {
        const nid = n.id;
        nodeInfo.set(nid, {
            label: n.label || "(unlabeled)",
            type: n.type || "?",
        });
    }
    // Adjacency
    const childrenMap = new Map();
    const inDegree = new Map();
    for (const n of nodes) {
        const nid = n.id;
        childrenMap.set(nid, []);
        inDegree.set(nid, 0);
    }
    for (const c of connections) {
        const from = (c.fromNodeId || c.from);
        const to = (c.toNodeId || c.to);
        const handle = (c.sourceHandle || "");
        if (from && to) {
            childrenMap.get(from)?.push({ to, handle });
            inDegree.set(to, (inDegree.get(to) || 0) + 1);
        }
    }
    // Topological sort into layers
    const layers = [];
    let queue = [...inDegree.entries()]
        .filter(([, deg]) => deg === 0)
        .map(([id]) => id);
    const visited = new Set();
    while (queue.length > 0) {
        const layer = [];
        const nextQueue = [];
        for (const nid of queue) {
            if (visited.has(nid))
                continue;
            visited.add(nid);
            layer.push(nid);
            for (const edge of childrenMap.get(nid) || []) {
                const deg = (inDegree.get(edge.to) || 1) - 1;
                inDegree.set(edge.to, deg);
                if (deg === 0)
                    nextQueue.push(edge.to);
            }
        }
        if (layer.length > 0)
            layers.push(layer);
        queue = nextQueue;
    }
    // Type → icon
    const iconFor = (t) => {
        const icons = {
            entry: ">>", ai: "AI", email: "@@", slack: "##",
            sms: "!!", telegram: "TG", condition: "??", scheduler: "CL",
            review: "OK", youtube: "YT",
        };
        return icons[t] || "**";
    };
    const formatNode = (nid) => {
        const info = nodeInfo.get(nid);
        if (!info)
            return `[? ${nid}]`;
        return `[${iconFor(info.type)} ${info.label}]`;
    };
    // Print
    print("");
    print(`  ${name}`);
    print("");
    for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        print("  " + layer.map(formatNode).join("    "));
        if (i < layers.length - 1) {
            const arrows = [];
            for (const nid of layer) {
                for (const edge of childrenMap.get(nid) || []) {
                    const parentLabel = nodeInfo.get(nid)?.label || nid;
                    const childLabel = nodeInfo.get(edge.to)?.label || edge.to;
                    if (!edge.handle) {
                        arrows.push(`  ${parentLabel} → ${childLabel}`);
                    }
                    else {
                        const display = edge.handle === "true" ? "yes" : edge.handle === "false" ? "no" : edge.handle;
                        arrows.push(`  ${parentLabel} —[${display}]→ ${childLabel}`);
                    }
                }
            }
            for (const arrow of arrows)
                print(arrow);
            print("");
        }
    }
    print("");
    print(`  ${nodes.length} nodes, ${connections.length} connections`);
    print("");
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
  workflow stats <id>                 Get workflow execution stats
  workflow validate <id>              Validate workflow for issues
  workflow generate "<desc>"          Generate workflow from description
  workflow add-node --workflow <id>   Add a node to a workflow
  workflow update-node --workflow <id> Update a node
  workflow list-nodes <id>            List nodes in a workflow
  workflow remove-node --workflow <id> Remove a node
  workflow connect --workflow <id>    Connect two nodes
  workflow open <id>                 Open workflow in browser
  workflow visualize <id>            Visualize workflow as ASCII graph

  execution list --workflow <id>      List executions
  execution get <id>                  Get execution details
  execution logs <id> [--level l]     View execution logs

  template list [--visibility v]     List templates
  template get <id>                  Get template details
  template use <id> [--name n]       Create workflow from template
  template create --workflow <id>    Create template from workflow
  template delete <id>               Delete template

  integration list                   List available integrations
  integration info <id>              Show integration details

  setup mcp [--client <c>] [--save]  Generate MCP config for your IDE

  guide [search "<query>"]           Show the CLI usage guide
  doctor                             Check CLI config and connectivity

ALIASES
  wf = workflow, exec = execution, tpl = template, int = integration
  ls = list, rm = delete

OPTIONS
  --output json    Output JSON instead of text (works with all commands)
  --help           Show this help
  --version        Show version
`.trim();
async function main() {
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
        const pkg = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(__dirname, "..", "package.json"), "utf-8"));
        print(`zeitflow ${pkg.version}`);
        return;
    }
    const [cmd, sub, ...rest] = args.filter((a, i) => a !== "--output" &&
        !(args[i - 1] === "--output") &&
        a !== "json");
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
                    if (!rest[0])
                        error("Usage: zeitflow workflow get <id>");
                    return workflowGet(rest[0]);
                case "create":
                    return workflowCreate(rest);
                case "delete":
                case "rm":
                    if (!rest[0])
                        error("Usage: zeitflow workflow delete <id>");
                    return workflowDelete(rest[0]);
                case "run":
                case "execute":
                    if (!rest[0])
                        error("Usage: zeitflow workflow run <id>");
                    return workflowRun(rest[0], rest.slice(1));
                case "publish":
                    if (!rest[0])
                        error("Usage: zeitflow workflow publish <id>");
                    return workflowPublish(rest[0], rest.slice(1));
                case "stats":
                    if (!rest[0])
                        error("Usage: zeitflow workflow stats <id>");
                    return workflowStats(rest[0]);
                case "validate":
                    if (!rest[0])
                        error("Usage: zeitflow workflow validate <id>");
                    return workflowValidate(rest[0]);
                case "generate":
                    if (!rest[0])
                        error("Usage: zeitflow workflow generate \"<description>\"");
                    return workflowGenerate(rest[0], rest.slice(1));
                case "add-node":
                    return workflowAddNode(rest);
                case "update-node":
                    return workflowUpdateNode(rest);
                case "list-nodes":
                case "nodes":
                    if (!rest[0])
                        error("Usage: zeitflow workflow list-nodes <id>");
                    return workflowListNodes(rest[0]);
                case "remove-node":
                    return workflowRemoveNode(rest);
                case "connect":
                    return workflowConnect(rest);
                case "open":
                    if (!rest[0])
                        error("Usage: zeitflow workflow open <id>");
                    return workflowOpen(rest[0]);
                case "visualize":
                case "viz":
                    if (!rest[0])
                        error("Usage: zeitflow workflow visualize <id>");
                    return workflowVisualize(rest[0]);
                default:
                    error(`Unknown workflow command: ${sub}\nRun: zeitflow workflow list`);
            }
            break;
        case "execution":
        case "exec":
            switch (sub) {
                case "list":
                case "ls":
                    return executionList(rest);
                case "get":
                    if (!rest[0])
                        error("Usage: zeitflow execution get <id>");
                    return executionGet(rest[0]);
                case "logs":
                    if (!rest[0])
                        error("Usage: zeitflow execution logs <id>");
                    return executionLogs(rest[0], rest.slice(1));
                default:
                    error(`Unknown execution command: ${sub}\nRun: zeitflow execution list --workflow <id>`);
            }
            break;
        case "template":
        case "tpl":
            switch (sub) {
                case "list":
                case "ls":
                    return templateList(rest);
                case "get":
                    if (!rest[0])
                        error("Usage: zeitflow template get <id>");
                    return templateGet(rest[0]);
                case "use":
                    if (!rest[0])
                        error("Usage: zeitflow template use <id>");
                    return templateUse(rest[0], rest.slice(1));
                case "create":
                    return templateCreate(rest);
                case "delete":
                case "rm":
                    if (!rest[0])
                        error("Usage: zeitflow template delete <id>");
                    return templateDelete(rest[0]);
                default:
                    error(`Unknown template command: ${sub}\nRun: zeitflow template list`);
            }
            break;
        case "integration":
        case "int":
            switch (sub) {
                case "list":
                case "ls":
                    return integrationList();
                case "info":
                    if (!rest[0])
                        error("Usage: zeitflow integration info <id>");
                    return integrationInfo(rest[0]);
                default:
                    error(`Unknown integration command: ${sub}\nRun: zeitflow integration list`);
            }
            break;
        case "setup":
            if (sub === "mcp")
                return setupMcp(rest);
            error(`Unknown setup command: ${sub}\nRun: zeitflow setup mcp`);
            break;
        case "guide":
            return guide([sub, ...rest].filter(Boolean));
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
