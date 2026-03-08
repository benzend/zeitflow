export interface Guide {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  icon: string;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
}

export const guides: Guide[] = [
  {
    slug: "mcp-server-setup",
    title: "Connect AI Agents to ZeitFlow via MCP",
    excerpt:
      "Set up the ZeitFlow MCP server so AI agents like Claude can create, manage, and execute your workflows programmatically.",
    icon: "🔌",
    publishedAt: "2026-02-22",
    updatedAt: "2026-02-22",
    tags: ["MCP", "AI Agents", "Integration"],
    content: `
ZeitFlow ships with a **Model Context Protocol (MCP)** server that lets AI agents — like Claude Desktop, Claude Code, Cursor, and VS Code — create, configure, and execute workflows on your behalf.

Once connected, you can say things like *"Create a workflow that takes a blog topic, generates an outline with AI, then emails me the result"* and the agent will build it directly in ZeitFlow.

> **Quickest path:** Go to **[/connect](/connect)** in ZeitFlow — it generates ready-to-paste configs with your token pre-filled.

---

## Prerequisites

- A **ZeitFlow account**
- Your **API token** (get it at [/connect](/connect) or any workflow's Execution tab)

That's it. The remote MCP endpoint requires **no local setup** — no cloning, no dependencies, no database URL.

---

## Step 1: Get your API Token

1. Log in to ZeitFlow
2. Go to **[/connect](/connect)** (or open any workflow's Execution tab)
3. Copy your API token (generate one if you don't have one yet)

---

## Step 2: Configure your MCP client

The [/connect](/connect) page generates ready-to-paste configs for all seven supported clients: **Remote URL**, **Claude Desktop**, **Claude Code**, **Cursor** (with one-click deep-link install), **VS Code**, **Windsurf**, and **npx**. Select your client, copy the config, and paste it into the correct file.

### Option A: Remote URL (recommended — zero install)

Works with any MCP client that supports Streamable HTTP (Claude Desktop, Claude Code, Cursor, VS Code, Windsurf):

\`\`\`json
{
  "mcpServers": {
    "zeitflow": {
      "serverUrl": "https://www.zeitflow.io/api/mcp",
      "headers": {
        "Authorization": "Bearer your-api-token-here"
      }
    }
  }
}
\`\`\`

No local setup, no database URL, no dependencies. Just paste and go.

### Option B: Claude Code CLI one-liner

\`\`\`bash
claude mcp add zeitflow --transport http "https://www.zeitflow.io/api/mcp" --header "Authorization: Bearer your-api-token-here"
\`\`\`

### Option C: npx (for stdio-only clients)

\`\`\`json
{
  "mcpServers": {
    "zeitflow": {
      "command": "npx",
      "args": ["-y", "@zeitflow/mcp"],
      "env": {
        "ZEITFLOW_API_TOKEN": "your-api-token-here"
      }
    }
  }
}
\`\`\`

### Option D: Local development (direct DB access)

If you're a contributor with access to the ZeitFlow database:

\`\`\`bash
ZEITFLOW_API_TOKEN=your-token DATABASE_URL=your-db-url pnpm mcp
\`\`\`

---

## Available Tools

Once connected, the agent has access to **16 tools** organized into four groups:

### Discovery
| Tool | Description |
|------|-------------|
| \`list_node_types\` | List all workflow node types with their default configs |
| \`list_ai_models\` | List available AI models for AI nodes |

### Workflow CRUD
| Tool | Description |
|------|-------------|
| \`create_workflow\` | Create a new workflow (auto-adds an entry node) |
| \`get_workflow\` | Get full workflow details — nodes, connections, config |
| \`list_workflows\` | List your workflows, optionally filtered by status |
| \`update_workflow\` | Update name, description, or status |
| \`delete_workflow\` | Delete a workflow and all its data |

### Node & Connection Management
| Tool | Description |
|------|-------------|
| \`add_node\` | Add a node (AI, email, Slack, SMS, condition, etc.) |
| \`update_node\` | Update a node's label, position, or config |
| \`remove_node\` | Remove a node and its connections |
| \`connect_nodes\` | Wire two nodes together |
| \`remove_connection\` | Remove a connection |

### Execution
| Tool | Description |
|------|-------------|
| \`execute_workflow\` | Run a workflow with input data |
| \`get_execution\` | Get execution details and logs |
| \`list_executions\` | List recent executions for a workflow |

### Bulk Creation
| Tool | Description |
|------|-------------|
| \`create_workflow_from_template\` | Build an entire workflow (nodes + connections) in one call |

---

## Example Conversation

Here's what using it with Claude looks like:

**You:** *Create a content review workflow. It should accept a blog post draft via API, run it through AI for grammar and style review, then email the review to me at ben@example.com.*

**Claude** will then:
1. Call \`create_workflow_from_template\` with three nodes:
   - An **entry** node (API type) with a "draft" text field
   - An **AI** node configured with a review prompt
   - An **email** node configured with your address
2. Wire them together: entry → AI → email
3. Return the workflow ID so you can view it in the ZeitFlow UI

You can then open the workflow in ZeitFlow's visual builder to inspect, tweak, or publish it.

---

## Node Types Reference

Each node type has a specific purpose and configuration:

- **entry** — Data entry point. Supports \`api\`, \`form\`, and \`webhook\` modes. Configure input fields (text, number, email, etc.)
- **ai** — AI processing. Set the model, system prompt, user prompt, output type (text, JSON, markdown), and optional \`outputStructure\` for defining expected JSON schema
- **email** — Send emails via Resend. Configure to, subject, and message body
- **slack** — Post to Slack channels. Requires a connected Slack workspace
- **sms** — Send SMS via Twilio. Configure phone number and message. Optionally provide per-workflow Twilio credentials (Account SID, Auth Token, Phone Number) to override system defaults
- **telegram** — Send Telegram messages. Configure chat ID and message. Optionally provide a per-workflow \`botToken\` to override the system default
- **youtube** — Two modes: \`fetch\` retrieves video metadata (title, description, stats) from a URL; \`comment\` posts a comment on a video. Configure \`videoUrl\` and optionally \`commentText\`
- **condition** — Branch the workflow based on expressions. Has \`true\` and \`false\` output handles
- **scheduler** — Schedule actions with Google Calendar
- **review** — Manual approval step

### Variable References

Nodes can reference outputs from earlier nodes using the \`{{nodeName.field}}\` syntax. For example, an AI node's user prompt might be:

\`\`\`
Review the following blog post for grammar and style:

{{Entry.draft}}
\`\`\`

---

## Webhook Entry Type

When you set an entry node to \`webhook\` mode, ZeitFlow generates a unique secret for the workflow. External services can trigger the workflow by sending an HTTP POST to:

\`\`\`
POST /api/workflow/<id>/execute?secret=<webhookSecret>
Content-Type: application/json

{ "field1": "value1", "field2": "value2" }
\`\`\`

Key points:

- The **webhook URL and secret** are displayed in the workflow builder once you select webhook mode
- Secrets are 32-character hex strings, validated with constant-time comparison
- **Rotate secrets** anytime via the regenerate button in the UI, or call \`POST /api/workflow/<id>/regenerate-secret\`
- No user session is required — the secret authenticates the request
- Input data in the POST body is matched to the entry node's configured fields

This is ideal for connecting external services (GitHub webhooks, Stripe events, Zapier, etc.) to your workflows.

---

## Per-Workflow Integration Credentials

By default, SMS and Telegram nodes use system-wide credentials set via environment variables. However, you can override these on a per-workflow basis:

**SMS nodes** accept optional fields:
- \`twilioAccountSid\` — Override \`TWILIO_ACCOUNT_SID\`
- \`twilioAuthToken\` — Override \`TWILIO_AUTH_TOKEN\`
- \`twilioPhoneNumber\` — Override \`TWILIO_PHONE_NUMBER\`

**Telegram nodes** accept an optional field:
- \`botToken\` — Override \`TELEGRAM_BOT_TOKEN\`

If left empty, the system defaults are used. This lets you use different credentials for different workflows — for example, sending from a different phone number for billing vs. marketing workflows.

---

## Important Notes

- Each MCP session authenticates as **one user** via the API token. The agent can only access that user's workflows.
- Workflows created via MCP start in **draft** status. Use \`update_workflow\` to publish them when ready.
- **Remote endpoint** (Option A): Everything goes through \`/api/mcp\` — no local setup needed. This is the recommended approach.
- **Local stdio** (Option D): \`execute_workflow\` requires the Next.js app to be running (\`pnpm dev\`) since it calls the HTTP execute endpoint. All other tools talk directly to the database.

---

## Testing Locally

To test the remote MCP endpoint against a local dev server:

\`\`\`bash
# 1. Start ZeitFlow
pnpm dev

# 2. Test with curl (replace YOUR_TOKEN)
curl -X POST http://localhost:3000/api/mcp \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}'
\`\`\`

If you get back a JSON-RPC response with \`serverInfo\`, the endpoint is working. Then configure your MCP client to point to \`http://localhost:3000/api/mcp\`.

For stdio mode, test directly:

\`\`\`bash
ZEITFLOW_API_TOKEN=your-token DATABASE_URL=your-db-url pnpm mcp
\`\`\`

You should see: \`ZeitFlow MCP server running (user: you@example.com)\`

---

## Troubleshooting

**401 "Missing or invalid Authorization header"**
Include \`Authorization: Bearer <token>\` in your request headers. For the remote endpoint, this is required.

**401 "Invalid API token — no matching user found"**
Your token doesn't match any user. Generate a fresh one at [/connect](/connect).

**"DATABASE_URL environment variable is required"**
Only applies to local stdio mode (Option D). The remote endpoint doesn't need this.

**"Failed to reach execution endpoint"**
The \`execute_workflow\` tool (in local mode) needs the Next.js server running (\`pnpm dev\`).

**Client doesn't show zeitflow tools**
Restart your MCP client after changing config. For Claude Desktop, check logs at \`~/Library/Logs/Claude/\`. For Cursor, check the MCP panel in settings.
`,
  },
  {
    slug: "cli",
    title: "ZeitFlow CLI — Manage Workflows from the Terminal",
    excerpt:
      "Install and use the ZeitFlow CLI to create, manage, and execute workflows from the command line. Zero dependencies, works everywhere Node.js runs.",
    icon: "⌨️",
    publishedAt: "2026-02-22",
    updatedAt: "2026-03-07",
    tags: ["CLI", "AI Agents", "npm", "Automation"],
    content: `
The ZeitFlow CLI is a lightweight command-line tool that lets you create workflows, execute runs, inspect results, and configure MCP — all without opening a browser.

It's designed with AI agents in mind: every command supports \`--output json\` for machine-readable responses, uses a consistent \`zeitflow <resource> <action>\` grammar, and is fully discoverable via \`--help\`.

---

## Installation

\`\`\`bash
npm install -g @zeitflow/cli
\`\`\`

### Requirements

- Node.js 18+

---

## Quick Start

\`\`\`bash
# 1. Authenticate (opens browser to /connect)
zeitflow auth login

# 2. Verify
zeitflow auth status

# 3. List your workflows
zeitflow workflow list
\`\`\`

---

## Global Options

Every command supports these flags:

| Flag | Description |
|------|-------------|
| \`--output json\` | Machine-readable JSON output (default: \`text\`) |
| \`--help\` | Show help |
| \`--version\` | Print version |

You can set \`ZEITFLOW_URL\` as an environment variable to override the default API URL.

---

## Authentication — \`zeitflow auth\`

| Command | Description |
|---------|-------------|
| \`zeitflow auth login\` | Open browser to /connect, paste token to authenticate |
| \`zeitflow auth login --token <TOKEN>\` | Save token directly (for scripting) |
| \`zeitflow auth logout\` | Remove stored credentials |
| \`zeitflow auth status\` | Show current auth state and API URL |

Configuration is stored at \`~/.zeitflow/config.json\` — the same file used by \`@zeitflow/mcp\`, so if you've already authenticated with one, the other picks it up automatically.

---

## Workflows — \`zeitflow workflow\`

Alias: \`wf\`

### Listing and creating

\`\`\`bash
# List all workflows
zeitflow workflow list

# Filter by status
zeitflow workflow list --status published

# Create a new workflow
zeitflow workflow create --name "Customer Onboarding"
zeitflow workflow create --name "Daily Report" --description "Summarizes metrics"

# Get full details (nodes, connections, config)
zeitflow workflow get 42
\`\`\`

### Status management

\`\`\`bash
# Publish a workflow so it can be executed
zeitflow workflow publish 42

# Archive it
zeitflow workflow publish 42 --status archived

# Revert to draft
zeitflow workflow publish 42 --status draft
\`\`\`

### Deleting

\`\`\`bash
zeitflow workflow delete 42
\`\`\`

### Executing

\`\`\`bash
# Run with no input
zeitflow workflow run 42

# Pass input data as JSON
zeitflow workflow run 42 --input '{"email":"alice@example.com","name":"Alice"}'

# Trigger a specific entry node
zeitflow workflow run 42 --entry-node entry_abc123
\`\`\`

---

## Executions — \`zeitflow execution\`

Alias: \`exec\`

| Command | Description |
|---------|-------------|
| \`zeitflow execution list --workflow 42\` | List executions for a workflow |
| \`zeitflow execution get <ID>\` | Get execution details (status, input, output) |
| \`zeitflow execution logs <ID>\` | View full execution logs |
| \`zeitflow execution logs <ID> --level error\` | Filter to errors only |
| \`zeitflow execution logs <ID> --node ai_123\` | Filter to a specific node |

---

## Node Management — \`zeitflow workflow\`

Build workflows entirely from the CLI by adding nodes, connecting them, and updating their config.

### Adding nodes

\`\`\`bash
# Add an AI node (config is the INNER config — the CLI wraps it under aiConfig automatically)
zeitflow workflow add-node --workflow 42 --node-type ai --label "Summarize" \\
  --config '{"model":"google/gemini-2.0-flash-001","systemPrompt":"You are a summarizer.","userPrompt":"Summarize: {{entry.content}}","outputType":"text"}'

# Add an email node
zeitflow workflow add-node --workflow 42 --node-type email --label "Send Summary" \\
  --config '{"to":["{{entry.email}}"],"subject":"Summary: {{entry.title}}","message":"{{summarize.output}}"}'

# Add a condition node
zeitflow workflow add-node --workflow 42 --node-type condition --label "Is Urgent" \\
  --config '{"leftValue":"{{classify.output}}","operator":"contains","rightValue":"urgent"}'
\`\`\`

### Connecting nodes

\`\`\`bash
# Simple connection
zeitflow workflow connect --workflow 42 --from entry_abc --to ai_def

# Condition node — specify which branch (true/false)
zeitflow workflow connect --workflow 42 --from condition_123 --to slack_456 --source-handle true
zeitflow workflow connect --workflow 42 --from condition_123 --to email_789 --source-handle false
\`\`\`

### Updating nodes

\`\`\`bash
# Update a node's label
zeitflow workflow update-node --workflow 42 --node ai_def --label "Classify Ticket"

# Update config
zeitflow workflow update-node --workflow 42 --node ai_def \\
  --config '{"model":"google/gemini-2.0-flash-001","userPrompt":"Classify: {{entry.message}}"}'

# Add entry fields (required for input data to flow through)
zeitflow workflow update-node --workflow 42 --node entry_abc \\
  --fields '[{"key":"name","name":"Name","type":"text"},{"key":"email","name":"Email","type":"text"}]'
\`\`\`

### Other node commands

| Command | Description |
|---------|-------------|
| \`zeitflow workflow list-nodes 42\` | List all nodes in a workflow |
| \`zeitflow workflow remove-node --workflow 42 --node ai_def\` | Remove a node and its connections |

### Variable reference syntax

Nodes reference outputs from upstream nodes using \`{{node_label.field}}\`. Labels are converted to snake_case:

- Entry node labeled "New Ticket" with field key \`subject\` → \`{{new_ticket.subject}}\`
- AI node labeled "Classify" → \`{{classify.output}}\`
- Email node labeled "Send Alert" → \`{{send_alert.status}}\`

---

## Validating — \`zeitflow workflow validate\`

Check a workflow for common issues before executing.

\`\`\`bash
zeitflow workflow validate 42
\`\`\`

Checks for:
- **Missing entry fields** — entry node has no input fields defined
- **Broken variable references** — \`{{foo.bar}}\` but no upstream node named "foo" exists
- **Unreachable nodes** — nodes that can't be reached from any entry point
- **Missing AI prompts** — AI nodes with no user prompt
- **Empty email recipients** — email nodes with no \`to\` addresses
- **Bad condition wiring** — condition node connections missing \`sourceHandle\`
- **Entry field mismatches** — \`{{entry.name}}\` but the entry node doesn't have a "name" field

Returns exit code 1 if errors are found, making it usable in CI/scripts.

\`\`\`bash
# JSON output for automation
zeitflow workflow validate 42 --output json
\`\`\`

---

## Diagnostics — \`zeitflow doctor\`

Check your CLI configuration and connectivity.

\`\`\`bash
zeitflow doctor
\`\`\`

Checks:
- Config file exists and is readable
- API token is present and valid
- API server is reachable
- Token has correct permissions

---

## Templates — \`zeitflow template\`

Alias: \`tpl\`

| Command | Description |
|---------|-------------|
| \`zeitflow template list\` | List available templates |
| \`zeitflow template list --visibility public\` | List public templates |
| \`zeitflow template get <ID>\` | Get template details |
| \`zeitflow template use <ID>\` | Create a workflow from a template |
| \`zeitflow template use <ID> --name "My Workflow"\` | Create with a custom name |
| \`zeitflow template create --workflow 42 --name "My Template" --category "Sales"\` | Create a template from a workflow |
| \`zeitflow template delete <ID>\` | Delete a template |

### Creating a template from a workflow

\`\`\`bash
zeitflow template create \\
  --workflow 42 \\
  --name "Customer Support Triage" \\
  --category "Customer Support" \\
  --description "Classify tickets and route to Slack or email" \\
  --visibility public \\
  --tags "ai,slack,email,support"
\`\`\`

---

## Integrations — \`zeitflow integration\`

Alias: \`int\`

| Command | Description |
|---------|-------------|
| \`zeitflow integration list\` | List available integrations |
| \`zeitflow integration info <ID>\` | Show integration details and config schema |

---

## Generating Workflows — \`zeitflow workflow generate\`

Describe a workflow in natural language and let AI build it.

\`\`\`bash
zeitflow workflow generate "Take a support ticket, classify it as urgent or normal, send urgent ones to Slack and normal ones via email"

# Use with an existing workflow to modify it
zeitflow workflow generate "Add an SMS notification node after the email" --workflow 42
\`\`\`

---

## Setup MCP — \`zeitflow setup mcp\`

Interactively generate MCP config for your IDE or AI client.

\`\`\`bash
# Interactive — prompts you to pick a client
zeitflow setup mcp

# Specify client directly
zeitflow setup mcp --client claude-desktop

# Write config to the client's config file automatically
zeitflow setup mcp --client cursor --save

# Machine-readable output for scripting
zeitflow setup mcp --client claude-code --output json
\`\`\`

Supported clients: \`claude-desktop\`, \`claude-code\`, \`cursor\`, \`vscode\`, \`windsurf\`.

For Claude Code, it also shows the one-liner CLI command as an alternative.

---

## End-to-End Example

Build a content summarizer entirely from the CLI — create the workflow, add nodes, wire them up, validate, and execute.

\`\`\`bash
# 1. Create the workflow (auto-creates an entry node)
zeitflow workflow create --name "Content Summarizer"
# -> Workflow created (id: 42, entry node: entry_abc)

# 2. Add entry fields so input data flows through
zeitflow workflow update-node --workflow 42 --node entry_abc \\
  --fields '[{"key":"title","name":"Title","type":"text"},{"key":"content","name":"Content","type":"text"},{"key":"email","name":"Email","type":"text"}]'

# 3. Add an AI summarizer node
zeitflow workflow add-node --workflow 42 --node-type ai --label "Summarize" \\
  --config '{"model":"google/gemini-2.0-flash-001","systemPrompt":"Summarize content with bullet points. Keep it under 200 words.","userPrompt":"Summarize:\\n\\n{{entry.content}}","outputType":"text"}'
# -> Node added (id: ai_def)

# 4. Add an email node
zeitflow workflow add-node --workflow 42 --node-type email --label "Send Summary" \\
  --config '{"to":["{{entry.email}}"],"subject":"Summary: {{entry.title}}","message":"{{summarize.output}}"}'
# -> Node added (id: email_ghi)

# 5. Connect the nodes
zeitflow workflow connect --workflow 42 --from entry_abc --to ai_def
zeitflow workflow connect --workflow 42 --from ai_def --to email_ghi

# 6. Validate before running
zeitflow workflow validate 42
# -> Workflow is valid — no issues found

# 7. Execute
zeitflow workflow run 42 --input '{"title":"ZeitFlow","content":"ZeitFlow is a visual workflow builder...","email":"me@example.com"}'

# 8. Check the result
zeitflow execution logs 99
\`\`\`

---

## Tips for AI Agents

1. **Always use \`--output json\`** — parse structured data, not formatted tables
2. **Set \`ZEITFLOW_URL\` in your environment** to point at a custom API endpoint
3. **Check \`zeitflow auth status --output json\`** before making API calls to confirm authentication
4. **Run \`--help\`** to discover all available commands and flags
5. **Aliases save keystrokes**: \`wf\` (workflow), \`exec\` (execution), \`ls\` (list), \`rm\` (delete)

---

## Troubleshooting

**"Not authenticated. Run: zeitflow auth login"**
You haven't saved an API token yet. Run \`zeitflow auth login\` to open the browser and authenticate.

**"API error (401)"**
Your token is invalid or expired. Run \`zeitflow auth login\` to re-authenticate with a fresh token.

**"API error (429)"**
Rate limited. Wait a minute and try again. Workflows API allows 100 requests/hour.

**"Request failed" or network errors**
Can't reach the API server. Check that your URL is correct with \`zeitflow auth status\` and that the server is running.
`,
  },
];

export function getGuide(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}

export function getAllGuides(): Guide[] {
  return guides;
}
