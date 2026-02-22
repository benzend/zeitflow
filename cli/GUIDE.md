# ZeitFlow CLI Guide

Command-line interface for the ZeitFlow workflow automation platform. Designed for both humans and AI agents.

## Quick Start

```bash
# Build
cd cli && cargo build --release

# Authenticate (get your token from ZeitFlow Settings page)
zeitflow auth login --token <your-api-token>

# Point to your server (defaults to http://localhost:3000)
zeitflow auth set-url https://your-zeitflow-instance.com

# Verify
zeitflow auth status
```

## Global Options

Every command supports these flags:

| Flag | Description |
|------|-------------|
| `--output json` | Machine-readable JSON output (default: `text`) |
| `--api-url <URL>` | Override API URL for this call |
| `-h, --help` | Show help for any command |

The `ZEITFLOW_API_URL` environment variable can also set the API URL.

## Commands

### `zeitflow workflow` (alias: `wf`)

Manage workflows — the core resource in ZeitFlow.

#### List workflows

```bash
zeitflow workflow list
zeitflow workflow list --status published
zeitflow workflow list --status draft --output json
```

#### Create a workflow

```bash
zeitflow workflow create --name "Customer Onboarding"
zeitflow workflow create --name "Daily Report" --description "Summarizes metrics every morning"
```

Returns the new workflow ID.

#### Get workflow details

```bash
zeitflow workflow get 42
```

Returns the full workflow including all nodes and connections.

#### Delete a workflow

```bash
zeitflow workflow delete 42
```

#### Change workflow status

```bash
zeitflow workflow publish 42                    # draft -> published
zeitflow workflow publish 42 --status archived  # any -> archived
zeitflow workflow publish 42 --status draft     # back to draft
```

Valid statuses: `draft`, `published`, `archived`.

#### Execute a workflow

```bash
zeitflow workflow run 42
zeitflow workflow run 42 --input '{"email": "user@example.com", "name": "Alice"}'
zeitflow workflow run 42 --entry-node entry_1234
```

Returns an execution ID for tracking.

#### View execution statistics

```bash
zeitflow workflow stats 42
```

---

### Node Management

Nodes are the building blocks of a workflow. Each node has a type, a label, and type-specific configuration.

#### Add a node

```bash
zeitflow workflow add-node \
  --workflow 42 \
  --node-type entry \
  --label "User Input" \
  --entry-type form

zeitflow workflow add-node \
  --workflow 42 \
  --node-type ai \
  --label "Summarize" \
  --config '{"model":"google/gemini-2.0-flash-001","systemPrompt":"You are a helpful assistant","userPrompt":"Summarize: {{User Input.text}}","outputType":"text","outputStructure":""}'

zeitflow workflow add-node \
  --workflow 42 \
  --node-type email \
  --label "Send Report" \
  --config '{"to":["boss@company.com"],"subject":"Daily Summary","message":"{{Summarize.output}}"}'
```

Returns the generated node ID.

#### Node types and their config

| Type | Config Key | Required Fields |
|------|-----------|----------------|
| `entry` | (uses `--entry-type`) | `--entry-type`: `form`, `api`, or `webhook` |
| `ai` | `aiConfig` | `model`, `systemPrompt`, `userPrompt`, `outputType`, `outputStructure` |
| `email` | `emailConfig` | `to` (array), `subject`, `message` |
| `slack` | `slackConfig` | `channel`, `message` |
| `sms` | `smsConfig` | `to` (array), `message` |
| `telegram` | `telegramConfig` | `chatId`, `message` |
| `youtube` | `youtubeConfig` | `mode` (`fetch`/`comment`), `videoUrl`, `commentText` |
| `condition` | `conditionConfig` | `leftValue`, `operator`, `rightValue` |
| `scheduler` | `schedulerConfig` | `people`, `minTimeRequirement`, `calendar` |
| `review` | `reviewConfig` | `validationSteps` |

Condition operators: `equals`, `not_equals`, `contains`, `not_contains`, `greater_than`, `less_than`, `is_empty`, `is_not_empty`.

#### List nodes

```bash
zeitflow workflow list-nodes 42
zeitflow workflow nodes 42          # alias
```

#### Remove a node

```bash
zeitflow workflow remove-node --workflow 42 --node entry_1234
```

Automatically removes any connections to/from the deleted node.

#### Connect nodes

```bash
zeitflow workflow connect --workflow 42 --from entry_1234 --to ai_5678

# For condition nodes, specify which branch:
zeitflow workflow connect --workflow 42 --from condition_9999 --to email_1111 --source-handle true
zeitflow workflow connect --workflow 42 --from condition_9999 --to sms_2222 --source-handle false
```

---

### AI Workflow Generation

Generate entire workflows from natural language descriptions.

```bash
zeitflow workflow generate "When a form is submitted, use AI to classify the sentiment, then send a Slack message if negative"

# Use a specific model
zeitflow workflow generate "Send a weekly email digest" --model google/gemini-2.0-flash-001

# Modify an existing workflow
zeitflow workflow generate "Add an SMS notification step" --workflow 42

# Get the full proposed structure
zeitflow workflow generate "Build a customer support triage flow" --output json
```

---

### `zeitflow execution` (alias: `exec`)

Monitor and inspect workflow executions.

#### List executions

```bash
zeitflow execution list --workflow 42
```

#### Get execution details

```bash
zeitflow execution get 99
```

Shows status, input data, output data, errors, and log count.

#### View execution logs

