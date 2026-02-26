import Navigation from "@/components/Navigation";
import AnimatedBackground from "@/app/components/AnimatedBackground";
import { Button } from "@/components/Button";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Mail,
  Phone,
  Hash,
  Send,
  Globe,
  MessageSquare,
  FileText,
  GitBranch,
  Table,
  Database,
  Webhook,
  Youtube,
  Plug,
  Bot,
  Sparkles,
  Zap,
  HardDrive,
  MessageCircle,
  Ticket,
  Users,
  Layers,
  CreditCard,
  ShoppingCart,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Integrations | ZeitFlow",
  description:
    "Connect ZeitFlow workflows to the tools your team already uses. 20+ integrations including Slack, GitHub, Google Sheets, Notion, Stripe, Shopify, Jira, HubSpot, Linear, and more.",
  openGraph: {
    title: "Integrations | ZeitFlow",
    description:
      "Connect ZeitFlow workflows to the tools your team already uses. 20+ integrations including Slack, GitHub, Google Sheets, Notion, Stripe, Shopify, Jira, HubSpot, Linear, and more.",
    type: "website",
  },
};

interface Integration {
  id: string;
  name: string;
  description: string;
  category: "communication" | "data" | "utility" | "ai";
  icon: React.ElementType;
  color: string;
  auth: string;
  features: string[];
}

const integrations: Integration[] = [
  // Communication
  {
    id: "email",
    name: "Email",
    description: "Send emails via Resend with dynamic templates and variable substitution.",
    category: "communication",
    icon: Mail,
    color: "#000000",
    auth: "API Key (Resend)",
    features: ["Send to multiple recipients", "Custom from address", "HTML & plain text"],
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send messages to Slack channels and direct messages via workspace bots.",
    category: "communication",
    icon: Hash,
    color: "#4A154B",
    auth: "OAuth",
    features: ["Channel & DM messaging", "Multiple workspace support", "Rich formatting"],
  },
  {
    id: "sms",
    name: "SMS",
    description: "Send text messages to phone numbers worldwide via Twilio.",
    category: "communication",
    icon: Phone,
    color: "#F22F46",
    auth: "API Key (Twilio)",
    features: ["Multi-recipient", "E.164 phone format", "Per-workflow credentials"],
  },
  {
    id: "telegram",
    name: "Telegram",
    description: "Send messages to Telegram chats and channels via bot API.",
    category: "communication",
    icon: Send,
    color: "#0088CC",
    auth: "Bot Token",
    features: ["Chat & channel messaging", "Markdown formatting", "Custom bot token"],
  },
  {
    id: "discord",
    name: "Discord",
    description: "Send messages to Discord channels via webhooks. No OAuth required.",
    category: "communication",
    icon: MessageSquare,
    color: "#5865F2",
    auth: "Webhook URL",
    features: ["Webhook-based (no OAuth)", "Custom bot username", "Discord Markdown"],
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Send WhatsApp messages to customers and teams via Twilio.",
    category: "communication",
    icon: MessageCircle,
    color: "#25D366",
    auth: "API Key (Twilio)",
    features: ["Multi-recipient messaging", "E.164 phone format", "Per-workflow credentials"],
  },
  // Data
  {
    id: "google_sheets",
    name: "Google Sheets",
    description: "Read, append, and update data in Google Sheets spreadsheets.",
    category: "data",
    icon: Table,
    color: "#0F9D58",
    auth: "Google OAuth",
    features: ["Read rows", "Append rows", "Update cells"],
  },
  {
    id: "github",
    name: "GitHub",
    description: "Create issues, post comments, and list issues in GitHub repositories.",
    category: "data",
    icon: GitBranch,
    color: "#24292E",
    auth: "Personal Access Token",
    features: ["Create issues", "Post comments", "List issues"],
  },
  {
    id: "notion",
    name: "Notion",
    description: "Create pages, query databases, and append content in Notion workspaces.",
    category: "data",
    icon: FileText,
    color: "#000000",
    auth: "Integration Token",
    features: ["Create pages", "Query databases", "Append blocks"],
  },
  {
    id: "airtable",
    name: "Airtable",
    description: "List, create, and update records in Airtable bases and tables.",
    category: "data",
    icon: Database,
    color: "#18BFFF",
    auth: "Personal Access Token",
    features: ["List records", "Create records", "Update records"],
  },
  {
    id: "youtube",
    name: "YouTube",
    description: "Fetch video metadata or post comments on YouTube videos.",
    category: "data",
    icon: Youtube,
    color: "#FF0000",
    auth: "Google OAuth",
    features: ["Fetch video data", "Post comments", "View counts & stats"],
  },
  {
    id: "google_drive",
    name: "Google Drive",
    description: "Upload, create, and share files in Google Drive.",
    category: "data",
    icon: HardDrive,
    color: "#4285F4",
    auth: "Google OAuth",
    features: ["Upload files", "Create folders", "Share with permissions"],
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Create customers, invoices, and payment links via Stripe.",
    category: "data",
    icon: CreditCard,
    color: "#635BFF",
    auth: "API Key",
    features: ["Create customers", "Generate invoices", "Payment links"],
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "Manage orders, products, and customers in Shopify.",
    category: "data",
    icon: ShoppingCart,
    color: "#96BF48",
    auth: "Admin API Token",
    features: ["List orders", "Create products", "Manage customers"],
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Manage contacts and deals in HubSpot CRM.",
    category: "data",
    icon: Users,
    color: "#FF7A59",
    auth: "Private App Token",
    features: ["Create contacts", "Manage deals", "Search CRM records"],
  },
  {
    id: "jira",
    name: "Jira",
    description: "Create, update, and search issues in Jira projects.",
    category: "data",
    icon: Ticket,
    color: "#0052CC",
    auth: "API Token",
    features: ["Create issues", "JQL search", "Workflow transitions"],
  },
  {
    id: "linear",
    name: "Linear",
    description: "Create and manage issues and projects in Linear.",
    category: "data",
    icon: Layers,
    color: "#5E6AD2",
    auth: "API Key",
    features: ["Create issues", "Priority management", "Team organization"],
  },
  // Utility
  {
    id: "http_request",
    name: "HTTP Request",
    description: "Make requests to any REST API. The universal connector for any service.",
    category: "utility",
    icon: Globe,
    color: "#6366F1",
    auth: "Bearer / Basic / API Key / None",
    features: ["GET, POST, PUT, PATCH, DELETE", "Custom headers", "JSON response parsing"],
  },
  {
    id: "webhook",
    name: "Webhook",
    description: "Send data to any URL via outgoing webhook with flexible auth options.",
    category: "utility",
    icon: Webhook,
    color: "#8B5CF6",
    auth: "Bearer / Basic / API Key / None",
    features: ["POST, PUT, PATCH methods", "Custom headers", "Retry configuration"],
  },
  {
    id: "condition",
    name: "Condition",
    description: "Branch workflow execution based on expressions and comparisons.",
    category: "utility",
    icon: GitBranch,
    color: "#F59E0B",
    auth: "None",
    features: ["8 comparison operators", "Variable evaluation", "True/false branching"],
  },
];

