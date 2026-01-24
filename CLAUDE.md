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
pnpm test:watch    # Watch mode
pnpm test:coverage # With coverage

# Database migrations
pnpm migrate

# Backfill asset metadata (dimensions, blur placeholders)
pnpm backfill-assets
```

## Architecture Overview

This is a Next.js application (Pages Router) that implements **ZeitFlow** - a visual workflow builder and AI automation platform. The application features both a legacy "Chains" system and a modern React Flow-based workflow builder with multiple node types.

### Core Systems

#### 1. Chains System (Legacy)
- **Chains**: Sequential AI prompt templates that users create
- **Chain Steps**: Individual prompts within a chain, processed by AI models
- **Queued Chains**: Chain instances queued for execution with variable substitution
- **Processing**: Asynchronous execution (up to 5 concurrent steps), recursive processing flow

#### 2. Workflow System (React Flow)
- **Visual Builder**: Drag-and-drop workflow creation using `@xyflow/react`
- **Node Types**:
  - `entry` - Data entry/form inputs with configurable fields (supports API, Form, and Webhook entry types)
  - `ai` - AI processing with model selection, prompts, output types
  - `scheduler` - Calendar scheduling with Google Calendar integration
  - `review` - Manual validation/approval steps
  - `email` - Email notifications via Resend
  - `slack` - Slack messaging via Slack Web API
  - `sms` - SMS/text messaging via Twilio
  - `telegram` - Telegram messaging via node-telegram-bot-api
- **Workflow Execution**: Track execution state through `workflow_executions` table with structured logging
- **Execution Logs**: Persisted in `logs` JSON column, viewable in execution details UI
- **YAML Parsing**: AI can generate workflows from natural language via `lib/workflow-parser.ts`

#### 3. Integration System (`lib/integrations/`)
Plugin-based architecture for workflow node integrations:
- **Registry** (`registry.ts`): Central registry for all integrations
- **Definitions** (`definitions/`): Individual integration configs (email, slack, sms)
- **Executors** (`executors/`): Execution logic for each integration
- **Logger** (`logger.ts`): Structured logging with `createIntegrationLogger()`
- **Types** (`types.ts`): `IntegrationDefinition`, `ExecutionContext`, `LogEntry`

To add a new integration:
1. Create definition in `lib/integrations/definitions/`
2. Create executor in `lib/integrations/executors/`
3. Register in `lib/integrations/registry.ts`

#### 4. Blog System
- **MDX Rendering**: Uses `next-mdx-remote` for blog content with custom components
- **Image Optimization**: Next.js Image with automatic dimension extraction and blur placeholders
- **Asset Management**: Centralized media storage via Vercel Blob, metadata in `assets` table
- **File Structure**: Blog content in `app/blog/` with create/edit/manage/preview routes

### Database Schema (Drizzle ORM + PostgreSQL)

**Authentication** (NextAuth.js):
- `users`, `accounts`, `sessions`, `verificationTokens`

**Chains (Legacy)**:
- `chains` - Chain templates
- `chain_steps` - Individual prompts
- `queues` - User queues
- `queued_chains` - Execution instances
- `queued_chain_steps` - Step execution records
- `queued_chain_variables` - Runtime variable values

**Workflows (React Flow)**:
- `workflows` - Workflow definitions (status: draft/published/archived)
- `workflow_nodes` - Visual nodes with type, position, config (JSON)
- `workflow_connections` - Edges between nodes
- `workflow_executions` - Execution history with status, logs (JSON array of LogEntry)

**Chat System**:
- `chat_threads` - Conversation grouping
- `chat_messages` - User/assistant messages for workflow creation

**Media & Subscriptions**:
- `assets` - Centralized media (width/height/blurDataURL for Next.js Image)
- `subscribers` - Email subscriptions
- `subscriptions`, `subscription_plans` - Stripe integration

**Integrations**:
- `slack_bots` - OAuth tokens for Slack workspace connections

### Key API Endpoints

**Chains (Legacy)**:
- `/api/add-to-queue` - Queue chain for execution
- `/api/process-queued-chain` - Process queued steps (concurrent)
- `/api/dashboard` - CRUD for chains
- `/api/chain-step` - CRUD for chain steps
- `/api/queued-chain` - Manage queued instances
- `/api/stop-chain`, `/api/resume-chain` - Control execution

**Workflows**:
- `/api/workflows` - CRUD for workflows (rate limited: 100 req/hr)

**Auth & User**:
- `/api/auth/[...nextauth]` - NextAuth.js handlers
- `/api/auth/register`, `/api/auth/verify-email` - Email/password registration
- `/api/delete-account` - Account deletion

**Other**:
- `/api/upload` - Asset upload with image processing (Sharp)
- `/api/subscribe` - Newsletter subscriptions

### AI Integration

- **Provider**: OpenRouter API (`@openrouter/ai-sdk-provider` + Vercel AI SDK)
- **Models**: Default is `google/gemini-2.0-flash-001`, configurable per node/step
- **Configuration**: See `lib/openrouter.ts` for chat function
- **Model List**: Maintained in `lib/constants.ts` as `AI_MODELS`

### Frontend Architecture

**Pages Router Structure**:
- `/dashboard` - Main chains management interface
- `/workflows` - Workflow list/management
- `/workflow/[id]/edit` - Visual workflow builder (React Flow)
- `/workflow/[id]/execution` - Execution view
- `/chain/[id]` - Chain editor
- `/assets` - Asset library
- `/settings` - User settings
- `app/blog/*` - Blog system (App Router coexistence)

**Key Components**:
- `components/WorkflowBuilderReactFlow.tsx` - Main workflow editor
- `components/reactflow-nodes/*` - Individual node type components
- `components/IntegrationConfigForm.tsx` - Auto-generated config forms for integrations
- `components/ExecutionLogViewer.tsx` - Structured log display with filtering
- `components/TypeaheadTextarea.tsx` - Variable reference autocomplete
- `lib/workflow-parser.ts` - Parse YAML workflow syntax from AI
- `lib/reactflow-types.ts` - Convert between NodeData and React Flow types

### React Flow Integration

- **State Management**: `useNodesState` and `useEdgesState` hooks
- **Node IDs**: Generated via `lib/workflow-utils.ts:generateNodeId()`
- **Conversion**: `convertToReactFlow()` / `convertFromReactFlow()` for persistence
- **Variable System**: Nodes can reference outputs from previous nodes using `{{nodeName.field}}` syntax

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

Required in `.env.local`:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `OPENROUTER_API_KEY` - OpenRouter API key
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `NEXTAUTH_URL` - App URL for OAuth callbacks
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token
- `HOST` - Application host URL

Optional integrations:
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - OAuth & Calendar API
- `RESEND_API_KEY` - Email sending
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` - SMS sending
- `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET` - Slack OAuth
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` - Payments
- `NEXT_PUBLIC_VEMETRIC_ID` - Analytics

### Development Notes

- **Dual Router**: Primarily Pages Router, with App Router for `/blog` only
- **TypeScript**: Strict mode enabled, paths configured with `@/` alias
- **Database Connection**: Uses Drizzle ORM with node-postgres driver
- **Turbopack**: Dev server uses `--turbopack` flag for faster builds
- **Memory**: Build requires 4GB heap (`NODE_OPTIONS='--max-old-space-size=4096'`)
- **MDX**: Uses Rust compiler (`experimental.mdxRs: true`)
- **Testing**: Jest + React Testing Library configured

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
- **Analytics**: Vemetric

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
