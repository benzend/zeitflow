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
```

`wf` is an alias for `workflow` — e.g., `zeitflow wf list`.

### Executions

```bash
zeitflow execution list --workflow <id>       # List executions
zeitflow execution get <id>                   # Get execution details
zeitflow execution logs <id>                  # View execution logs
zeitflow execution logs <id> --level error    # Filter by log level
zeitflow execution logs <id> --node "AI Step" # Filter by node
```

`exec` is an alias for `execution`.

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
