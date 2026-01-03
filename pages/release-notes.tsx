import Head from "next/head";
import { Button } from "@/components/Button";

type ReleaseNote = {
  version: string;
  date: string;
  features: string[];
  improvements: string[];
  fixes: string[];
};

const releaseNotes: ReleaseNote[] = [
  {
    version: "1.9.0",
    date: "2026-01-03",
    features: [
      "Added Email nodes for sending automated emails directly from workflows via Resend",
      "Added Slack nodes for posting messages to Slack channels from workflows",
      "Implemented Slack Bot Manager with OAuth integration for workspace connections",
      "Added blog post preview mode with dedicated preview page and real-time MDX rendering",
      "Introduced asset metadata backfill script for automatic image dimension extraction",
      "Created slack_bots table for OAuth token storage and management",
    ],
    improvements: [
      "Enhanced workflow execution engine to support email and Slack node processing",
      "Improved workflow builder UI with new communication node types",
      "Optimized blog post rendering performance with improved MDX processing",
      "Enhanced image handling with automatic dimension extraction and blur placeholders",
      "Added comprehensive variable support for email and Slack node content",
      "Improved blog preview functionality across create and edit workflows",
      "Updated documentation with workflow node types and Slack integration guide",
    ],
    fixes: [
      "Fixed blog posts list not displaying all published posts",
      "Resolved blog preview and slug editing issues with proper validation",
      "Fixed featured image upload process for blog posts",
      "Corrected accessibility issues with proper ARIA landmarks",
      "Fixed blog preview functionality across multiple interfaces",
    ],
  },
  {
    version: "1.8.0",
    date: "2025-12-10",
    features: [
      "Implemented workflow update detection to prevent accidental data loss",
      "Added comprehensive variable substitution system for workflow execution",
      "Implemented autosaving functionality for workflow builder",
      "Enhanced Vemetric custom event tracking for better analytics",
      "Improved typeahead textarea with transparent hint when not focused",
    ],
    improvements: [
      "Enhanced workflow builder with better node handling and field validation",
      "Improved API token system with better integration and usage tracking",
      "Updated workflow execution with enhanced output data handling",
      "Streamlined workflow edit page with automatic save functionality",
      "Enhanced variable highlighting and substitution in prompts",
      "Improved error handling for invalid field names and node types",
    ],
    fixes: [
      "Fixed build errors across multiple components and API endpoints",
      "Resolved package management issues by standardizing on pnpm",
      "Fixed initial node type configuration in workflow creation",
      "Corrected field validation for workflow builder inputs",
      "Fixed average duration calculation in workflow statistics",
      "Resolved styling issues in workflow pages and components",
    ],
  },
  {
    version: "1.7.0",
    date: "2025-12-08",
    features: [
      "Added API token system for programmatic workflow access",
      "Implemented comprehensive workflow statistics page with execution metrics",
      "Created detailed workflow execution view with API endpoints and output tracking",
      "Enhanced workflow builder with improved ReactFlow node organization",
      "Added homepage video tutorial for workflow building guidance",
      "Introduced reusable ButtonGroup and ButtonGroupItem components",
    ],
    improvements: [
      "Enhanced workflow execution with detailed output data storage and retrieval",
      "Improved workflow execution API with better response handling and error management",
      "Updated styling across workflow pages with enhanced light theme colors",
      "Added skeleton loading components for workflow stats, execution, and edit pages",
      "Implemented copy-to-clipboard functionality for API tokens and execution details",
      "Improved navigation with better breadcrumb organization and page structure",
    ],
    fixes: [
      "Resolved multiple build errors across workflow and execution pages",
      "Fixed average duration calculation in workflow statistics",
      "Corrected progress bar visibility issues in dashboard",
      "Fixed styling issues in ReactFlow workflow builder components",
    ],
  },
  {
    version: "1.6.0",
    date: "2025-12-05",
    features: [
      "Added light/dark mode toggle for improved user experience",
      "Implemented workflow AI builder with ReactFlow for visual workflow creation",
      "Added entry types for enhanced workflow configuration",
    ],
    improvements: [
      "Cleaned up styles across all pages for a more polished interface",
      "Enhanced workflow builder UI with better organization",
      "Improved entry node design and functionality",
      "Streamlined button styles and color scheme",
    ],
    fixes: [
      "Fixed popular text color visibility issues",
    ],
  },
  {
    version: "1.5.0",
    date: "2025-10-05",
    features: [
      "Added intelligent typeahead functionality for variable suggestions in chain step prompts",
      "Implemented TypeaheadTextarea component with smart variable completion",
      "Added delete step button for individual chain step removal",
      "Enhanced mobile-responsive dashboard design for better mobile experience",
      "Introduced comprehensive account deletion management system",
      "Added profile dropdown component with user navigation options",
      "Created dedicated settings page for account management",
    ],
    improvements: [
      "Enhanced variable insertion with improved regex pattern matching",
      "Streamlined chain step editing UI with cleaner interface design",
      "Improved variable highlighting visibility in prompts",
      "Optimized AI processing by removing previous response from prompts for better clarity",
      "Enhanced Variables Modal with textarea input for better user experience",
      "Added helpful guidance notes for variable creation using {{variableName}} syntax",
      "Improved mobile dashboard layout with responsive grid system",
    ],
    fixes: [
      "Fixed typeahead suggestions not correctly inserting variables",
      "Resolved variable visibility issues in prompt highlighting",
      "Fixed terms page rendering issues",
      "Cleaned up console logging and debugging code",
      "Improved database environment configuration handling",
    ],
  },
  {
    version: "1.4.0",
    date: "2025-07-12",
    features: [
      "Added comprehensive account settings page with profile information display",
      "Implemented account deletion functionality with multi-step confirmation process",
      "Added profile dropdown component for better user navigation",
      "Enhanced subscription management integration in settings",
    ],
    improvements: [
      "Improved user account management with centralized settings interface",
      "Enhanced security with password confirmation for account deletion",
      "Better user experience with clear danger zone warnings",
      "Streamlined navigation with profile dropdown access",
    ],
    fixes: [
      "Fixed input prompt formatting issues in chain results",
    ],
  },
  {
    version: "1.3.0",
    date: "2025-07-09",
    features: [
      "Added multi-model AI support with Gemini 2.0, GPT-4, and Claude Sonnet 4",
      "Implemented per-step model selection for granular control over AI processing",
      "Added model dropdown selector in chain step editor with user-friendly names",
      "Introduced model display in chain step view and results page",
      "Set Gemini 2.0 Flash as the new default model for optimal performance",
    ],
    improvements: [
      "Enhanced chain step creation workflow with model selection",
      "Updated database schema to support model persistence across chain executions",
      "Improved OpenRouter integration to support multiple AI providers",
      "Added model information display in execution results for better transparency",
    ],
    fixes: [
      "Ensured backward compatibility for existing chains without model specification",
      "Fixed model parameter handling in API endpoints",
    ],
  },
  {
    version: "1.2.0",
    date: "2025-07-06",
    features: [
      "Introduced dynamic variable templating system with {{variableName}} syntax",
      "Added Variables Modal for setting template values before chain execution",
      "Implemented automatic variable detection and extraction from chain prompts",
      "Added visual highlighting of variables in chain step prompts",
      "Created variable validation system to ensure all required values are provided",
    ],
    improvements: [
      "Enhanced chain execution workflow with pre-run variable collection",
      "Added real-time variable highlighting in prompt editor",
      "Improved user experience with intuitive variable input interface",
      "Added comprehensive variable management API endpoints",
    ],
    fixes: [
      "Enhanced prompt processing with proper variable substitution",
      "Improved error handling for missing or invalid variables",
    ],
  },
  {
    version: "1.1.0",
    date: "2025-06-15",
    features: [
      "Added copy-to-clipboard functionality for chain results",
      "Implemented chain stopping and resuming capabilities",
      "Added silent updates for results page to reduce UI flicker",
      "Introduced scrollable boxes in dashboard for better content management",
      "Optimized response layout to reduce vertical space",
    ],
    improvements: [
      "Enhanced dashboard layout with 3-column design",
      "Improved chain step reordering with drag-and-drop functionality",
      "Added progress bar to dashboard for better visibility",
      "Updated chain processing to start instantly when queue space is available",
      "Improved chain step ordering and indexing",
    ],
    fixes: [
      "Fixed dashboard height issues",
      "Improved chain step completion tracking",
      "Enhanced error handling for chain processing",
    ],
  },
  {
    version: "1.0.0",
    date: "2025-06-08",
    features: [
      "Added email-based authentication system",
      "Implemented Stripe subscription management",
      "Added pricing pages and subscription modal",
      "Introduced rate limit usage tracking",
      "Added Google Analytics integration",
      "Implemented Vemetric analytics",
      "Added environment example configuration",
    ],
    improvements: [
      "Enhanced UI with modern, clean design",
      "Improved navigation with breadcrumb-style links",
      "Added loading skeletons for better user experience",
      "Implemented responsive layout for all screen sizes",
      "Updated branding and visual identity",
      "Added black background to favicon",
    ],
    fixes: [
      "Fixed authentication flow and session handling",
      "Improved error handling and display",
      "Enhanced rate limiting for verification emails",
      "Fixed URL validation issues",
    ],
  },
  {
    version: "0.9.0",
    date: "2025-06-04",
    features: [
      "Added user registration and authentication",
      "Implemented sign-out functionality",
      "Added loading animations and skeletons",
      "Introduced drag-and-drop chain step reordering",
      "Added instant chain processing when queue space is available",
      "Implemented completed chains section in dashboard",
    ],
    improvements: [
      "Updated color scheme and styling",
      "Enhanced dashboard layout and spacing",
      "Improved button and input styling",
      "Added better overlay effects",
      "Updated primary button styles",
    ],
    fixes: [
      "Fixed build issues",
      "Resolved dashboard height problems",
      "Fixed chain step ordering",
    ],
  },
  {
    version: "0.8.0",
    date: "2025-05-28",
    features: [
      "Added foundational chain processing functionality",
      "Implemented chain step API",
      "Added queue management system",
      "Introduced chain state model",
      "Added dashboard and chain pages",
      "Implemented rate limiting",
    ],
    improvements: [
      "Added database integration with Postgres and Drizzle ORM",
      "Implemented migration system",
      "Added ESLint for code quality",
      "Enhanced error handling for chain processing",
    ],
    fixes: [
      "Fixed chain step completion tracking",
      "Improved queue update handling",
      "Enhanced chain state management",
    ],
  },
  {
    version: "0.7.0",
    date: "2025-05-17",
    features: [
      "Initial application setup",
      "Added landing page",
      "Implemented logo and branding",
      "Added coming soon page",
      "Set up database infrastructure",
    ],
    improvements: [
      "Configured Next.js application",
      "Added initial styling and layout",
      "Set up development environment",
    ],
    fixes: [],
  },
];

