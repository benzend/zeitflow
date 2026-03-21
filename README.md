<p align="center">
  <img src="public/logo-on-black.png" alt="ZeitFlow" width="120" />
</p>

<h1 align="center">ZeitFlow</h1>

<p align="center">
  The automation platform AI agents actually use.
</p>

<p align="center">
  <a href="https://www.zeitflow.io">Website</a> &middot;
  <a href="https://www.zeitflow.io/guides">Guides</a> &middot;
  <a href="https://www.zeitflow.io/blog">Blog</a>
</p>

---

ZeitFlow is an open-source workflow automation platform where every workflow you publish becomes an MCP tool that AI agents can discover and execute autonomously. Build visually, trigger via API/webhook/form, and let agents orchestrate the rest.

## Features

- **Agent-native** — Workflows are first-class tools AI agents discover and execute via MCP
- **Visual builder** — Drag-and-drop workflow editor built on React Flow
- **Multi-model AI** — GPT-4, Gemini, Claude, Llama, and more via OpenRouter
- **20+ integrations** — Email, Slack, SMS, Telegram, Google Sheets, YouTube, and more
- **API, webhook & form triggers** — Start workflows from anywhere
- **Conditional branching** — Route execution based on expressions
- **CLI & MCP packages** — `@zeitflow/cli` and `@zeitflow/mcp` on npm
- **Encrypted at rest** — AES-256-GCM encryption for API keys, OAuth tokens, and secrets
- **Full audit trail** — Structured execution logs on every run

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL (e.g. [Neon](https://neon.tech))

### Setup

```bash
# Clone the repo
git clone https://github.com/benzend/zeitflow.git
cd zeitflow

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values (see Environment Variables below)

# Generate an encryption key
openssl rand -hex 32
# Add the output as ENCRYPTION_KEY in .env.local

# Run database migrations
pnpm migrate

# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values.

**Required:**

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `ENCRYPTION_KEY` | 64-char hex string (`openssl rand -hex 32`) |
| `OPENROUTER_API_KEY` | [OpenRouter](https://openrouter.ai) API key for AI nodes |
| `NEXTAUTH_SECRET` | Random secret for NextAuth.js sessions |
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `HOST` | Same as above |

**Optional (enable integrations as needed):**

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth & Calendar |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Email via Resend |
| `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_SIGNING_SECRET` | Slack integration |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Payments |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob for asset storage |

See `.env.example` for the full list.

## Development

```bash
pnpm dev              # Start dev server (Turbopack)
pnpm build            # Production build
pnpm lint             # Lint
pnpm test             # Run tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report
pnpm migrate          # Run database migrations
```

## Architecture

ZeitFlow is a Next.js app (Pages Router, with App Router for blog/guides) using:

- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: NextAuth.js (Google OAuth + email/password)
- **Workflow editor**: React Flow (`@xyflow/react`)
- **AI**: OpenRouter + Vercel AI SDK
- **Integrations**: Plugin-based system in `lib/integrations/`
- **MCP server**: Streamable HTTP + stdio transports
- **CLI**: TypeScript CLI published as `@zeitflow/cli`

### Project Structure

```
pages/api/          # API routes (workflow CRUD, execution, auth, MCP)
lib/                # Core logic (encryption, integrations, workflow parser)
components/         # React components (workflow builder, node types)
migrations/         # Drizzle SQL migrations
cli-npm/            # @zeitflow/cli npm package
mcp/                # @zeitflow/mcp npm package + server
app/blog/           # Blog (App Router)
app/guides/         # Guides (App Router)
```

### Adding an Integration

1. Create a definition in `lib/integrations/definitions/`
2. Create an executor in `lib/integrations/executors/`
3. Add config keys to `INTEGRATION_CONFIG_KEYS` in `lib/integrations/types.ts`
4. Register in `lib/integrations/registry.ts`

## CLI

```bash
npm install -g @zeitflow/cli

zeitflow auth login          # Authenticate
zeitflow workflow list       # List workflows
zeitflow workflow execute    # Execute a workflow
zeitflow template list       # Browse templates
zeitflow doctor              # Check setup
```

## MCP

Every published workflow is automatically available as an MCP tool.

```bash
# Via npm package
npm install -g @zeitflow/mcp

# Or run locally
ZEITFLOW_API_TOKEN=your_token pnpm mcp
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT
