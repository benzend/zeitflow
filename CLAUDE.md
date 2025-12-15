# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build production version
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Run database migrations
npm run migrate
```

## Architecture Overview

This is a Next.js application that implements an AI chain processing system called "ZeitFlow". The application allows users to create, manage, and execute chains of AI prompts that are processed asynchronously.

### Core Concepts

- **Chains**: Collections of sequential AI prompts (chain steps) that users can create and manage
- **Chain Steps**: Individual prompts within a chain that get processed by AI (GPT-4o via OpenRouter)
- **Queued Chains**: Instances of chains that are queued for execution
- **Queue Processing**: Asynchronous execution system that processes up to 5 chain steps concurrently

### Database Schema

The application uses Drizzle ORM with PostgreSQL (Neon serverless). Key tables:

- `users` - User accounts
- `chains` - Template definitions of AI prompt sequences
- `chain_steps` - Individual prompts within a chain
- `queues` - User-specific processing queues
- `queued_chains` - Instances of chains ready for execution
- `queued_chain_steps` - Individual step execution records with status tracking
- `rate_limits` - API rate limiting data
- `subscribers` - Email subscriptions

### Key API Endpoints

- `/api/add-to-queue` - Queues a chain for execution
- `/api/process-queued-chain` - Processes queued chain steps (up to 5 concurrent)
- `/api/dashboard` - CRUD operations for chains and queue management
- `/api/chain-step` - CRUD operations for individual chain steps
- `/api/queued-chain` - Management of queued chain instances

### Processing Flow

1. User creates a chain with multiple steps
2. Chain is added to queue via `/api/add-to-queue`
3. `/api/process-queued-chain` processes steps concurrently (max 5)
4. Each step calls OpenRouter's GPT-4o API
5. Results are stored and system recursively processes remaining steps
6. Chain marked as completed when all steps finish

### Rate Limiting

- Add to queue: 20 requests per IP per hour
- Process queue: 20 requests per IP per hour
- Implemented using custom rate limiting with database storage

### Frontend Structure

- Dashboard (`/dashboard`) - Main interface for chain management
- Chain detail (`/chain/[id]`) - Individual chain editing and step management
- Uses Next.js Pages Router with TypeScript and Tailwind CSS

### External Dependencies

- **OpenRouter API**: AI processing via GPT-4o model
- **Neon Database**: Serverless PostgreSQL hosting
- **Environment Variables**: `DATABASE_URL`, `OPENROUTER_API_KEY`, `HOST`

### Development Notes

- Database connection logs are enabled in development (`lib/db.ts:9`)
- AI processing is recursive - each completed step triggers the next batch
- Error handling preserves chain execution flow (errors don't stop the queue)
- Concurrent processing limit prevents API overload

### Stripe Subscription Details

- Subscription management integrated into the platform
- Tracks user subscription status and features
- Handles recurring billing and plan upgrades/downgrades
