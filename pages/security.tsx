"use client";
import { Footer } from "@/components/Footer";
import { getCanonicalSiteOrigin } from "@/lib/site";
import Navigation from "@/components/Navigation";
import Head from "next/head";
import Link from "next/link";

export default function Security() {
  const origin = getCanonicalSiteOrigin();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Head>
        <title>Security - ZeitFlow | AI Workflow Automation Platform</title>
        <meta
          name="description"
          content="How ZeitFlow protects account data: AES-256-GCM encryption for secrets, bcrypt passwords, API tokens, webhook secrets, rate limits, and account deletion."
        />
        <meta property="og:title" content="Security - ZeitFlow" />
        <meta
          property="og:description"
          content="Encryption, authentication, webhook secrets, rate limits, and account deletion as implemented in ZeitFlow."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${origin}/security`} />
        <meta property="og:image" content={`${origin}/logo-on-black.png`} />
        <meta property="og:site_name" content="ZeitFlow" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Security - ZeitFlow" />
        <meta
          name="twitter:description"
          content="Encryption, authentication, webhook secrets, rate limits, and account deletion as implemented in ZeitFlow."
        />
        <meta name="twitter:image" content={`${origin}/logo-on-black.png`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${origin}/security`} />
      </Head>
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 py-16 mt-10">
        <h1 className="text-4xl font-bold mb-4 text-primary">Security</h1>
        <p className="text-text-muted mb-12 text-lg">
          This page describes the controls implemented in the ZeitFlow codebase and the
          commitments written in the privacy policy. It does not describe a third-party
          audit, and it does not claim a certification such as SOC 2 or ISO 27001.
        </p>

        <div className="space-y-8">
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Encryption at rest</h2>
            <p className="text-foreground leading-relaxed mb-4">
              Sensitive values stored in the database are encrypted with AES-256-GCM before
              they are written. Each value gets its own random initialization vector and an
              authentication tag, so a modified ciphertext fails to decrypt. The key comes
              from the <code>ENCRYPTION_KEY</code> environment variable, a 32-byte hex string.
            </p>
            <p className="text-foreground leading-relaxed mb-4">
              That encryption covers account API tokens, workflow webhook secrets, OAuth
              tokens for connected services, and known secret fields inside node
              configuration. Those fields include API keys, bot tokens, access tokens,
              Twilio auth tokens, SMTP passwords, and Resend API keys. Other node fields are
              stored as entered.
            </p>
            <p className="text-foreground leading-relaxed">
              API tokens are also stored as a SHA-256 hash so a request can be matched
              without decrypting every row.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Sign-in</h2>
            <p className="text-foreground leading-relaxed mb-4">
              Accounts sign in with email and password, or with Google OAuth, through
              NextAuth.js. Passwords are hashed with bcrypt at cost factor 12. The
              registration API requires a password of at least 6 characters.
            </p>
            <p className="text-foreground leading-relaxed">
              Browser sessions use the NextAuth session cookie. CLI and MCP clients send{" "}
              <code>Authorization: Bearer &lt;token&gt;</code>. Each account has one API
              token. Generating a new token replaces the previous one. The token identifies
              the account; it is not split into separate permission scopes.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Webhooks</h2>
            <p className="text-foreground leading-relaxed">
              A workflow in webhook mode gets a 32-character hex secret from{" "}
              <code>crypto.randomBytes</code>. The secret is encrypted at rest. Incoming
              requests are checked with a constant-time comparison. You can rotate the
              secret from the workflow builder, which replaces the stored value.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Transport and hosting</h2>
            <p className="text-foreground leading-relaxed mb-4">
              The public site is served over HTTPS. The privacy policy states that data in
              transit is protected with TLS, and that the database is hosted on Neon, files
              on Vercel Blob, and AI requests are routed through OpenRouter to downstream
              model providers.
            </p>
            <p className="text-foreground leading-relaxed">
              Payment card numbers are not stored by ZeitFlow. The privacy policy states
              that Stripe processes billing details.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Rate limits</h2>
            <p className="text-foreground leading-relaxed mb-4">
              Several API routes are limited per client IP. The workflows API allows 100
              requests per hour. Workflow read, stats, and execution-detail routes allow
              200 per hour. Uploads allow 10 requests per minute.
            </p>
            <p className="text-foreground leading-relaxed">
              The{" "}
              <Link href="/pricing" className="text-primary hover:underline">
                pricing page
              </Link>{" "}
              lists 20, 100, and 1,000 per hour for Free, Pro, and Business. The same
              numbers are the per-account limits applied when adding work to a queue.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Logs, deletion, and incidents</h2>
            <p className="text-foreground leading-relaxed mb-4">
              Each workflow run stores a structured execution log. The privacy policy says
              execution logs are kept for 90 days, debug logs for 30 days, and that
              personal data is deleted within 30 days of an account-deletion request.
            </p>
            <p className="text-foreground leading-relaxed mb-4">
              You can delete an account from{" "}
              <Link href="/settings" className="text-primary hover:underline">
                account settings
              </Link>
              . Email-and-password accounts must confirm the account email and the current
              password. The deletion handler stops pending queued chains for that account,
              attempts to cancel a Stripe subscription, and deletes the user record.
              Workflows and other account-owned rows that use on-delete cascade are
              removed with it.
            </p>
            <p className="text-foreground leading-relaxed">
              The privacy policy states that affected users are emailed within 72 hours of
              discovering a personal-data breach. Data-handling details, the sub-processor
              list, and that notification commitment are in the{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                privacy policy
              </Link>
              .
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Reporting a problem</h2>
            <p className="text-foreground leading-relaxed">
              Send security reports to{" "}
              <a href="mailto:support@zeitflow.io" className="text-primary hover:underline">
                support@zeitflow.io
              </a>
              . That address reaches the person who operates the service. Privacy requests
              go to{" "}
              <a href="mailto:privacy@zeitflow.io" className="text-primary hover:underline">
                privacy@zeitflow.io
              </a>
              . There is no separate disclosure program published in this repository.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