const ReleaseNoteCard = ({ note }: { note: ReleaseNote }) => (
  <div className="border border-primary/20 rounded-lg bg-background-light p-6 mb-6">
    <div className="flex items-center gap-4 mb-4">
      <h2 className="text-2xl font-bold text-primary">
        Version {note.version}
      </h2>
      <span className="text-sm text-gray-400">{note.date}</span>
    </div>

    {note.features.length > 0 && (
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          ✨ New Features
        </h3>
        <ul className="list-disc list-inside space-y-1 text-foreground/90">
          {note.features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>
    )}

    {note.improvements.length > 0 && (
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          🚀 Improvements
        </h3>
        <ul className="list-disc list-inside space-y-1 text-foreground/90">
          {note.improvements.map((improvement, index) => (
            <li key={index}>{improvement}</li>
          ))}
        </ul>
      </div>
    )}

    {note.fixes.length > 0 && (
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">🐛 Fixes</h3>
        <ul className="list-disc list-inside space-y-1 text-foreground/90">
          {note.fixes.map((fix, index) => (
            <li key={index}>{fix}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

export default function ReleaseNotes() {
  return (
    <div>
      <Head>
        <title>Release Notes - ZeitFlow</title>
        <meta
          name="description"
          content="Latest updates and improvements to ZeitFlow"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-10 max-w-4xl min-h-[90vh]">
        <nav className="mb-10 flex justify-between items-center">
          <ul className="flex gap-4">
            <li>
              <Button href="/dashboard" variant="tertiary" className="!bg-transparent !p-0 underline hover:text-foreground-light">
                Dashboard
              </Button>
            </li>
            <li>
              <span className="text-foreground-extra-light">/</span>
            </li>
            <li>
              <span className="text-foreground">Release Notes</span>
            </li>
          </ul>
        </nav>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Release Notes
          </h1>
          <p className="text-foreground/80">
            Track the latest updates, features, and improvements to ZeitFlow.
          </p>
        </div>

        <div className="space-y-6">
          {releaseNotes.map((note) => (
            <ReleaseNoteCard key={note.version} note={note} />
          ))}
        </div>
      </main>
    </div>
  );
}
