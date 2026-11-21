"use client";
import { Footer } from "@/components/Footer";
import { getCanonicalSiteOrigin } from "@/lib/site";
import Navigation from "@/components/Navigation";
import Head from "next/head";
import Link from "next/link";

export default function About() {
  const origin = getCanonicalSiteOrigin();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Head>
        <title>About - ZeitFlow | AI Workflow Automation Platform</title>
        <meta
          name="description"
          content="ZeitFlow is an open-source workflow automation platform. Published workflows become MCP tools that AI agents can discover and run."
        />
        <meta property="og:title" content="About - ZeitFlow" />
        <meta
          property="og:description"
          content="ZeitFlow is an open-source workflow automation platform. Published workflows become MCP tools that AI agents can discover and run."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${origin}/about`} />
        <meta property="og:image" content={`${origin}/logo-on-black.png`} />
        <meta property="og:site_name" content="ZeitFlow" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="About - ZeitFlow" />
        <meta
          name="twitter:description"
          content="ZeitFlow is an open-source workflow automation platform. Published workflows become MCP tools that AI agents can discover and run."
        />
        <meta name="twitter:image" content={`${origin}/logo-on-black.png`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${origin}/about`} />
      </Head>
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 py-16 mt-10">
        <h1 className="text-4xl font-bold mb-4 text-primary">About ZeitFlow</h1>
        <p className="text-text-muted mb-12 text-lg">
          The automation platform AI agents actually use.
        </p>

        <div className="space-y-8">
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">What it is</h2>
            <p className="text-foreground leading-relaxed mb-4">
              ZeitFlow is an open-source workflow automation platform. You build a workflow,
              publish it, and that workflow becomes a tool an AI agent can discover and run
              through the Model Context Protocol (MCP). The same workflow can also be started
              from an API request, a webhook, or a form.
            </p>
            <p className="text-foreground leading-relaxed">
              The service processes workflow steps through third-party AI providers via
              OpenRouter, and it can call other services such as email, SMS, messaging, and
              calendars. You keep ownership of the prompts, workflow configuration, and files
              you submit. The terms of service state that ZeitFlow does not use that content
              to train AI models.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">What you can build with</h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
              <li>A visual workflow editor, and a command-line client (<code>@zeitflow/cli</code>)</li>
              <li>
                AI steps that can use models available through OpenRouter, including GPT-4,
                Gemini, Claude, and Llama
              </li>
              <li>
                Triggers from an API, a webhook, or a hosted form, plus conditional branching
              </li>
              <li>
                Integrations such as email, Slack, SMS, Telegram, Discord, WhatsApp, GitHub,
                Google Sheets, Google Drive, Notion, Airtable, YouTube, Stripe, Shopify,
                HubSpot, Jira, and Linear. The{" "}
                <Link href="/integrations" className="text-primary hover:underline">
                  integrations page
                </Link>{" "}
                lists the current set.
              </li>
              <li>
                An MCP server at{" "}
                <Link href="/api/mcp" className="text-primary hover:underline">
                  /api/mcp
                </Link>
                , also available as <code>@zeitflow/mcp</code>
              </li>
              <li>Structured execution logs for each run</li>
            </ul>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Plans</h2>
            <p className="text-foreground leading-relaxed mb-4">
              The published plans are Free ($0, 20 executions per hour), Pro ($9.99 per month,
              100 per hour), and Business ($29.99 per month, 1,000 per hour). Each plan
              includes MCP, the integrations, and execution logs. Details are on the{" "}
              <Link href="/pricing" className="text-primary hover:underline">
                pricing page
              </Link>
              .
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Source and operation</h2>
            <p className="text-foreground leading-relaxed mb-4">
              The application source is published under the GNU Affero General Public License
              v3 at{" "}
              <a
                href="https://github.com/benzend/zeitflow"
                className="text-primary hover:underline"
                rel="noopener noreferrer"
              >
                github.com/benzend/zeitflow
              </a>
              . The hosted service at {origin.replace(/^https:\/\//, "")} is operated by
              ZeitFlow. The contact page describes it as built and operated by one person, with
              support handled directly by that person on business days.
            </p>
            <p className="text-foreground leading-relaxed">
              Questions go to{" "}
              <a href="mailto:support@zeitflow.io" className="text-primary hover:underline">
                support@zeitflow.io
              </a>
              . Privacy requests go to{" "}
              <a href="mailto:privacy@zeitflow.io" className="text-primary hover:underline">
                privacy@zeitflow.io
              </a>
              . Legal notices go to{" "}
              <a href="mailto:legal@zeitflow.io" className="text-primary hover:underline">
                legal@zeitflow.io
              </a>
              .
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Read next</h2>
            <ul className="space-y-3">
              <li>
                <Link href="/guides" className="text-primary hover:underline font-medium">
                  Guides
                </Link>
                <span className="text-text-muted"> — MCP setup and the CLI</span>
              </li>
              <li>
                <Link href="/release-notes" className="text-primary hover:underline font-medium">
                  Release notes
                </Link>
                <span className="text-text-muted"> — recorded product changes</span>
              </li>
              <li>
                <Link href="/security" className="text-primary hover:underline font-medium">
                  Security
                </Link>
                <span className="text-text-muted"> — encryption, tokens, and account deletion</span>
              </li>
              <li>
                <Link href="/privacy" className="text-primary hover:underline font-medium">
                  Privacy policy
                </Link>
                <span className="text-text-muted"> — how data is handled</span>
              </li>
              <li>
                <Link href="/terms" className="text-primary hover:underline font-medium">
                  Terms of service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-primary hover:underline font-medium">
                  Contact
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