const categories = [
  { id: "communication", label: "Communication", description: "Reach people on any channel" },
  { id: "data", label: "Data & Services", description: "Connect to the tools your team uses" },
  { id: "utility", label: "Utility", description: "Control flow and connect to anything" },
];

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <AnimatedBackground />
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 py-16 mt-10 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 animate-slide-up-fade">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-6">
            <Plug className="w-4 h-4" />
            {integrations.length} integrations and counting
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Integrations
          </h1>
          <p className="text-xl text-text-muted max-w-2xl mx-auto">
            Connect your workflows to the tools your team already uses. Every integration works with AI agents via MCP.
          </p>
        </div>

        {/* Key value props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: Zap,
              title: "All included, every plan",
              desc: "No integration tiers or per-connector fees. Every integration is available on every plan.",
            },
            {
              icon: Bot,
              title: "Agent-native",
              desc: "Every integration is automatically available to AI agents via the Model Context Protocol.",
            },
            {
              icon: Sparkles,
              title: "Variable substitution",
              desc: "All fields support {{variables}} from upstream nodes. Build dynamic, data-driven workflows.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-5 rounded-lg border border-border bg-surface/50 text-center"
            >
              <div className="flex justify-center mb-3">
                <span className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <item.icon className="w-5 h-5" />
                </span>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
              <p className="text-sm text-text-muted">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Integration categories */}
        {categories.map((category) => {
          const categoryIntegrations = integrations.filter(
            (i) => i.category === category.id
          );
          return (
            <section key={category.id} className="mb-16">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-foreground">
                  {category.label}
                </h2>
                <p className="text-text-muted mt-1">{category.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryIntegrations.map((integration, index) => (
                  <article
                    key={integration.id}
                    className="p-6 rounded-lg border border-border bg-surface/50 hover:border-primary/30 transition-all duration-300 animate-slide-up-fade"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${integration.color}15` }}
                      >
                        <integration.icon
                          className="w-5 h-5"
                          style={{ color: integration.color }}
                        />
                      </span>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {integration.name}
                        </h3>
                        <p className="text-xs text-text-muted">
                          {integration.auth}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-text-muted mb-4 leading-relaxed">
                      {integration.description}
                    </p>

                    <ul className="space-y-1.5">
                      {integration.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-xs text-text-muted"
                        >
                          <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        {/* HTTP Request highlight */}
        <section className="mb-16 p-8 rounded-2xl border border-primary/20 bg-primary/5">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <span className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Globe className="w-7 h-7" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Connect to any API with HTTP Request
              </h2>
              <p className="text-text-muted mb-4 leading-relaxed">
                Don&apos;t see the integration you need? The HTTP Request node connects to
                any REST API. Set the URL, method, headers, auth, and body — all with
                full variable substitution. It&apos;s the universal escape hatch that
                makes ZeitFlow compatible with thousands of services.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Bearer Token", "Basic Auth", "API Key", "Custom Headers", "JSON Parsing"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            Start building with integrations
          </h2>
          <p className="text-text-muted max-w-xl mx-auto mb-6">
            All integrations are available on every plan. Create your first workflow and connect the tools your team depends on.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/auth/register" variant="primary" size="lg">
              Start building for free
            </Button>
            <Button href="/guides" variant="secondary" size="lg">
              Read the guides <ArrowRight className="w-4 h-4 ml-1 inline" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
