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
# Connect AI Agents to ZeitFlow via MCP

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
claude mcp add zeitflow --transport http --url "https://www.zeitflow.io/api/mcp" --header "Authorization: Bearer your-api-token-here"
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

\\\`\\\`\\\`
POST /api/workflow/<id>/execute?secret=<webhookSecret>
Content-Type: application/json

{ "field1": "value1", "field2": "value2" }
\\\`\\\`\\\`

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
    title: "ZeitFlow CLI — Build Workflows from the Terminal",
    excerpt:
      "Install and use the ZeitFlow Rust CLI to create, manage, and execute workflows from the command line. Designed for both humans and AI agents.",
    icon: "⌨️",
    publishedAt: "2026-02-22",
    updatedAt: "2026-02-23",
    tags: ["CLI", "AI Agents", "Rust", "Automation"],
    content: `
# ZeitFlow CLI — Build Workflows from the Terminal

The ZeitFlow CLI is a fast, standalone command-line tool written in Rust. It lets you create workflows, add nodes, wire them together, execute runs, and inspect results — all without opening a browser.

It's designed with AI agents in mind: every command supports \`--output json\` for machine-readable responses, uses a consistent \`zeitflow <resource> <action>\` grammar, and is fully discoverable via \`--help\`.

---

## Installation

### Build from source

