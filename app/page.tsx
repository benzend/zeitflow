
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
  Eye,
  Rocket,
  Workflow,
  Lock,
  Clock,
  Server,
  FileText,
  Sparkles,
  Send,
  History,
  Mail,
  Phone,
  Globe,
  Hash,
  Calendar,
  Gift,
  Building2,
  ChevronDown,
  ArrowRight,
  ArrowDown,
  Check,
  X,
  Webhook,
  MessageSquare,
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
        <div className="min-h-screen bg-gradient-to-b from-surface to-surface-hover text-foreground flex flex-col relative">
          <AnimatedBackground />
          <Navigation />

          <main className="flex flex-col items-center px-6 pt-24 pb-16 md:px-8 font-sans">
            <div className="w-full max-w-4xl space-y-24">

              {/* Hero */}
              <section className="text-center space-y-6">
                <div className="flex justify-center mb-6">
                  <div className="animate-float animate-scale-in">
                    <Logo size={64} className="text-primary animate-spin-slow animate-pulse-glow" />
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mx-auto">
                  <Bot className="w-4 h-4" />
                  Agent-native. MCP-first. Enterprise-ready.
                </div>

                <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
                  The automation platform<br />AI agents actually use
                </h1>
                <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto">
                  Build lightning-fast, enterprise-grade workflows that AI agents discover and trigger through MCP. Not another drag-and-drop toy. The infrastructure layer for the agent era.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button href="/auth/register" variant="primary" size="lg">Start building for free</Button>
                  <Button href="https://cap.so/s/qegqpre7vpq3jrf" variant="secondary" size="lg">See it in action</Button>
                </div>
              </section>

              {/* Problem / Agitation */}
              <section className="space-y-8">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground text-center">
                  Your automations are invisible to AI
                </h2>
                <p className="text-text-muted text-center max-w-2xl mx-auto">
                  Every workflow you built on legacy platforms has the same problem: AI agents can&apos;t see it, can&apos;t use it, and can&apos;t compose it. You&apos;re building automation for a world that no longer exists.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { problem: 'AI agents can\'t discover your Zapier zaps', icon: X },
                    { problem: 'Your n8n workflows can\'t be called as tools', icon: X },
                    { problem: 'Every automation requires a human to trigger it', icon: X },
                    { problem: 'No protocol for agents to compose workflows', icon: X },
                  ].map((item) => (
                    <div key={item.problem} className="flex items-center gap-3 p-4 rounded-lg border border-border bg-surface/30">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                        <item.icon className="w-4 h-4" />
                      </span>
                      <p className="text-text-muted text-sm">{item.problem}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Solution */}
              <section className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                    Built from the ground up for AI agents
                  </h2>
                  <p className="text-text-muted max-w-2xl mx-auto">
                    ZeitFlow isn&apos;t a legacy platform with an AI feature bolted on. It&apos;s agent-native infrastructure. Every workflow you build is automatically a tool that AI agents can discover, understand, and execute through the Model Context Protocol.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      icon: Bot,
                      title: 'Agent-native architecture',
                      desc: 'Workflows are first-class tools for AI agents. They can discover capabilities, understand inputs/outputs, and execute autonomously.',
                    },
                    {
                      icon: Plug,
                      title: 'MCP protocol support',
                      desc: 'Every workflow is exposed via the Model Context Protocol. Any MCP-compatible agent can find and use your automations as tools.',
                    },
                    {
                      icon: Zap,
                      title: 'Lightning-fast execution',
                      desc: 'Sub-second workflow triggers. No cold starts, no queue delays. When an agent calls your workflow, it runs immediately.',
                    },
                    {
                      icon: Shield,
                      title: 'Enterprise-grade security',
                      desc: 'Encrypted at rest, scoped API keys, full audit trails. Built for teams that can\'t afford to get security wrong.',
                    },
                  ].map((item) => (
                    <article key={item.title} className="p-6 rounded-lg border border-border bg-surface/50">
                      <div className="flex items-start gap-4">
                        <span className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <item.icon className="w-6 h-6" />
                        </span>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                          <p className="text-sm text-text-muted leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* How it works - reframed for agent-native */}
              <section className="space-y-8">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground text-center">How it works</h2>

                <div className="relative p-6 md:p-8 rounded-2xl border border-border bg-surface/30">
                  {/* Desktop: Horizontal flow */}
                  <div className="hidden md:block">
                    <div className="absolute top-[3.8rem] left-[12%] right-[12%] h-px bg-primary/30 overflow-hidden">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-20 h-2 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full blur-md shadow-[0_0_12px_var(--primary)] animate-flow-glow" />
                    </div>

                    <div className="relative flex items-start justify-between max-w-3xl mx-auto">
                      {[
                        { icon: Workflow, label: 'Build visually', desc: 'Design your workflow' },
                        { icon: Plug, label: 'MCP exposed', desc: 'Auto-published as tool' },
                        { icon: Bot, label: 'Agent discovers', desc: 'AI finds & triggers it' },
                        { icon: Zap, label: 'Executes instantly', desc: 'Sub-second results' },
                        { icon: Eye, label: 'Full observability', desc: 'Audit every run' },
                      ].map((step) => (
                        <div key={step.label} className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-surface border border-border text-primary flex items-center justify-center shadow-sm">
                            <step.icon className="w-6 h-6" />
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-foreground text-sm">{step.label}</p>
                            <p className="text-xs text-text-muted mt-0.5">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mobile: Vertical flow */}
                  <div className="md:hidden relative pl-6">
                    <div className="absolute left-[1.45rem] top-6 bottom-6 w-px bg-primary/30 overflow-hidden">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-10 w-2 bg-gradient-to-b from-transparent via-primary to-transparent rounded-full blur-md shadow-[0_0_12px_var(--primary)] animate-flow-glow-vertical" />
                    </div>

                    <div className="relative space-y-6">
                      {[
                        { icon: Workflow, label: 'Build visually', desc: 'Design your workflow' },
                        { icon: Plug, label: 'MCP exposed', desc: 'Auto-published as tool' },
                        { icon: Bot, label: 'Agent discovers', desc: 'AI finds & triggers it' },
                        { icon: Zap, label: 'Executes instantly', desc: 'Sub-second results' },
                        { icon: Eye, label: 'Full observability', desc: 'Audit every run' },
                      ].map((step) => (
                        <div key={step.label} className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-surface border border-border text-primary flex items-center justify-center shadow-sm flex-shrink-0">
                            <step.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{step.label}</p>
                            <p className="text-xs text-text-muted">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Value Stack - Hormozi-style "everything you get" */}
              <section className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                    Everything you need. Nothing you don&apos;t.
                  </h2>
                  <p className="text-text-muted max-w-2xl mx-auto">
                    Most platforms nickel-and-dime you for every integration. ZeitFlow ships with the full stack out of the box.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { title: 'Visual workflow builder', desc: 'Drag-and-drop interface for building complex automation flows. Humans design, agents execute.', icon: Workflow },
                    { title: 'MCP server built-in', desc: 'Every published workflow is automatically exposed as an MCP tool. Zero config required.', icon: Plug },
                    { title: 'Multi-model AI processing', desc: 'Route to the best model for each task. GPT-4, Gemini, Claude, Llama — use them all in one workflow.', icon: Sparkles },
                    { title: 'API & webhook triggers', desc: 'Accept JSON payloads via HTTP or webhooks to start workflows programmatically.', icon: Webhook },
                    { title: 'Hosted forms', desc: 'Generate shareable form URLs that trigger workflows on submission. No frontend needed.', icon: FileText },
                    { title: 'SMS, email, & Slack', desc: 'Notify the right people through the right channel. Twilio, Resend, and Slack built in.', icon: MessageSquare },
                    { title: 'Conditional branching', desc: 'Route data based on AI decisions or rule-based conditions. Build smart, not linear.', icon: ArrowDown },
                    { title: 'Full execution logs', desc: 'Every workflow run is logged with inputs, outputs, timing, and status. Complete audit trail.', icon: History },
                  ].map((item) => (
                    <article key={item.title} className="p-5 rounded-lg border border-border bg-surface/50">
                      <div className="flex items-start gap-4">
                        <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <item.icon className="w-5 h-5" />
                        </span>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                          <p className="text-sm text-text-muted">{item.desc}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* Use cases - reframed for agent-native */}
              <section className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-2xl md:text-3xl font-semibold text-foreground">What teams are building</h2>
                  <p className="text-text-muted max-w-2xl mx-auto">
                    ZeitFlow workflows become tools in your AI agent&apos;s toolkit. Here&apos;s what that unlocks.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { title: 'Autonomous ticket triage', desc: 'AI agents classify, prioritize, and route support tickets to the right team without human intervention.', icon: Bot },
                    { title: 'Intelligent lead routing', desc: 'Agents score inbound leads with AI, enrich data, and route hot prospects to sales in real time.', icon: Zap },
                    { title: 'Webhook orchestration', desc: 'Accept webhooks from any service, let AI normalize the payload, and fan out to downstream systems.', icon: Webhook },
                    { title: 'Compliance monitoring', desc: 'Agents watch for policy violations, flag issues, and notify stakeholders with full audit trails.', icon: Shield },
                    { title: 'Multi-step agent tasks', desc: 'Give your agents complex workflows as composable tools. They chain them together to solve problems.', icon: Plug },
                  ].map((item) => (
                    <article key={item.title} className="p-5 rounded-lg border border-border bg-surface/50">
                      <div className="flex items-start gap-4">
                        <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <item.icon className="w-5 h-5" />
                        </span>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                          <p className="text-sm text-text-muted">{item.desc}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* Templates */}
              <section className="space-y-8">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Start from a template</h2>
                    <p className="text-text-muted mt-2">Pre-built, agent-ready workflows you can deploy and customize.</p>
                  </div>
                  <Button href="/templates" variant="tertiary" className="hidden sm:inline-flex">
                    Browse all templates <ArrowRight className="w-4 h-4 ml-1 inline" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Support Ticket Router', desc: 'AI classifies urgency and category, routes to the right team, notifies via Slack.', tags: ['AI', 'Slack', 'MCP'] },
                    { name: 'Lead Qualification', desc: 'Score and qualify inbound leads with AI, route hot prospects to your sales pipeline.', tags: ['AI', 'Sales'] },
                    { name: 'Webhook to Email', desc: 'Accept webhook data from any service and forward formatted notifications via email.', tags: ['Email', 'Webhook'] },
                    { name: 'FAQ Responder', desc: 'AI generates context-aware responses to common questions. Expose as an agent tool via MCP.', tags: ['AI', 'MCP'] },
                    { name: 'Daily Report Generator', desc: 'Compile and send daily digest emails with AI-generated summaries of key metrics.', tags: ['AI', 'Reporting'] },
                  ].map((tpl) => (
                    <article key={tpl.name} className="p-5 rounded-lg border border-border bg-surface/50 hover:border-primary/30 transition-colors">
                      <h3 className="font-semibold text-foreground mb-1">{tpl.name}</h3>
                      <p className="text-sm text-text-muted mb-3">{tpl.desc}</p>
                      <div className="flex gap-2">
                        {tpl.tags.map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{tag}</span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
                <div className="sm:hidden text-center">
                  <Button href="/templates" variant="tertiary">
                    Browse all templates <ArrowRight className="w-4 h-4 ml-1 inline" />
                  </Button>
                </div>
              </section>

              {/* Integrations */}
              <section className="space-y-8">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Integrations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-foreground mb-4">Built-in today</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-text-muted">
                        <Plug className="w-4 h-4 text-primary" />
                        <span>MCP server (agent tool discovery)</span>
                      </li>
                      <li className="flex items-center gap-3 text-text-muted">
                        <Phone className="w-4 h-4 text-primary" />
                        <span>Twilio (outbound SMS)</span>
                      </li>
                      <li className="flex items-center gap-3 text-text-muted">
                        <Mail className="w-4 h-4 text-primary" />
                        <span>Resend (outbound email)</span>
                      </li>
                      <li className="flex items-center gap-3 text-text-muted">
                        <Hash className="w-4 h-4 text-primary" />
                        <span>Slack (workspace messaging)</span>
                      </li>
                      <li className="flex items-center gap-3 text-text-muted">
                        <Globe className="w-4 h-4 text-primary" />
                        <span>HTTP POST (any endpoint)</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-4">Coming soon</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-text-muted">
                        <Calendar className="w-4 h-4 text-text-muted" />
                        <span>Google Calendar</span>
                      </li>
                      <li className="flex items-center gap-3 text-text-muted">
                        <Server className="w-4 h-4 text-text-muted" />
                        <span>Database connectors</span>
                      </li>
                      <li className="flex items-center gap-3 text-text-muted">
                        <Plug className="w-4 h-4 text-text-muted" />
                        <span>Custom MCP tool imports</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Pricing */}
              <section className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Pricing</h2>
                  <p className="text-text-muted">Simple, predictable pricing. No per-agent fees. No integration surcharges.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { name: 'Free', price: '$0', requests: '20 executions/hour', desc: 'Build and test agent-ready workflows', icon: Gift },
                    { name: 'Pro', price: '$9.99', requests: '100 executions/hour', desc: 'For teams shipping to production', icon: Zap },
                    { name: 'Business', price: '$29.99', requests: '1,000 executions/hour', desc: 'Enterprise-grade scale and support', icon: Building2 },
                  ].map((plan) => (
                    <div key={plan.name} className="p-6 rounded-lg border border-border bg-surface/50 text-center">
                      <div className="flex justify-center mb-4">
                        <span className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <plan.icon className="w-6 h-6" />
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{plan.name}</h3>
                      <p className="text-xs text-text-muted mb-2">{plan.desc}</p>
                      <p className="text-2xl font-bold text-foreground">{plan.price}<span className="text-sm font-normal text-text-muted">/month</span></p>
                      <p className="text-sm text-primary mt-2">
                        {plan.requests}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-text-muted text-center">
                  All plans include MCP support, all integrations, and full audit logs. No feature gating.
                </p>
              </section>

              {/* FAQ - objection handling */}
              <section className="space-y-8">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Frequently asked questions</h2>
                <div className="space-y-3">
                  {[
                    { q: 'What makes ZeitFlow different from Zapier, n8n, or Make?', a: 'Those platforms were built for humans clicking buttons. ZeitFlow is agent-native — every workflow you publish is automatically a tool that AI agents can discover and use through the Model Context Protocol (MCP). If you\'re building for the agent era, legacy platforms aren\'t built for this.' },
                    { q: 'What is MCP and why does it matter?', a: 'MCP (Model Context Protocol) is the open standard for AI agents to discover and use tools. When you publish a workflow on ZeitFlow, it becomes an MCP tool that any compatible AI agent — Claude, GPT, custom agents — can find and execute. It\'s the difference between automation that requires a human and automation that AI can use autonomously.' },
                    { q: 'Is this production-ready?', a: 'ZeitFlow is designed for production workloads with enterprise-grade security, encrypted data at rest, scoped API keys, and full audit trails on every execution. Teams are running production workflows on ZeitFlow today.' },
                    { q: 'What AI models are supported?', a: 'ZeitFlow supports multi-model routing. Use GPT-4, Gemini, Claude, Llama, and more — all configurable per node. Pick the best model for each task in your workflow.' },
                    { q: 'Can AI agents trigger workflows autonomously?', a: 'Yes. That\'s the core design. AI agents discover your published workflows via MCP, understand their inputs and outputs, and trigger them without human intervention. You build the workflow once and agents use it as a tool.' },
                    { q: 'Does it support conditional logic?', a: 'Yes. Workflows support conditional branching based on rules or AI decisions. Build complex routing logic that agents can leverage.' },
                    { q: 'What integrations are included?', a: 'All of them, on every plan. SMS (Twilio), email (Resend), Slack, HTTP POST, webhooks, hosted forms, and MCP. No integration tiers or surcharges.' },
                    { q: 'How fast are workflow executions?', a: 'Sub-second trigger-to-execution. No cold starts, no queue delays. When an agent or API calls your workflow, it runs immediately.' },
                  ].map((item) => (
                    <details key={item.q} className="group border border-border rounded-lg bg-surface/50 hover:border-primary/50 transition-colors">
                      <summary className="px-5 py-4 cursor-pointer font-medium text-foreground flex justify-between items-center gap-4">
                        <span>{item.q}</span>
                        <ChevronDown className="w-5 h-5 text-text-muted group-open:text-primary group-open:rotate-180 transition-all duration-200 flex-shrink-0" />
                      </summary>
                      <div className="px-5 pb-5 pt-1">
                        <p className="text-text-muted leading-relaxed">{item.a}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </section>

              {/* Final CTA - with risk reversal */}
              <section className="text-center space-y-6 py-8">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                  Stop building automations AI can&apos;t use
                </h2>
                <p className="text-lg text-text-muted max-w-xl mx-auto">
                  Every workflow you build on a legacy platform is invisible to AI agents. Start building on agent-native infrastructure.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button href="/auth/register" variant="primary" size="lg">Start building for free</Button>
                </div>
                <p className="text-sm text-text-muted">Free plan. No credit card. Full MCP support included.</p>
              </section>

            </div>
          </main>
        </div>
      </Providers>
    </>
  );
}
