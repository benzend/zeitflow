# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Important:** This project uses `pnpm` as the package manager. Do not use `npm`.

```bash
# Install dependencies
pnpm install

# Start development server with Turbopack
pnpm dev

# Build production version (with increased memory for large builds)
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint

# Run tests
pnpm test
pnpm test:watch              # Watch mode
pnpm test:coverage           # With coverage
pnpm test -- path/to/file    # Run single test file

# Database migrations
pnpm migrate

# Backfill asset metadata (dimensions, blur placeholders)
pnpm backfill-assets

# Start MCP server (for AI agent integration)
ZEITFLOW_API_TOKEN=<token> pnpm mcp
```

### Rust CLI (`cli/`)

```bash
cd cli && cargo build                         # Dev build
cd cli && cargo build --release               # Release build
cd cli && cargo test                          # Run tests

# Usage
./cli/target/debug/zeitflow auth login        # Browser-based login, saves to ~/.zeitflow/config.json
./cli/target/debug/zeitflow workflow list      # List workflows
./cli/target/debug/zeitflow --api-url http://localhost:3000 workflow list  # Local dev
```

### MCP npm package (`mcp/`)

```bash
cd mcp && pnpm build                          # Compile cli.ts → dist/cli.js
cd mcp && npm publish --access public         # Publish @zeitflow/mcp
```

## Architecture Overview

This is a Next.js application (Pages Router) that implements **ZeitFlow** — a visual workflow builder and AI automation platform. The application features both a legacy "Chains" system and a modern React Flow-based workflow builder with multiple node types.

### Shared Config (`~/.zeitflow/config.json`)

Both the Rust CLI and the `@zeitflow/mcp` npm package read from the same config file:

```json
{ "token": "zf_abc123...", "url": "https://www.zeitflow.io" }
```

**Token resolution** (CLI and MCP both follow this order):
1. `ZEITFLOW_API_TOKEN` env var (highest priority)
2. `~/.zeitflow/config.json` → `token` field

**URL resolution:**
1. `ZEITFLOW_URL` env var (or `--api-url` flag for CLI)
2. `~/.zeitflow/config.json` → `url` field
3. `https://www.zeitflow.io` (default)

The CLI's `zeitflow auth login` command opens the browser to `/connect`, prompts the user to paste a token, validates it, and saves to this file with `0600` permissions.

Legacy config at `~/.config/zeitflow/config.json` (old field names `api_token`/`api_url`) is auto-migrated on first load.

### Core Systems

#### 1. Chains System (Legacy)
- **Chains**: Sequential AI prompt templates that users create
- **Chain Steps**: Individual prompts within a chain, processed by AI models
- **Queued Chains**: Chain instances queued for execution with variable substitution
- **Processing**: Asynchronous execution (up to 5 concurrent steps), recursive processing flow

#### 2. Workflow System (React Flow)
- **Visual Builder**: Drag-and-drop workflow creation using `@xyflow/react`
- **Node Types**:
  - `entry` — Data entry/form inputs (supports API, Form, and Webhook entry types)
  - `ai` — AI processing with model selection, prompts, output types
  - `scheduler` — Calendar scheduling with Google Calendar integration
  - `review` — Manual validation/approval steps
  - `email` — Email notifications via Resend
  - `slack` — Slack messaging via Slack Web API
  - `sms` — SMS/text messaging via Twilio
  - `telegram` — Telegram messaging via node-telegram-bot-api
  - `youtube` — Fetch video data or post comments via YouTube API
  - `condition` — Conditional branching based on expressions
- **Workflow Execution**: Track execution state through `workflow_executions` table with structured logging
- **Execution Logs**: Persisted in `logs` JSON column, viewable in execution details UI
- **YAML Parsing**: AI can generate workflows from natural language via `lib/workflow-parser.ts`

#### 3. MCP Server

Three entry points, all sharing tool definitions in `mcp/create-server.ts`:

| Entry Point | Transport | Needs DB? | Use Case |
|---|---|---|---|
| `pages/api/mcp.ts` | Streamable HTTP | No (uses app DB) | Production — clients connect via URL + Bearer token |
| `mcp/server.ts` | stdio | Yes (`DATABASE_URL`) | Local dev — run with `pnpm mcp` |
| `mcp/cli.ts` | stdio → HTTP bridge | No | Published as `@zeitflow/mcp` on npm |

