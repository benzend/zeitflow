# AGENTS.md

## Build/Lint/Test Commands
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build production version
- `pnpm start` - Start production server
- `pnpm lint` - Lint code with ESLint
- `pnpm migrate` - Run database migrations (generate + migrate)
- `pnpm test` - Run all tests with Jest
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm jest path/to/file.test.ts` - Run single test file

## Code Style Guidelines
- **TypeScript**: Strict mode enabled, use explicit types for all functions/variables
- **Imports**: Use `@/` path alias for project root imports (e.g., `@/lib/db`, `@/schema`)
- **API Routes**: Check `getServerSession` first, apply `isRateLimited`, wrap operations in try-catch, return structured JSON responses
- **Database**: Use Drizzle ORM with parameterized queries and proper type inference from schema.ts
- **Error Handling**: Always wrap database operations in try-catch, return `{success: false, message: string}` on errors
- **Authentication**: Require session validation before protected operations
- **Rate Limiting**: Apply to API endpoints using `isRateLimited` helper with 1-hour windows
- **Naming**: camelCase for variables/functions, PascalCase for components/types/interfaces
- **Components**: Functional components with TypeScript, use hooks over class components
- **Styling**: Tailwind CSS with custom colors (primary: #a3e635, background: #2B2B2B, foreground: #434343)
- **Formatting**: Follow existing patterns, use consistent spacing and JSX structure

## Cursor Rules (.cursor.json)
- Project: "jjoist" - AI prompt chain management system
- Architecture: Queue → Chain → Step → Result hierarchy
- Design reference: Figma link in .cursor.json
- Key considerations: OpenAI integration, rate limits, token usage tracking
