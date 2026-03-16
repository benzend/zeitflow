
import { Button } from '../components/Button';
import AnimatedBackground from '@/app/components/AnimatedBackground';
import Logo from '@/app/components/Logo';
import Navigation from '@/components/Navigation';
import Providers from './providers';
import Head from 'next/head';
import {
  Zap,
  Shield,
  Bot,
  Plug,
  Workflow,
  FileText,
  Sparkles,
  History,
  Globe,
  Gift,
  Building2,
  ChevronDown,
  ArrowRight,
  ArrowDown,
  Webhook,
  MessageSquare,
  Terminal,
} from 'lucide-react';

export default function Home() {
  return (
    <>
      <Head>
        <title>ZeitFlow - The Automation Platform Built for AI Agents</title>
        <meta name="description" content="The first automation platform that's agent-native. Build lightning-fast, enterprise-grade workflows that AI agents discover and use through MCP. Not another Zapier clone." />
        <meta name="keywords" content="AI agent automation, MCP automation, agent-native workflows, enterprise automation, Model Context Protocol, AI workflow platform" />
        <meta property="og:title" content="ZeitFlow - The Automation Platform Built for AI Agents" />
        <meta property="og:description" content="Lightning-fast, enterprise-grade automations that AI agents natively discover and use through MCP. The automation platform for the agent era." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={process.env.NEXT_PUBLIC_URL || 'https://zeitflow.io'} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.io'}/logo-on-black.png`} />
        <meta property="og:site_name" content="ZeitFlow" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ZeitFlow - The Automation Platform Built for AI Agents" />
        <meta name="twitter:description" content="Lightning-fast, enterprise-grade automations that AI agents natively discover and use through MCP. The automation platform for the agent era." />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.io'}/logo-on-black.png`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={process.env.NEXT_PUBLIC_URL || 'https://zeitflow.io'} />
      </Head>
      <Providers>
        <div className="min-h-screen bg-surface text-foreground flex flex-col relative">
          <AnimatedBackground />
          <Navigation />

          <main className="flex flex-col items-center px-6 pt-32 pb-16 md:px-8 font-sans">
            <div className="w-full max-w-3xl space-y-28">

              {/* Hero */}
              <section className="text-center space-y-6">
                <div className="flex justify-center mb-6">
                  <div className="animate-float animate-scale-in">
                    <Logo size={64} className="text-primary animate-spin-slow animate-pulse-glow" />
                  </div>
                </div>

                <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
                  The automation platform<br />AI agents actually use
                </h1>
                <p className="text-lg text-text-muted max-w-xl mx-auto">
                  Enterprise-grade workflows that AI agents discover and trigger through MCP. The infrastructure layer for the agent era.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button href="/auth/register" variant="primary" size="lg">Start building for free</Button>
                  <Button href="#demo" variant="secondary" size="lg">See it in action</Button>
                </div>
              </section>

              {/* Demo Video */}
              <section id="demo" className="w-full max-w-3xl mx-auto">
                <div className="relative w-full rounded-xl overflow-hidden border border-border" style={{ paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    src="https://cap.so/embed/cmpdbz2nf5q9npx"
                    frameBorder="0"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full"
                  />
                </div>
              </section>

              {/* Why ZeitFlow - condensed from Problem + Solution */}
              <section className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground text-center">
                  Why ZeitFlow
                </h2>
                <p className="text-text-muted text-center max-w-xl mx-auto">
                  Legacy platforms build automation for humans. ZeitFlow builds it for AI agents.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: Bot, title: 'Agent-native', desc: 'Workflows are first-class tools AI agents discover and execute autonomously.' },
                    { icon: Plug, title: 'MCP protocol', desc: 'Every workflow is auto-exposed via MCP. Any compatible agent can use it.' },
                    { icon: Zap, title: 'Sub-second execution', desc: 'No cold starts or queue delays. Workflows run immediately when triggered.' },
                    { icon: Shield, title: 'Enterprise security', desc: 'Encrypted at rest, scoped API keys, full audit trails on every run.' },
                  ].map((item) => (
                    <div key={item.title} className="p-4 rounded-lg border border-border bg-surface-hover/30">
                      <div className="flex items-center gap-3 mb-2">
                        <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
                        <h3 className="font-medium text-foreground text-sm">{item.title}</h3>
                      </div>
                      <p className="text-sm text-text-muted">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* How it works - CLI-forward explainer */}
              <section className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl md:text-3xl font-semibold text-foreground">How it works</h2>
                  <p className="text-text-muted text-sm max-w-lg mx-auto">
                    Install the CLI, describe what you want, and you have a live workflow in under a minute.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Step 1: Install & auth */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
                      <span className="text-sm font-medium text-foreground">Install and log in</span>
                    </div>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border bg-surface-hover/30">
                        <div className="w-2 h-2 rounded-full bg-[#555]" />
                        <div className="w-2 h-2 rounded-full bg-[#555]" />
                        <div className="w-2 h-2 rounded-full bg-[#555]" />
                      </div>
                      <div className="bg-[#111] px-4 py-3 space-y-1">
                        <pre className="text-xs font-mono"><span className="text-[#666]">$</span><span className="text-[#d4d4d4]"> npx @zeitflow/cli auth login</span></pre>
                        <pre className="text-xs font-mono text-[#666]">  Opened browser — paste your token: ********</pre>
                        <pre className="text-xs font-mono text-[#4ade80]">  Authenticated. Config saved to ~/.zeitflow/config.json</pre>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Generate a workflow */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
                      <span className="text-sm font-medium text-foreground">Describe your workflow in plain English</span>
                    </div>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border bg-surface-hover/30">
                        <div className="w-2 h-2 rounded-full bg-[#555]" />
                        <div className="w-2 h-2 rounded-full bg-[#555]" />
                        <div className="w-2 h-2 rounded-full bg-[#555]" />
                      </div>
                      <div className="bg-[#111] px-4 py-3 space-y-1">
                        <pre className="text-xs font-mono"><span className="text-[#666]">$</span><span className="text-[#d4d4d4]"> npx @zeitflow/cli workflow generate \</span></pre>
                        <pre className="text-xs font-mono"><span className="text-[#d4d4d4]">    &quot;When a support ticket comes in, classify its priority</span></pre>
                        <pre className="text-xs font-mono"><span className="text-[#d4d4d4]">     with AI and send urgent ones to Slack&quot;</span></pre>
                        <pre className="text-xs font-mono text-[#666]">{`
  Proposed workflow: 4 nodes, 3 connections
  Use --output json to see the full structure.`}</pre>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Publish & run */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
                      <span className="text-sm font-medium text-foreground">Publish and it&apos;s live</span>
                    </div>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border bg-surface-hover/30">
                        <div className="w-2 h-2 rounded-full bg-[#555]" />
                        <div className="w-2 h-2 rounded-full bg-[#555]" />
                        <div className="w-2 h-2 rounded-full bg-[#555]" />
                      </div>
                      <div className="bg-[#111] px-4 py-3 space-y-1">
                        <pre className="text-xs font-mono"><span className="text-[#666]">$</span><span className="text-[#d4d4d4]"> npx @zeitflow/cli workflow publish support-ticket-router</span></pre>
                        <pre className="text-xs font-mono text-[#4ade80]">  Published. Now discoverable via MCP.</pre>
                        <pre className="text-xs font-mono text-[#666]"> </pre>
                        <pre className="text-xs font-mono"><span className="text-[#666]">$</span><span className="text-[#d4d4d4]"> npx @zeitflow/cli workflow run support-ticket-router</span></pre>
                        <pre className="text-xs font-mono text-[#666]">  Execution #42 — completed in 1.2s</pre>
                        <pre className="text-xs font-mono text-[#666]">  → Classified as: urgent</pre>
                        <pre className="text-xs font-mono text-[#666]">  → Slack message sent to #support-escalations</pre>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-text-muted text-center">
                  Or build visually in the <Button href="/workflows" variant="tertiary" className="inline text-xs">workflow editor <ArrowRight className="w-3 h-3 ml-0.5 inline" /></Button>
                </p>
              </section>

              {/* Connect - terminal blocks kept but simplified styling */}
              <section className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                    Connect in seconds
                  </h2>
                  <p className="text-text-muted text-sm">
                    Add ZeitFlow to any MCP-compatible client.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Remote config */}
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface-hover/30">
                      <Globe className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-xs font-medium text-foreground">Remote</span>
                      <span className="ml-auto text-xs text-text-muted">Streamable HTTP</span>
                    </div>
                    <div className="bg-[#111] p-4 overflow-x-auto">
                      <pre className="text-xs font-mono text-[#d4d4d4] leading-relaxed whitespace-pre">{`{
  "mcpServers": {
    "zeitflow": {
      "serverUrl": "https://zeitflow.io/api/mcp",
      "headers": {
        "Authorization": "Bearer <token>"
      }
    }
  }
}`}</pre>
                    </div>
                  </div>

                  {/* Local config */}
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface-hover/30">
                      <Terminal className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-xs font-medium text-foreground">Local</span>
                      <span className="ml-auto text-xs text-text-muted">stdio</span>
                    </div>
                    <div className="bg-[#111] p-4 overflow-x-auto">
                      <pre className="text-xs font-mono text-[#d4d4d4] leading-relaxed whitespace-pre">{`{
  "mcpServers": {
    "zeitflow": {
      "command": "npx",
      "args": ["@zeitflow/mcp"],
      "env": {
        "ZEITFLOW_API_TOKEN": "<token>"
      }
    }
  }
}`}</pre>
                    </div>
                  </div>
                </div>

                {/* Terminal one-liner */}
                <div className="rounded-lg border border-border overflow-hidden max-w-md mx-auto">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border bg-surface-hover/30">
                    <div className="w-2 h-2 rounded-full bg-[#555]" />
                    <div className="w-2 h-2 rounded-full bg-[#555]" />
                    <div className="w-2 h-2 rounded-full bg-[#555]" />
                  </div>
                  <div className="bg-[#111] px-4 py-3">
                    <pre className="text-xs font-mono">
                      <span className="text-[#666]">$</span>
                      <span className="text-[#d4d4d4]"> npx @zeitflow/mcp</span>
                    </pre>
                  </div>
                </div>

                <div className="text-center">
                  <Button href="/connect" variant="secondary" size="md">
                    Setup guides <ArrowRight className="w-3.5 h-3.5 ml-1 inline" />
                  </Button>
                </div>
              </section>

              {/* Features - condensed from Value Stack + Integrations */}
              <section className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground text-center">
                  What&apos;s included
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: Workflow, title: 'Visual workflow builder' },
                    { icon: Plug, title: 'Built-in MCP server' },
                    { icon: Sparkles, title: 'Multi-model AI (GPT-4, Gemini, Claude, Llama)' },
                    { icon: Webhook, title: 'API & webhook triggers' },
                    { icon: FileText, title: 'Hosted forms' },
                    { icon: MessageSquare, title: 'Email, SMS, Slack, Telegram, Discord' },
                    { icon: ArrowDown, title: 'Conditional branching' },
                    { icon: History, title: 'Full execution logs & audit trail' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-hover/20">
                      <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground">{item.title}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-text-muted text-center">
                  20+ integrations included on every plan. No per-connector fees.
                  <Button href="/integrations" variant="tertiary" className="ml-1 inline text-xs">
                    View all <ArrowRight className="w-3 h-3 ml-0.5 inline" />
                  </Button>
                </p>
              </section>

              {/* Templates - condensed */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Templates</h2>
                  <Button href="/templates" variant="tertiary" className="text-sm">
                    Browse all <ArrowRight className="w-3.5 h-3.5 ml-1 inline" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { name: 'Support Ticket Router', desc: 'Classify, prioritize, and route tickets via AI.', tags: ['AI', 'Slack'] },
                    { name: 'Lead Qualification', desc: 'Score and route inbound leads automatically.', tags: ['AI', 'Sales'] },
                    { name: 'Webhook to Email', desc: 'Forward webhook data as formatted emails.', tags: ['Email'] },
                  ].map((tpl) => (
                    <article key={tpl.name} className="p-4 rounded-lg border border-border bg-surface-hover/20 hover:border-primary/30 transition-colors">
                      <h3 className="font-medium text-foreground text-sm mb-1">{tpl.name}</h3>
                      <p className="text-xs text-text-muted mb-2">{tpl.desc}</p>
                      <div className="flex gap-1.5">
                        {tpl.tags.map((tag) => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{tag}</span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* Pricing - kept but tightened */}
              <section className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Pricing</h2>
                  <p className="text-sm text-text-muted">No per-agent fees. No integration surcharges.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: 'Free', price: '$0', requests: '20 exec/hr', icon: Gift },
                    { name: 'Pro', price: '$9.99', requests: '100 exec/hr', icon: Zap },
                    { name: 'Business', price: '$29.99', requests: '1,000 exec/hr', icon: Building2 },
                  ].map((plan) => (
                    <div key={plan.name} className="p-5 rounded-lg border border-border bg-surface-hover/20 text-center">
                      <plan.icon className="w-5 h-5 text-primary mx-auto mb-3" />
                      <h3 className="font-semibold text-foreground">{plan.name}</h3>
                      <p className="text-2xl font-bold text-foreground mt-1">{plan.price}<span className="text-sm font-normal text-text-muted">/mo</span></p>
                      <p className="text-xs text-text-muted mt-1">{plan.requests}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-text-muted text-center">
                  All plans include MCP, all integrations, and full audit logs.
                </p>
              </section>

              {/* FAQ - reduced to top 5 */}
              <section className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground">FAQ</h2>
                <div className="space-y-2">
                  {[
                    { q: 'What makes ZeitFlow different from Zapier or n8n?', a: 'ZeitFlow is agent-native. Every workflow you publish becomes an MCP tool that AI agents can discover and execute autonomously. Legacy platforms require human triggers.' },
                    { q: 'What is MCP?', a: 'Model Context Protocol — the open standard for AI agents to discover and use tools. Publish a workflow on ZeitFlow and any MCP-compatible agent (Claude, GPT, custom agents) can find and run it.' },
                    { q: 'Is this production-ready?', a: 'Yes. Encrypted at rest, scoped API keys, full audit trails. Teams run production workflows on ZeitFlow today.' },
                    { q: 'What AI models are supported?', a: 'GPT-4, Gemini, Claude, Llama, and more — configurable per node in your workflow.' },
                    { q: 'What integrations are included?', a: 'All 20+ on every plan: Email, Slack, SMS, Telegram, Discord, WhatsApp, GitHub, Google Sheets, Notion, Airtable, YouTube, Stripe, Shopify, HubSpot, Jira, Linear, and more. No surcharges.' },
                  ].map((item) => (
                    <details key={item.q} className="group border border-border rounded-lg bg-surface-hover/20">
                      <summary className="px-4 py-3 cursor-pointer font-medium text-foreground text-sm flex justify-between items-center gap-4">
                        <span>{item.q}</span>
                        <ChevronDown className="w-4 h-4 text-text-muted group-open:rotate-180 transition-transform duration-200 flex-shrink-0" />
                      </summary>
                      <div className="px-4 pb-4 pt-0">
                        <p className="text-sm text-text-muted">{item.a}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </section>

              {/* Final CTA */}
              <section className="text-center space-y-4 py-8 border-t border-border">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                  Ready to build?
                </h2>
                <p className="text-text-muted max-w-md mx-auto">
                  Free plan. No credit card. Full MCP support included.
                </p>
                <Button href="/auth/register" variant="primary" size="lg">Start building for free</Button>
              </section>

            </div>
          </main>
        </div>
      </Providers>
    </>
  );
}
