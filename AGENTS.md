# AGENTS.md

## Build/Lint/Test Commands
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build production version (NODE_OPTIONS='--max-old-space-size=4096')
- `pnpm start` - Start production server
- `pnpm lint` - Lint code with ESLint (Next.js core web vitals + TypeScript config)
- `pnpm migrate` - Run database migrations (generate + migrate)
- `pnpm test` - Run all tests with Jest
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm jest path/to/file.test.ts` - Run single test file

## Code Style Guidelines
- **TypeScript**: Strict mode enabled, explicit types required, ES2017 target
- **Imports**: Use `@/` path alias for project root imports (configured in tsconfig.json)
- **API Routes**: Check `getServerSession` first, apply `isRateLimited`, wrap in try-catch, return structured JSON
- **Database**: Use Drizzle ORM with parameterized queries, type inference from schema.ts
- **Error Handling**: Wrap database operations in try-catch, return `{success: false, message: string}`
- **Authentication**: Require session validation before protected operations
- **Rate Limiting**: Apply `isRateLimited` helper with appropriate windows to API endpoints
- **Naming**: camelCase for variables/functions, PascalCase for components/types/interfaces
- **Components**: Functional components with TypeScript, hooks over class components
- **Styling**: Tailwind CSS v4 with custom CSS variables for colors and animations
- **Validation**: Use Zod schemas for API request validation
- **Testing**: Jest with jsdom environment, coverage from components/pages/lib, __tests__ folder structure

## Project Context
- **Name**: "ZeitFlow" - AI prompt chain management system
- **Architecture**: Queue → Chain → Step → Result hierarchy
- **Tech Stack**: Next.js 16, React 19, Drizzle ORM, NextAuth, TypeScript, Tailwind CSS
- **Key Integrations**: OpenRouter AI, Stripe, Google Calendar, Neon Database
