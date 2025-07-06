# AGENTS.md

## Build/Lint/Test Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Lint code with ESLint
- `npm run migrate` - Run database migrations (generate + migrate)

## Code Style Guidelines

- **TypeScript**: Strict mode enabled, use proper types for all functions and variables
- **Imports**: Use `@/` path alias for project root imports (e.g., `@/lib/db`, `@/schema`)
- **API Routes**: Follow Next.js API pattern with proper HTTP method handling and error responses
- **Database**: Use Drizzle ORM with proper schema imports and type-safe queries
- **Error Handling**: Always wrap database operations in try-catch, return structured JSON responses
- **Authentication**: Check session with `getServerSession` before protected operations
- **Rate Limiting**: Apply rate limiting to API endpoints using `isRateLimited` helper
- **Naming**: Use camelCase for variables/functions, PascalCase for components/types
- **Components**: Use functional components with TypeScript, follow existing JSX patterns
- **Styling**: Use Tailwind CSS classes, follow existing color scheme (`#a3e635`, `#18181b`)

## Testing

- No specific test framework configured - check with user before adding tests
- Verify functionality manually through the application interface

## Database

- Uses Neon PostgreSQL with Drizzle ORM
- Schema defined in `schema.ts` with proper table relationships
- Always use parameterized queries and proper type inference