- **Authentication**: Via `ZEITFLOW_API_TOKEN` env var or `~/.zeitflow/config.json` (user's API token, generated at `/connect`)
- **Tools**:
  - `list_node_types` / `list_ai_models` — Discovery
  - `create_workflow` / `get_workflow` / `list_workflows` / `update_workflow` / `delete_workflow` — Workflow CRUD
  - `add_node` / `update_node` / `remove_node` — Node management
  - `connect_nodes` / `remove_connection` — Connection management
  - `execute_workflow` / `get_execution` / `list_executions` — Execution
  - `create_workflow_from_template` — Bulk creation of a complete workflow with nodes and connections in one call

#### 4. Rust CLI (`cli/`)

Native command-line client that uses the same shared config and talks to the ZeitFlow HTTP API.

- **Commands**: `workflow` (wf), `execution` (exec), `integration` (int), `template` (tpl), `auth`
- **Config**: `cli/src/config.rs` — loads/saves `~/.zeitflow/config.json`
- **HTTP Client**: `cli/src/client.rs` — wraps `reqwest` with Bearer token auth
- **Output**: `--output text` (default) or `--output json` for machine consumption
- **API URL override**: `--api-url` flag or `ZEITFLOW_API_URL` env var (for local dev)

#### 5. Integration System (`lib/integrations/`)

Plugin-based architecture for workflow node integrations:
- **Registry** (`registry.ts`): Central registry for all integrations
- **Definitions** (`definitions/`): Individual integration configs (email, slack, sms)
- **Executors** (`executors/`): Execution logic for each integration
- **Logger** (`logger.ts`): Structured logging with `createIntegrationLogger()`
- **Types** (`types.ts`): `IntegrationDefinition`, `ExecutionContext`, `LogEntry`

To add a new integration:
1. Create definition in `lib/integrations/definitions/` (export from `index.ts`)
2. Create executor in `lib/integrations/executors/` (export from `index.ts`, add to `integrationExecutors` map)
3. Add config key to `INTEGRATION_CONFIG_KEYS` in `lib/integrations/types.ts`
4. Register in `lib/integrations/registry.ts`

#### 6. Blog System
- **MDX Rendering**: Uses `next-mdx-remote` with `remark-gfm` (tables) and `rehype-pretty-code` (syntax highlighting)
- **Image Optimization**: Next.js Image with automatic dimension extraction and blur placeholders
- **Asset Management**: Centralized media storage via Vercel Blob, metadata in `assets` table
- **File Structure**: Blog content in `app/blog/` with create/edit/manage/preview routes
- **Guides**: Static content defined in `lib/guides.ts`, rendered at `app/guides/`

### Database Schema (Drizzle ORM + PostgreSQL)

**Authentication** (NextAuth.js):
- `users`, `accounts`, `sessions`, `verificationTokens`

**Chains (Legacy)**:
- `chains` — Chain templates
- `chain_steps` — Individual prompts
- `queues` — User queues
- `queued_chains` — Execution instances
- `queued_chain_steps` — Step execution records
- `queued_chain_variables` — Runtime variable values

**Workflows (React Flow)**:
- `workflows` — Workflow definitions (status: draft/published/archived)
- `workflow_nodes` — Visual nodes with type, position, config (JSON)
- `workflow_connections` — Edges between nodes
- `workflow_executions` — Execution history with status, logs (JSON array of LogEntry)

**Chat System**:
- `chat_threads` — Conversation grouping
- `chat_messages` — User/assistant messages for workflow creation

**Media & Subscriptions**:
- `assets` — Centralized media (width/height/blurDataURL for Next.js Image)
- `subscribers` — Email subscriptions
- `subscriptions`, `subscription_plans` — Stripe integration

**Integrations**:
- `slack_bots` — OAuth tokens for Slack workspace connections

### Key API Endpoints

**Chains (Legacy)**:
- `/api/add-to-queue` — Queue chain for execution
- `/api/process-queued-chain` — Process queued steps (concurrent)
- `/api/dashboard` — CRUD for chains
- `/api/chain-step` — CRUD for chain steps
- `/api/queued-chain` — Manage queued instances
- `/api/stop-chain`, `/api/resume-chain` — Control execution

**Workflows**:
- `/api/workflows` — CRUD for workflows (rate limited: 100 req/hr)
- `/api/mcp` — MCP Streamable HTTP endpoint (Bearer token auth)

**Auth & User**:
- `/api/auth/[...nextauth]` — NextAuth.js handlers
- `/api/auth/register`, `/api/auth/verify-email` — Email/password registration
- `/api/delete-account` — Account deletion

**Other**:
- `/api/upload` — Asset upload with image processing (Sharp)
- `/api/subscribe` — Newsletter subscriptions

### AI Integration

- **Provider**: OpenRouter API (`@openrouter/ai-sdk-provider` + Vercel AI SDK)
- **Models**: Default is `google/gemini-2.0-flash-001`, configurable per node/step
- **Configuration**: See `lib/openrouter.ts` for chat function
- **Model List**: Maintained in `lib/constants.ts` as `AI_MODELS`

### Frontend Architecture

**Pages Router Structure**:
- `/dashboard` — Main chains management interface
- `/workflows` — Workflow list/management
- `/workflow/[id]/edit` — Visual workflow builder (React Flow)
- `/workflow/[id]/execution` — Execution view
- `/chain/[id]` — Chain editor
- `/assets` — Asset library
- `/settings` — User settings
- `app/blog/*` — Blog system (App Router coexistence)
- `app/guides/*` — Static guides (App Router)

**Key Components**:
- `components/WorkflowBuilderReactFlow.tsx` — Main workflow editor
- `components/reactflow-nodes/*` — Individual node type components
- `components/IntegrationConfigForm.tsx` — Auto-generated config forms for integrations
- `components/ExecutionLogViewer.tsx` — Structured log display with filtering
- `components/TypeaheadTextarea.tsx` — Variable reference autocomplete
- `components/blog/MDXClientRenderer.tsx` — MDX rendering with GFM tables and syntax highlighting
- `lib/workflow-parser.ts` — Parse YAML workflow syntax from AI
- `lib/reactflow-types.ts` — Convert between NodeData and React Flow types
- `lib/mdx-components.tsx` — Custom MDX component mapping (headings, tables, code blocks, etc.)
- `lib/guides.ts` — Static guide content definitions

### React Flow Integration

- **State Management**: `useNodesState` and `useEdgesState` hooks
- **Node IDs**: Generated via `lib/workflow-utils.ts:generateNodeId()`
- **Conversion**: `convertToReactFlow()` / `convertFromReactFlow()` for persistence
- **Variable System**: Nodes reference previous outputs using `{{nodeName.field}}` syntax. Node labels are converted to snake_case (e.g., "Support Ticket" → `{{support_ticket.subject}}`)

### Rate Limiting

Implemented via `lib/rate-limit.ts` with database storage:
- Add to queue: 20 req/hr per IP
- Process queue: 20 req/hr per IP
- Workflows API: 100 req/hr per IP

### Image Processing Pipeline

1. **Upload** (`/api/upload`):
   - Store in Vercel Blob
   - Extract dimensions via `image-size`
   - Generate blur placeholder via Sharp
   - Save metadata to `assets` table

2. **Rendering**:
   - MDX content enhanced by `lib/mdx-enhancer.ts`
   - Image metadata injected from database
   - Rendered via `lib/mdx-components.tsx` with Next.js Image

3. **Backfill**: Run `pnpm backfill-assets` to process existing images

### Environment Variables

Required in `.env.local` (see `.env.example` for full list):
- `DATABASE_URL` — Neon PostgreSQL connection string
- `OPENROUTER_API_KEY` — OpenRouter API key
- `NEXTAUTH_SECRET` — NextAuth.js secret
- `NEXTAUTH_URL` — App URL for OAuth callbacks
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob storage token
- `HOST` — Application host URL

Optional integrations:
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — OAuth & Calendar API
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` — Email sending
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` — SMS sending
- `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_SIGNING_SECRET`, `SLACK_STATE_SECRET` — Slack OAuth
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Payments
- `NEXT_PUBLIC_APP_URL` — Public app URL for SEO/social sharing
- `NEXT_PUBLIC_VEMETRIC_TOKEN`, `VEMETRIC_TOKEN` — Vemetric analytics
- `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` — Google Analytics

### Development Notes

- **Dual Router**: Primarily Pages Router, with App Router for `/blog` and `/guides`
- **TypeScript**: Strict mode enabled, paths configured with `@/` alias
- **Database Connection**: Uses Drizzle ORM with node-postgres driver
- **Turbopack**: Dev server uses `--turbopack` flag for faster builds
- **Memory**: Build requires 4GB heap (`NODE_OPTIONS='--max-old-space-size=4096'`)
- **MDX**: Uses Rust compiler (`experimental.mdxRs: true`)
- **Testing**: Jest + React Testing Library; `jest.setup.js` mocks `ResizeObserver` for React Flow tests

### External Services

- **Database**: Neon (serverless PostgreSQL)
- **Storage**: Vercel Blob (images/assets)
- **AI**: OpenRouter (multi-model support)
- **Auth**: NextAuth.js (credentials + OAuth)
- **Email**: Resend
- **SMS**: Twilio
- **Payments**: Stripe
- **Calendar**: Google Calendar API
- **Chat**: Slack Web API
- **Analytics**: Vemetric, Google Analytics

### Workflow Execution Flow

1. User creates workflow via visual builder
2. Workflow saved as nodes + connections in database
3. Execution triggered → creates `workflow_executions` record
4. System traverses node graph (BFS with topological ordering):
   - Entry nodes collect initial data
   - AI nodes call OpenRouter with previous outputs as context
   - Integration nodes (email/slack/sms) execute via unified executor
   - Each node logs to structured `LogEntry[]` with timestamps, levels, data
5. Logs aggregated and persisted to `workflow_executions.logs`
6. Status tracked through execution lifecycle (pending → running → completed/failed)
7. Execution details page displays logs with level filtering (debug hidden by default)

### Chain Processing Flow (Legacy)

1. User creates chain with multiple steps
2. Chain added to queue via `/api/add-to-queue` with variables
3. `/api/process-queued-chain` processes up to 5 steps concurrently
4. Each step calls OpenRouter API
5. Results stored, recursive processing continues
6. Chain marked completed when all steps finish

### Subscription System

- Stripe integration for recurring billing
- Plan features stored in `subscription_plans` table
- User subscriptions tracked in `subscriptions` table
- Rate limits can vary by plan (via `queueLimit` field)
