
import { Button } from '../components/Button';
import AnimatedBackground from '@/app/components/AnimatedBackground';
import Logo from '@/app/components/Logo';
import Navigation from '@/components/Navigation';
import Providers from './providers';
import Head from 'next/head';
import {
  Zap,
  Layers,
  Rocket,
  Workflow,
  FileText,
  Webhook,
  Sparkles,
  MessageSquare,
  Mail,
  Send,
  History,
  Inbox,
  ArrowRightLeft,
  UserPlus,
  Bell,
  MessageCircle,
  Phone,
  Globe,
  Hash,
  Calendar,
  Gift,
  Building2,
  ChevronDown,
  ArrowRight,
  ArrowDown,
} from 'lucide-react';

export default function Home() {
  return (
    <>
      <Head>
        <title>Zeitflow - Workflow automation without the complexity</title>
        <meta name="description" content="Zeitflow connects forms and APIs to AI parsing, notifications, and HTTP endpoints. Build workflows visually, deploy instantly, and monitor every run." />
        <meta name="keywords" content="workflow automation, Zeitflow, API integration, developer tools, internal automation, webhooks" />
        <meta property="og:title" content="Zeitflow - Workflow automation without the complexity" />
        <meta property="og:description" content="Zeitflow connects forms and APIs to AI parsing, notifications, and HTTP endpoints. Build workflows visually, deploy instantly, and monitor every run." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={process.env.NEXT_PUBLIC_URL || 'https://zeitflow.ai'} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.ai'}/logo-on-black.png`} />
        <meta property="og:site_name" content="Zeitflow" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Zeitflow - Workflow automation without the complexity" />
        <meta name="twitter:description" content="Zeitflow connects forms and APIs to AI parsing, notifications, and HTTP endpoints. Build workflows visually, deploy instantly, and monitor every run." />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.ai'}/logo-on-black.png`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={process.env.NEXT_PUBLIC_URL || 'https://zeitflow.ai'} />
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
                <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
                  Workflow automation without the complexity
                </h1>
                <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto">
                  Zeitflow connects forms and APIs to AI parsing, notifications, and HTTP endpoints. Build workflows visually, deploy instantly, and monitor every run.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button href="/auth/register" variant="primary" size="lg">Get started free</Button>
                  <Button href="https://cap.so/s/qegqpre7vpq3jrf" variant="secondary" size="lg">Watch demo</Button>
                </div>
                <p className="text-sm text-text-muted">
                  Currently in beta. Best for internal workflows and developer utilities.
                </p>
              </section>

              {/* Workflow Diagram */}
              <section className="space-y-8">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground text-center">How a workflow runs</h2>

                <div className="relative p-6 md:p-8 rounded-2xl border border-border bg-surface/30">
                  {/* Desktop: Horizontal flow */}
                  <div className="hidden md:block">
                    {/* Connecting line */}
                    <div className="absolute top-[3.8rem] left-[15%] right-[15%] h-px bg-primary/30 overflow-hidden">
                      {/* Animated glow */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-20 h-2 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full blur-md shadow-[0_0_12px_var(--primary)] animate-flow-glow" />
                    </div>

                    <div className="relative flex items-start justify-between max-w-2xl mx-auto">
                      {[
                        { icon: FileText, label: 'Form or API', desc: 'Trigger' },
                        { icon: Sparkles, label: 'AI Parse', desc: 'Normalize' },
                        { icon: Send, label: 'Notify / POST', desc: 'Action' },
                        { icon: History, label: 'Logs', desc: 'Monitor' },
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
                    {/* Connecting line */}
                    <div className="absolute left-[1.45rem] top-6 bottom-6 w-px bg-primary/30 overflow-hidden">
                      {/* Animated glow */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-10 w-2 bg-gradient-to-b from-transparent via-primary to-transparent rounded-full blur-md shadow-[0_0_12px_var(--primary)] animate-flow-glow-vertical" />
                    </div>

                    <div className="relative space-y-6">
                      {[
                        { icon: FileText, label: 'Form or API', desc: 'Trigger' },
                        { icon: Sparkles, label: 'AI Parse', desc: 'Normalize' },
                        { icon: Send, label: 'Notify / POST', desc: 'Action' },
                        { icon: History, label: 'Logs', desc: 'Monitor' },
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

              {/* How it works */}
              <section className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground">How it works</h2>
                <ol className="space-y-6">
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Zap className="w-5 h-5" />
                    </span>
                    <div>
                      <strong className="text-foreground">Create a trigger</strong>
                      <p className="text-text-muted mt-1">Host a public form or expose an API endpoint to accept incoming data.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Layers className="w-5 h-5" />
                    </span>
                    <div>
                      <strong className="text-foreground">Add actions</strong>
                      <p className="text-text-muted mt-1">Parse input with AI, send an SMS or email, or POST to an external service.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Rocket className="w-5 h-5" />
                    </span>
                    <div>
                      <strong className="text-foreground">Deploy and monitor</strong>
                      <p className="text-text-muted mt-1">Publish your workflow and track every run in the logs.</p>
                    </div>
                  </li>
                </ol>
              </section>

              {/* Capabilities */}
              <section className="space-y-8">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Capabilities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { title: 'Visual workflow builder', desc: 'Drag-and-drop interface for connecting triggers to actions in a linear sequence.', icon: Workflow },
                    { title: 'Hosted public forms', desc: 'Generate shareable form URLs that trigger workflows on submission.', icon: FileText },
                    { title: 'API triggers', desc: 'Accept JSON payloads via HTTP to start workflow execution programmatically.', icon: Webhook },
                    { title: 'AI text parsing', desc: 'Extract and normalize unstructured input into usable text output.', icon: Sparkles },
                    { title: 'SMS notifications', desc: 'Send outbound text messages via Twilio when workflows run.', icon: MessageSquare },
                    { title: 'Email notifications', desc: 'Send outbound emails via Resend as part of your workflow.', icon: Mail },
                    { title: 'HTTP POST', desc: 'Forward data to external services with configurable body and parameters.', icon: Send },
                    { title: 'Logs and run history', desc: 'Inspect every workflow execution with full input and output visibility.', icon: History },
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

              {/* Use cases */}
              <section className="space-y-8">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Use cases</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { title: 'Internal request intake', desc: 'Collect requests via form, parse with AI, and notify the right person via SMS or email.', icon: Inbox },
                    { title: 'Webhook normalization', desc: 'Accept webhooks from external services, transform the payload, and forward to your internal systems.', icon: ArrowRightLeft },
                    { title: 'Lead capture to CRM', desc: 'Collect form submissions, extract key fields with AI, and POST to your CRM or database.', icon: UserPlus },
                    { title: 'On-call alerting', desc: 'Trigger SMS notifications to team members when an API endpoint receives a specific payload.', icon: Bell },
                    { title: 'Feedback processing', desc: 'Accept user feedback via form, summarize with AI, and email the summary to your team.', icon: MessageCircle },
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
                    <p className="text-text-muted mt-2">Pre-built workflows you can deploy and customize in minutes.</p>
                  </div>
                  <Button href="/templates" variant="tertiary" className="hidden sm:inline-flex">
                    Browse all templates <ArrowRight className="w-4 h-4 ml-1 inline" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { icon: '🎧', name: 'Support Ticket Router', desc: 'Route incoming tickets to the right team with AI-powered urgency and category analysis.', tags: ['AI', 'Slack'] },
                    { icon: '💰', name: 'Lead Qualification', desc: 'Score and qualify sales leads using AI, then route hot prospects to your sales team.', tags: ['AI', 'Sales'] },
                    { icon: '📬', name: 'Webhook to Email', desc: 'Receive webhook data and forward it via email. Perfect for notifications and alerts.', tags: ['Email', 'Webhook'] },
                    { icon: '🤖', name: 'FAQ Responder', desc: 'Automatically answer common questions using AI to generate context-aware responses.', tags: ['AI', 'Email'] },
                    { icon: '📊', name: 'Daily Report Generator', desc: 'Compile and send daily digest emails with AI-generated summaries of key metrics.', tags: ['AI', 'Reporting'] },
                  ].map((tpl) => (
                    <article key={tpl.name} className="p-5 rounded-lg border border-border bg-surface/50 hover:border-primary/30 transition-colors">
                      <div className="text-2xl mb-3">{tpl.icon}</div>
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
                        <Phone className="w-4 h-4 text-primary" />
                        <span>Twilio (outbound SMS)</span>
                      </li>
                      <li className="flex items-center gap-3 text-text-muted">
                        <Mail className="w-4 h-4 text-primary" />
                        <span>Resend (outbound email)</span>
                      </li>
                      <li className="flex items-center gap-3 text-text-muted">
                        <Globe className="w-4 h-4 text-primary" />
                        <span>HTTP POST (any endpoint)</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-4">Planned</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-text-muted">
                        <Hash className="w-4 h-4 text-text-muted" />
                        <span>Slack</span>
                      </li>
                      <li className="flex items-center gap-3 text-text-muted">
                        <Calendar className="w-4 h-4 text-text-muted" />
                        <span>Google Calendar</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Pricing */}
              <section className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Pricing</h2>
                <p className="text-text-muted">Simple, usage-based pricing. No hidden fees.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { name: 'Free', price: '$0', requests: '20 executions/hour', icon: Gift },
                    { name: 'Pro', price: '$9.99', requests: '100 executions/hour', icon: Zap },
                    { name: 'Business', price: '$29.99', requests: '1,000 executions/hour', icon: Building2 },
                  ].map((plan) => (
                    <div key={plan.name} className="p-6 rounded-lg border border-border bg-surface/50 text-center">
                      <div className="flex justify-center mb-4">
                        <span className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <plan.icon className="w-6 h-6" />
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{plan.name}</h3>
                      <p className="text-2xl font-bold text-foreground">{plan.price}<span className="text-sm font-normal text-text-muted">/month</span></p>
                      <p className="text-sm text-primary mt-2">
                        {plan.requests}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-text-muted text-center">
                  An execution is one complete run of your workflow, from trigger to final action.
                </p>
              </section>

              {/* FAQ */}
              <section className="space-y-8">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Frequently asked questions</h2>
                <div className="space-y-3">
                  {[
                    { q: 'What workflows is Zeitflow best for?', a: 'Zeitflow is designed for fast internal workflows. The typical pattern is: receive data via form or API, normalize it with AI, then notify someone or POST to another service. It works well for intake forms, webhook processing, and notification routing.' },
                    { q: 'Is it a replacement for n8n?', a: 'Zeitflow is simpler and more opinionated. If you need dozens of integrations or complex orchestration, n8n may be a better fit. Zeitflow is for developers who want to build and deploy workflows quickly without the configuration overhead.' },
                    { q: 'Does it support branching or conditional logic?', a: 'Yes. You can add conditional branches to route data based on rules or AI decisions.' },
                    { q: 'What triggers are supported today?', a: 'Hosted public forms and API triggers. You can generate a shareable form URL or accept JSON payloads via HTTP to start a workflow.' },
                    { q: 'What actions are supported today?', a: 'AI text parsing (text output only), outbound SMS via Twilio, outbound email via Resend, and HTTP POST with configurable body and parameters.' },
                    { q: 'Is it production-ready?', a: 'Zeitflow is currently in beta. It is functional and actively used, but you should evaluate whether it meets your reliability requirements before depending on it for critical workflows.' },
                    { q: 'Can I bring my own API keys?', a: 'No. Zeitflow does not currently support BYOK (bring your own keys). All AI processing and integrations use Zeitflow-managed credentials.' },
                    { q: 'Are AI agents supported?', a: 'No. AI agents are on the roadmap but not available today. Current AI functionality is limited to text parsing and extraction.' },
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

              {/* Final CTA */}
              <section className="text-center space-y-6 py-8">
                <p className="text-lg text-text-muted">Start automating internal workflows in minutes.</p>
                <Button href="/auth/register" variant="primary" size="lg">Get started free</Button>
              </section>

            </div>
          </main>
        </div>
      </Providers>
    </>
  );
}
