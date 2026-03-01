# @zeitflow/mcp

[Model Context Protocol](https://modelcontextprotocol.io) (MCP) server for [ZeitFlow](https://www.zeitflow.io) — let AI agents create, manage, and execute your workflows.

## Installation

```bash
npm install -g @zeitflow/mcp
```

Or run directly with npx:

```bash
npx @zeitflow/mcp
```

Requires Node.js 18+.

## Quick Start

1. **Get an API token** from [zeitflow.io/connect](https://www.zeitflow.io/connect), or use the CLI:

   ```bash
   npx @zeitflow/cli auth login
   ```

2. **Add to your AI client config:**

   ```json
   {
     "mcpServers": {
       "zeitflow": {
         "command": "npx",
         "args": ["@zeitflow/mcp"]
       }
     }
   }
   ```

   The server reads your token from `~/.zeitflow/config.json` (shared with `@zeitflow/cli`). You can also set it via environment variable:

   ```json
   {
     "mcpServers": {
       "zeitflow": {
         "command": "npx",
         "args": ["@zeitflow/mcp"],
         "env": {
           "ZEITFLOW_API_TOKEN": "zf_abc123..."
         }
       }
     }
   }
   ```

### Client Config Locations

| Client | Config path |
|--------|-------------|
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) |
| Claude Code | `.mcp.json` (project root) |
| Cursor | `~/.cursor/mcp.json` |
| VS Code | `.vscode/mcp.json` (project root) |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |

## Available Tools

### Discovery

| Tool | Description |
|------|-------------|
| `list_node_types` | List all workflow node types and their configuration |
| `list_ai_models` | List available AI models for AI nodes |

### Workflow CRUD

| Tool | Description |
|------|-------------|
| `create_workflow` | Create a new workflow with an entry node |
| `get_workflow` | Get workflow details (nodes, connections) |
| `list_workflows` | List workflows with optional status filter |
| `update_workflow` | Update workflow name, description, or status |
| `delete_workflow` | Delete a workflow and all related data |

### Node Management

| Tool | Description |
|------|-------------|
| `add_node` | Add a node to a workflow |
| `update_node` | Update node label, position, or config |
| `remove_node` | Remove a node and its connections |

### Connection Management

| Tool | Description |
|------|-------------|
| `connect_nodes` | Create an edge between two nodes |
| `remove_connection` | Remove a connection |

### Execution

| Tool | Description |
|------|-------------|
| `execute_workflow` | Run a workflow and get results |
| `get_execution` | Get execution details and logs |
| `list_executions` | List executions for a workflow |

### Bulk Creation

| Tool | Description |
|------|-------------|
| `create_workflow_from_template` | Create a complete workflow (nodes + connections) in one call |

## Configuration

**Token resolution order:**
1. `ZEITFLOW_API_TOKEN` env var
2. `~/.zeitflow/config.json`

**URL resolution order:**
1. `ZEITFLOW_URL` env var
2. `~/.zeitflow/config.json`
3. `https://www.zeitflow.io` (default)

## License

MIT