```bash
zeitflow execution logs 99

# Filter by level
zeitflow execution logs 99 --level error
zeitflow execution logs 99 --level info

# Filter by node
zeitflow execution logs 99 --node ai_5678

# Combine filters
zeitflow execution logs 99 --level error --node email_1234

# Machine-readable
zeitflow execution logs 99 --output json
```

---

### `zeitflow template` (alias: `tpl`)

Reusable workflow templates.

#### List templates

```bash
zeitflow template list
zeitflow template list --category "marketing"
zeitflow template list --search "email" --visibility public
zeitflow template list --limit 10
```

#### Get template details

```bash
zeitflow template get 5
```

#### Create a workflow from a template

```bash
zeitflow template use 5
zeitflow template use 5 --name "My Custom Flow"
```

Creates a new draft workflow from the template and returns its ID.

#### Create a template from a workflow

```bash
zeitflow template create \
  --workflow 42 \
  --name "Support Triage" \
  --category "support" \
  --description "Classifies and routes support tickets" \
  --visibility public \
  --tags "support,ai,email"
```

#### Delete a template

```bash
zeitflow template delete 5
```

---

### `zeitflow integration` (alias: `int`)

Inspect available integrations and their configuration.

#### List integrations

```bash
zeitflow integration list
```

Output:
```
  ID         NAME       CATEGORY       DESCRIPTION
  email      Email      communication  Send emails via Resend
  slack      Slack      communication  Send messages via Slack Web API
  sms        SMS        communication  Send text messages via Twilio
  telegram   Telegram   communication  Send messages via Telegram Bot API
  youtube    YouTube    data           Fetch video data or post comments
  condition  Condition  utility        Conditional branching based on expressions
```

#### Get integration details

```bash
zeitflow integration info email
zeitflow integration info sms
```

Shows config fields and required environment variables.

#### Test an integration

```bash
zeitflow integration test slack
```

---

### `zeitflow auth`

Manage authentication and configuration.

```bash
zeitflow auth login --token <token>    # Save API token
zeitflow auth logout                   # Remove stored token
zeitflow auth status                   # Show auth state and API URL
zeitflow auth set-url <url>            # Set API server URL
```

Config is stored at `~/.config/zeitflow/config.json`.

---

## Variable System

Nodes reference outputs from upstream nodes using `{{NodeLabel.field}}` syntax in their config values.

```
{{User Input.email}}       # Field from an entry node
{{Summarize.output}}       # AI node output
{{Classifier.output}}      # Another AI node output
```

Variables are substituted at execution time. The available variables for any node are the outputs of all nodes connected upstream of it.

---

## End-to-End Example

Build a workflow that takes a support ticket, classifies it with AI, and routes it:

```bash
# 1. Create the workflow
zeitflow workflow create --name "Support Router"
# -> Workflow created (id: 42)

# 2. Add an entry node for the ticket
zeitflow workflow add-node \
  --workflow 42 --node-type entry --label "Ticket" --entry-type api
# -> Node 'Ticket' added (id: entry_1700000001)

# 3. Add an AI classifier
zeitflow workflow add-node \
  --workflow 42 --node-type ai --label "Classify" \
  --config '{"model":"google/gemini-2.0-flash-001","systemPrompt":"Classify support tickets as billing, technical, or general","userPrompt":"Classify: {{Ticket.message}}","outputType":"text","outputStructure":""}' \
  --x 250 --y 350
# -> Node 'Classify' added (id: ai_1700000002)

# 4. Add a condition to check if it's billing
zeitflow workflow add-node \
  --workflow 42 --node-type condition --label "Is Billing?" \
  --config '{"leftValue":"{{Classify.output}}","operator":"contains","rightValue":"billing"}' \
  --x 250 --y 500
# -> Node 'Is Billing?' added (id: condition_1700000003)

# 5. Add email nodes for each route
zeitflow workflow add-node \
  --workflow 42 --node-type email --label "Billing Team" \
  --config '{"to":["billing@company.com"],"subject":"Billing ticket","message":"{{Ticket.message}}"}' \
  --x 100 --y 650

zeitflow workflow add-node \
  --workflow 42 --node-type email --label "General Team" \
  --config '{"to":["support@company.com"],"subject":"Support ticket","message":"{{Ticket.message}}"}' \
  --x 400 --y 650

# 6. Wire it all together
zeitflow workflow connect --workflow 42 --from entry_1700000001 --to ai_1700000002
zeitflow workflow connect --workflow 42 --from ai_1700000002 --to condition_1700000003
zeitflow workflow connect --workflow 42 --from condition_1700000003 --to email_1700000004 --source-handle true
zeitflow workflow connect --workflow 42 --from condition_1700000003 --to email_1700000005 --source-handle false

# 7. Publish and run
zeitflow workflow publish 42
zeitflow workflow run 42 --input '{"message": "I was double-charged on my last invoice"}'
# -> Execution started (id: 99)

# 8. Check the result
zeitflow execution get 99
zeitflow execution logs 99
```

Or, do it in one shot with AI:

```bash
zeitflow workflow generate "Take support tickets via API, classify them as billing/technical/general using AI, email the billing team for billing issues and the general support team for everything else"
```

---

## For AI Agents

Tips for programmatic use:

1. **Always use `--output json`** for parseable responses
2. **Use `ZEITFLOW_API_URL` env var** to avoid passing `--api-url` on every call
3. **Check `zeitflow auth status --output json`** before making API calls
4. **Use `zeitflow workflow generate`** when you know what you want in plain English
5. **Use `zeitflow workflow add-node` + `connect`** when you need precise control
6. **Node IDs are returned** from `add-node` — capture them for `connect` calls
7. **Use `--help`** on any command to discover flags
