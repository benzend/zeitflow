# @zeitflow/cli

Command-line interface for [ZeitFlow](https://www.zeitflow.io) — manage workflows, executions, and MCP setup from your terminal.

Zero dependencies. Just authenticated HTTP requests to the ZeitFlow API.

## Installation

```bash
npm install -g @zeitflow/cli
```

Or run directly with npx:

```bash
npx @zeitflow/cli <command>
```

Requires Node.js 18+.

## Authentication

```bash
# Opens your browser to generate an API token
zeitflow auth login

# Or provide a token directly
zeitflow auth login --token zf_abc123...

# Check auth status
zeitflow auth status

# Log out
zeitflow auth logout
```

Credentials are stored in `~/.zeitflow/config.json` with `0600` permissions. You can also set the `ZEITFLOW_API_TOKEN` environment variable.

## Usage

### Workflows

```bash
zeitflow workflow list                        # List all workflows
zeitflow workflow list --status published     # Filter by status
zeitflow workflow get <id>                    # Get workflow details
zeitflow workflow create --name "My Workflow" # Create a workflow
zeitflow workflow run <id>                    # Execute a workflow
zeitflow workflow run <id> --input '{"key":"value"}'  # Execute with input data
zeitflow workflow publish <id>                # Publish a draft workflow
zeitflow workflow delete <id>                 # Delete a workflow
zeitflow workflow validate <id>              # Check for common issues
zeitflow workflow generate "description..."  # Generate from natural language
```

`wf` is an alias for `workflow` — e.g., `zeitflow wf list`.

### Node Management

```bash
# Add nodes (config is the inner config — CLI wraps it automatically)
zeitflow workflow add-node --workflow <id> --node-type ai --label "Summarize" \
  --config '{"model":"google/gemini-2.0-flash-001","userPrompt":"{{entry.content}}"}'

# Update a node's config, label, or entry fields
zeitflow workflow update-node --workflow <id> --node <nodeId> --label "New Label"
zeitflow workflow update-node --workflow <id> --node <nodeId> \
  --fields '[{"key":"name","name":"Name","type":"text"}]'

# Connect nodes
zeitflow workflow connect --workflow <id> --from <nodeId> --to <nodeId>
zeitflow workflow connect --workflow <id> --from <nodeId> --to <nodeId> --source-handle true

# List and remove nodes
zeitflow workflow list-nodes <id>
zeitflow workflow remove-node --workflow <id> --node <nodeId>
```

### Executions

```bash
zeitflow execution list --workflow <id>       # List executions
zeitflow execution get <id>                   # Get execution details
zeitflow execution logs <id>                  # View execution logs
zeitflow execution logs <id> --level error    # Filter by log level
zeitflow execution logs <id> --node "AI Step" # Filter by node
```

`exec` is an alias for `execution`.

### Templates

```bash
zeitflow template list                        # List templates
zeitflow template list --visibility public    # List public templates
zeitflow template get <id>                    # Get template details
zeitflow template use <id>                    # Create workflow from template
zeitflow template create --workflow <id> --name "Name" --category "Cat"  # Create template
zeitflow template delete <id>                 # Delete a template
```

`tpl` is an alias for `template`.

### Integrations

```bash
zeitflow integration list                     # List available integrations
zeitflow integration info <id>                # Show integration details
```

`int` is an alias for `integration`.

### Diagnostics

```bash
zeitflow doctor                               # Check config, auth, and connectivity
```

### MCP Setup

Generate MCP configuration for your AI editor or client:

```bash
zeitflow setup mcp                            # Print config
zeitflow setup mcp --client claude-desktop    # Target a specific client
zeitflow setup mcp --client cursor --save     # Write config to disk
```

Supported clients: `claude-desktop`, `claude-code`, `cursor`, `vscode`, `windsurf`.

### Output Format

All commands support `--output json` for machine-readable output:

```bash
zeitflow workflow list --output json
```

## Configuration

Config is stored at `~/.zeitflow/config.json`:

```json
{
  "token": "zf_abc123...",
  "url": "https://www.zeitflow.io"
}
```

**Token resolution order:**
1. `ZEITFLOW_API_TOKEN` env var
2. `~/.zeitflow/config.json`

**URL resolution order:**
1. `ZEITFLOW_URL` env var
2. `~/.zeitflow/config.json`
3. `https://www.zeitflow.io` (default)

## License

MIT