\`\`\`bash
cd cli
cargo build --release
\`\`\`

The binary is at \`cli/target/release/zeitflow\`. Move it somewhere on your PATH:

\`\`\`bash
cp cli/target/release/zeitflow /usr/local/bin/
\`\`\`

### Requirements

- Rust 1.70+ and Cargo

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
| \`--output text\` | Human-readable tables and messages |
| \`--api-url <URL>\` | Override the API URL for a single call |
| \`-h, --help\` | Help for any command or subcommand |
| \`-V, --version\` | Print version |

You can also set \`ZEITFLOW_API_URL\` as an environment variable instead of passing \`--api-url\` on every call.

---

## Authentication — \`zeitflow auth\`

| Command | Description |
|---------|-------------|
| \`zeitflow auth login\` | Open browser to /connect, paste token to authenticate |
| \`zeitflow auth login --token <TOKEN>\` | Save token directly (for scripting) |
| \`zeitflow auth logout\` | Remove stored credentials |
| \`zeitflow auth status\` | Show current auth state and API URL |

Configuration is stored at \`~/.zeitflow/config.json\`. If you previously used the old config location (\`~/.config/zeitflow/config.json\` with \`api_token\`/\`api_url\` field names), it will be auto-migrated on first load — no manual action needed.

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

### Statistics

\`\`\`bash
zeitflow workflow stats 42
\`\`\`

Returns execution metrics for the workflow:
- **Total executions** — How many times the workflow has been run
- **Completed / Failed** — Counts for each status
- **Success rate** — Percentage of successful runs
- **Average duration** — Mean execution time
- **Recent executions** — Last 10 runs with status and timestamps

---

## Node Management

Nodes are the building blocks of a workflow. Each node has a type, a label, and type-specific configuration.

### Adding a node

\`\`\`bash
zeitflow workflow add-node \\
  --workflow 42 \\
  --node-type <TYPE> \\
  --label "My Node" \\
  --config '<JSON>'
\`\`\`

The command returns the generated node ID — save it for connecting nodes later.

### Node types

| Type | Config Key | Key Fields |
|------|-----------|------------|
| \`entry\` | — | Use \`--entry-type\`: \`form\`, \`api\`, or \`webhook\` |
| \`ai\` | \`aiConfig\` | \`model\`, \`systemPrompt\`, \`userPrompt\`, \`outputType\`, \`outputStructure\` (define expected JSON shape when outputType is JSON) |
| \`email\` | \`emailConfig\` | \`to\` (array), \`subject\`, \`message\` |
| \`slack\` | \`slackConfig\` | \`channel\`, \`message\` |
| \`sms\` | \`smsConfig\` | \`to\` (array), \`message\`, optional \`twilioAccountSid\`, \`twilioAuthToken\`, \`twilioPhoneNumber\` overrides |
| \`telegram\` | \`telegramConfig\` | \`chatId\`, \`message\`, optional \`botToken\` override |
| \`youtube\` | \`youtubeConfig\` | \`mode\` (\`fetch\` to retrieve video data, \`comment\` to post a comment), \`videoUrl\`, \`commentText\` |
| \`condition\` | \`conditionConfig\` | \`leftValue\`, \`operator\`, \`rightValue\` |
| \`scheduler\` | \`schedulerConfig\` | \`people\`, \`minTimeRequirement\`, \`calendar\` |
| \`review\` | \`reviewConfig\` | \`validationSteps\` |

**Condition operators:** \`equals\`, \`not_equals\`, \`contains\`, \`not_contains\`, \`greater_than\`, \`less_than\`, \`is_empty\`, \`is_not_empty\`.

### Examples

\`\`\`bash
# Entry node (API mode)
zeitflow workflow add-node \\
  --workflow 42 --node-type entry --label "User Input" --entry-type api

# AI node
zeitflow workflow add-node \\
  --workflow 42 --node-type ai --label "Summarize" \\
  --config '{"model":"google/gemini-2.0-flash-001","systemPrompt":"You are a helpful assistant","userPrompt":"Summarize: {{User Input.text}}","outputType":"text","outputStructure":""}'

# Email node
zeitflow workflow add-node \\
  --workflow 42 --node-type email --label "Send Report" \\
  --config '{"to":["boss@company.com"],"subject":"Daily Summary","message":"{{Summarize.output}}"}'
\`\`\`

### Listing and removing

\`\`\`bash
# List all nodes in a workflow
zeitflow workflow list-nodes 42
zeitflow workflow nodes 42          # alias

# Remove a node (also removes its connections)
zeitflow workflow remove-node --workflow 42 --node ai_1700000002
\`\`\`

---

## Connecting Nodes

\`\`\`bash
# Basic connection
zeitflow workflow connect --workflow 42 --from entry_1 --to ai_2

# Condition branches use --source-handle
zeitflow workflow connect --workflow 42 --from condition_3 --to email_4 --source-handle true
zeitflow workflow connect --workflow 42 --from condition_3 --to sms_5 --source-handle false
\`\`\`

---

## AI Workflow Generation

Describe what you want in plain English and let AI build the entire workflow.

\`\`\`bash
# Generate from a description
zeitflow workflow generate "Accept a blog post via API, review it with AI for grammar, then email the feedback"

# Use a specific model
zeitflow workflow generate "Send weekly Slack digests" --model google/gemini-2.0-flash-001

# Modify an existing workflow
zeitflow workflow generate "Add an SMS fallback" --workflow 42

# Get the full structure for inspection
zeitflow workflow generate "Build a support triage system" --output json
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

## Templates — \`zeitflow template\`

Alias: \`tpl\`

| Command | Description |
|---------|-------------|
| \`zeitflow template list\` | Browse available templates |
| \`zeitflow template list --search "email"\` | Search by keyword |
| \`zeitflow template list --category "marketing"\` | Filter by category |
| \`zeitflow template get <ID>\` | View template details |
| \`zeitflow template use <ID>\` | Create a workflow from a template |
| \`zeitflow template use <ID> --name "My Copy"\` | ...with a custom name |
| \`zeitflow template create --workflow 42 --name "Triage" --category support\` | Save a workflow as a template |
| \`zeitflow template delete <ID>\` | Delete a template |

---

## Integrations — \`zeitflow integration\`

Alias: \`int\`

| Command | Description |
|---------|-------------|
| \`zeitflow integration list\` | Show all available integrations |
| \`zeitflow integration info <ID>\` | Config fields and env vars for an integration |
| \`zeitflow integration test slack\` | Test a Slack connection |

Available integrations: \`email\`, \`slack\`, \`sms\`, \`telegram\`, \`youtube\`, \`condition\`.

---

## Variable System

Nodes reference outputs from upstream nodes using the \`{{NodeLabel.field}}\` syntax in any text config field:

\`\`\`
{{User Input.email}}      # A field from an entry node
{{Summarize.output}}      # Output from an AI node
{{Classify.output}}       # Output from another AI node
\`\`\`

Variables are resolved at execution time based on the workflow's connection graph. Any node can reference the output of any node connected upstream of it.

---

## End-to-End Example

Build a support ticket router — takes a ticket, classifies it with AI, routes billing issues to the billing team and everything else to general support.

\`\`\`bash
# 1. Create the workflow
zeitflow workflow create --name "Support Router"
# -> Workflow created (id: 42)

# 2. Add an API entry point
zeitflow workflow add-node \\
  --workflow 42 --node-type entry --label "Ticket" --entry-type api

# 3. Add an AI classifier
zeitflow workflow add-node \\
  --workflow 42 --node-type ai --label "Classify" \\
  --config '{"model":"google/gemini-2.0-flash-001","systemPrompt":"Classify support tickets as billing, technical, or general. Reply with one word.","userPrompt":"Classify: {{Ticket.message}}","outputType":"text","outputStructure":""}'

# 4. Add a condition to check for billing
zeitflow workflow add-node \\
  --workflow 42 --node-type condition --label "Is Billing?" \\
  --config '{"leftValue":"{{Classify.output}}","operator":"contains","rightValue":"billing"}'

# 5. Add email nodes for each route
zeitflow workflow add-node \\
  --workflow 42 --node-type email --label "Billing Team" \\
  --config '{"to":["billing@company.com"],"subject":"Billing ticket","message":"{{Ticket.message}}"}'

zeitflow workflow add-node \\
  --workflow 42 --node-type email --label "General Team" \\
  --config '{"to":["support@company.com"],"subject":"Support ticket","message":"{{Ticket.message}}"}'

# 6. Wire it together (use the node IDs returned by add-node)
zeitflow workflow connect --workflow 42 --from entry_... --to ai_...
zeitflow workflow connect --workflow 42 --from ai_... --to condition_...
zeitflow workflow connect --workflow 42 --from condition_... --to email_billing --source-handle true
zeitflow workflow connect --workflow 42 --from condition_... --to email_general --source-handle false

# 7. Publish and run
zeitflow workflow publish 42
zeitflow workflow run 42 --input '{"message":"I was double-charged on my invoice"}'

# 8. Check the result
zeitflow execution get 99
zeitflow execution logs 99
\`\`\`

Or, skip all of that and generate it in one shot:

\`\`\`bash
zeitflow workflow generate "Take support tickets via API, classify them as billing or general using AI, email the billing team for billing issues and general support for everything else"
\`\`\`

---

## Tips for AI Agents

1. **Always use \`--output json\`** — parse structured data, not formatted tables
2. **Set \`ZEITFLOW_API_URL\` in your environment** to skip \`--api-url\` on every call
3. **Check \`zeitflow auth status --output json\`** before making API calls to confirm authentication
4. **Capture node IDs from \`add-node\` output** — you need them for \`connect\` calls
5. **Use \`zeitflow workflow generate\`** when you know what you want in natural language
6. **Use \`add-node\` + \`connect\`** when you need precise control over the graph
7. **Run \`--help\` on any command** to discover all available flags
8. **Aliases save keystrokes**: \`wf\` (workflow), \`exec\` (execution), \`tpl\` (template), \`int\` (integration), \`ls\` (list), \`rm\` (delete)

---

## Troubleshooting

**"Not authenticated. Run zeitflow auth login first."**
You haven't saved an API token yet. Run \`zeitflow auth login\` to open the browser and authenticate.

**"API error (401)"**
Your token is invalid or expired. Run \`zeitflow auth login\` to re-authenticate with a fresh token.

**"API error (429)"**
Rate limited. Wait a minute and try again. Workflows API allows 100 requests/hour.

**"Request failed"**
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
