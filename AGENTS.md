# AGENTS.md

## Build/Lint/Test Commands
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build production version (NODE_OPTIONS='--max-old-space-size=4096')
- `pnpm lint` - Lint code with ESLint (Next.js core web vitals + TypeScript config)
- `pnpm test` - Run all tests with Jest
- `pnpm jest path/to/file.test.ts` - Run single test file
- `pnpm migrate` - Run database migrations (generate + migrate)

## Code Style Guidelines
- **TypeScript**: Strict mode, ES2017 target, explicit types required, no `any` types
- **Imports**: Use `@/` path alias for project root imports (tsconfig.json configured)
- **API Routes**: Check `getServerSession` first, apply `isRateLimited`, wrap in try-catch, return `{success, message}`
- **Database**: Use Drizzle ORM with parameterized queries, type inference from schema.ts
- **Error Handling**: Wrap database operations in try-catch, return structured error responses
- **Authentication**: Require session validation before protected operations
- **Rate Limiting**: Apply `isRateLimited` helper to API endpoints with appropriate windows
- **Naming**: camelCase for variables/functions, PascalCase for components/types/interfaces
- **Components**: Functional components with TypeScript, hooks over class components
- **Styling**: Tailwind CSS v4 with custom CSS variables for colors and animations
- **Validation**: Use Zod schemas for API request validation
- **Testing**: Jest with jsdom environment, coverage from components/pages/lib, __tests__ folder structure
