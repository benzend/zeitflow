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
];

export function getGuide(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}

export function getAllGuides(): Guide[] {
  return guides;
}
