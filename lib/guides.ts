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

ZeitFlow ships with a **Model Context Protocol (MCP)** server that lets AI agents — like Claude Desktop and Claude Code — create, configure, and execute workflows on your behalf.

Once connected, you can say things like *"Create a workflow that takes a blog topic, generates an outline with AI, then emails me the result"* and the agent will build it directly in ZeitFlow.

---

## Prerequisites

- A **ZeitFlow account** with at least one workflow (so you know the system)
- **Node.js 18+** and **pnpm** installed
- The ZeitFlow repository cloned locally
- Your **database URL** (the same \`DATABASE_URL\` used by the app)

---

## Step 1: Get your API Token

1. Log in to ZeitFlow and open any workflow
2. Go to the **Execution** tab
3. Your API token is displayed under **"Your API Token"**
4. If you don't have one yet, click **"Generate API Token"**

Copy this token — you'll need it in the next step.

---

## Step 2: Install dependencies

If you haven't already, install the project dependencies:

\`\`\`bash
pnpm install
\`\`\`

---

## Step 3: Configure your MCP client

### Claude Desktop

Add the following to your Claude Desktop config file:

- **macOS**: \`~/Library/Application Support/Claude/claude_desktop_config.json\`
- **Windows**: \`%APPDATA%\\Claude\\claude_desktop_config.json\`

\`\`\`json
{
  "mcpServers": {
    "zeitflow": {
      "command": "pnpm",
      "args": ["mcp"],
      "cwd": "/path/to/zeitflow",
      "env": {
        "ZEITFLOW_API_TOKEN": "your-api-token-here",
        "DATABASE_URL": "your-database-url-here"
      }
    }
  }
}
\`\`\`

> Replace \`/path/to/zeitflow\` with the absolute path to your cloned ZeitFlow repo.

Restart Claude Desktop after saving. You should see "zeitflow" appear in the MCP tools menu (the hammer icon).

### Claude Code

Add a \`.mcp.json\` file in your project root (or \`~/.claude/mcp.json\` for global access):

\`\`\`json
{
  "mcpServers": {
    "zeitflow": {
      "command": "pnpm",
      "args": ["mcp"],
      "cwd": "/path/to/zeitflow",
      "env": {
        "ZEITFLOW_API_TOKEN": "your-api-token-here",
        "DATABASE_URL": "your-database-url-here"
      }
    }
  }
}
\`\`\`

### Run directly from terminal

You can also test the MCP server standalone:

\`\`\`bash
ZEITFLOW_API_TOKEN=your-token DATABASE_URL=your-db-url pnpm mcp
\`\`\`

If configured correctly you'll see:

\`\`\`
ZeitFlow MCP server running (user: you@example.com)
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
- **ai** — AI processing. Set the model, system prompt, user prompt, and output type (text, JSON, markdown)
- **email** — Send emails via Resend. Configure to, subject, and message body
- **slack** — Post to Slack channels. Requires a connected Slack workspace
- **sms** — Send SMS via Twilio. Configure phone number and message
- **telegram** — Send Telegram messages. Configure chat ID and message
- **youtube** — Fetch video data or post comments
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

## Important Notes

- **\`execute_workflow\` requires the Next.js app to be running** — it delegates to the \`/api/workflow/[id]/execute\` HTTP endpoint. All other tools talk directly to the database.
- The MCP server uses **stdio transport**, which is the standard for CLI and desktop MCP clients.
- Each MCP session authenticates as **one user** via the API token. The agent can only access that user's workflows.
- Workflows created via MCP start in **draft** status. Use \`update_workflow\` to publish them when ready.

---

## Troubleshooting

**"DATABASE_URL environment variable is required"**
You need to pass the \`DATABASE_URL\` env var. Check your \`.env.local\` file for the value.

**"ZEITFLOW_API_TOKEN environment variable is required"**
Set your API token. Find it in the Execution tab of any workflow in the ZeitFlow UI.

**"Invalid ZEITFLOW_API_TOKEN – no matching user found"**
Your token doesn't match any user in the database. Generate a fresh one from the UI.

**"Failed to reach execution endpoint"**
The \`execute_workflow\` tool needs the ZeitFlow Next.js server running (\`pnpm dev\`). Other tools work without it.

**Claude Desktop doesn't show zeitflow tools**
Make sure \`cwd\` points to the correct directory. Restart Claude Desktop after editing the config. Check the MCP logs for errors.
`,
  },
  {
    slug: "cli",
    title: "ZeitFlow CLI — Build Workflows from the Terminal",
    excerpt:
      "Install and use the ZeitFlow Rust CLI to create, manage, and execute workflows from the command line. Designed for both humans and AI agents.",
    icon: "⌨️",
    publishedAt: "2026-02-22",
    updatedAt: "2026-02-22",
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
- A running ZeitFlow instance (local or hosted)

---

## Quick Start

\`\`\`bash
# 1. Point to your ZeitFlow instance
zeitflow auth set-url https://your-zeitflow.example.com

# 2. Authenticate (get your token from Settings in the ZeitFlow UI)
zeitflow auth login --token your-api-token

# 3. Verify
zeitflow auth status

# 4. List your workflows
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
| \`zeitflow auth login --token <TOKEN>\` | Save your API token locally |
| \`zeitflow auth logout\` | Remove stored credentials |
| \`zeitflow auth status\` | Show current auth state and API URL |
| \`zeitflow auth set-url <URL>\` | Set the ZeitFlow server URL |

Configuration is stored at \`~/.config/zeitflow/config.json\`.

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
| \`ai\` | \`aiConfig\` | \`model\`, \`systemPrompt\`, \`userPrompt\`, \`outputType\`, \`outputStructure\` |
| \`email\` | \`emailConfig\` | \`to\` (array), \`subject\`, \`message\` |
| \`slack\` | \`slackConfig\` | \`channel\`, \`message\` |
| \`sms\` | \`smsConfig\` | \`to\` (array), \`message\` |
| \`telegram\` | \`telegramConfig\` | \`chatId\`, \`message\` |
| \`youtube\` | \`youtubeConfig\` | \`mode\` (\`fetch\`/\`comment\`), \`videoUrl\`, \`commentText\` |
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
You haven't saved an API token yet. Get one from the Settings page in the ZeitFlow UI.

**"API error (401)"**
Your token is invalid or expired. Generate a new one from the UI and run \`zeitflow auth login --token <new-token>\`.

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
