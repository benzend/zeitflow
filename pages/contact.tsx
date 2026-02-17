"use client";
import { Footer } from "@/components/Footer";
import Navigation from "@/components/Navigation"
import Head from "next/head"

export default function Contact() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Head>
        <title>Contact Us - ZeitFlow | AI Workflow Automation Platform</title>
        <meta name="description" content="Get in touch with the ZeitFlow team. Reach us via email for support, privacy inquiries, or general questions about our AI workflow automation platform." />
        <meta name="keywords" content="contact, support, help, ZeitFlow, AI workflows, workflow automation, customer support" />
        <meta property="og:title" content="Contact Us - ZeitFlow" />
        <meta property="og:description" content="Get in touch with the ZeitFlow team for support, privacy inquiries, or general questions." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.io'}/contact`} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.io'}/logo-on-black.png`} />
        <meta property="og:site_name" content="ZeitFlow" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact Us - ZeitFlow" />
        <meta name="twitter:description" content="Get in touch with the ZeitFlow team for support, privacy inquiries, or general questions." />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.io'}/logo-on-black.png`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.io'}/contact`} />
      </Head>
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 py-16 mt-10">
        <h1 className="text-4xl font-bold mb-4 text-primary">Contact Us</h1>
        <p className="text-text-muted mb-12 text-lg">
          Have a question, need help, or want to share feedback? Reach out directly — I read and respond to every message personally.
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          {/* General Support */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground">General Support</h2>
            </div>
            <p className="text-foreground leading-relaxed mb-4">
              Questions about using ZeitFlow, account issues, billing, or general feedback.
            </p>
            <a
              href="mailto:support@zeitflow.io"
              className="text-primary hover:underline font-medium text-lg"
            >
              support@zeitflow.io
            </a>
            <p className="text-text-muted text-sm mt-3">
              I aim to respond within 1-2 business days.
            </p>
          </section>

          {/* Privacy & Data */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Privacy &amp; Data Requests</h2>
            </div>
            <p className="text-foreground leading-relaxed mb-4">
              Data access requests, deletion requests, GDPR/CCPA inquiries, or any privacy-related concerns.
            </p>
            <a
              href="mailto:privacy@zeitflow.io"
              className="text-primary hover:underline font-medium text-lg"
            >
              privacy@zeitflow.io
            </a>
            <p className="text-text-muted text-sm mt-3">
              Privacy requests are handled within 30 days as required by law.
            </p>
          </section>

          {/* Bug Reports & Feature Requests */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Bug Reports &amp; Feedback</h2>
            </div>
            <p className="text-foreground leading-relaxed mb-4">
              Found a bug or have a feature request? Let me know so I can make ZeitFlow better.
            </p>
            <a
              href="mailto:support@zeitflow.io"
              className="text-primary hover:underline font-medium text-lg"
            >
              support@zeitflow.io
            </a>
            <p className="text-text-muted text-sm mt-3">
              Include steps to reproduce any bugs and I&apos;ll look into it.
            </p>
          </section>

          {/* Legal */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Legal</h2>
            </div>
            <p className="text-foreground leading-relaxed mb-4">
              Legal notices, DMCA takedowns, copyright infringement, or other legal matters.
              You can also use our{' '}
              <a href="/report" className="text-primary hover:underline">Report Content form</a>.
            </p>
            <a
              href="mailto:legal@zeitflow.io"
              className="text-primary hover:underline font-medium text-lg"
            >
              legal@zeitflow.io
            </a>
            <p className="text-text-muted text-sm mt-3">
              For time-sensitive legal matters, please note the urgency in your subject line.
            </p>
          </section>
        </div>

        {/* Support Hours & SLA */}
        <div className="mt-12 space-y-8">
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Support Hours &amp; Response Times</h2>
            <p className="text-foreground leading-relaxed mb-4">
              ZeitFlow is built and operated by one person — me. That means when you email support,
              you&apos;re talking to the person who actually built the platform. You&apos;ll get thoughtful,
              technical responses, not canned replies from a script. The tradeoff is that support isn&apos;t 24/7.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Support Hours</h3>
                <p className="text-foreground leading-relaxed">
                  <strong>Monday - Friday:</strong> 9:00 AM - 5:00 PM EST<br />
                  <strong>Weekends &amp; U.S. Public Holidays:</strong> Closed<br />
                  <span className="text-text-muted text-sm">
                    Any message received after 5:00 PM will be treated as received at 9:00 AM the following business day.
                  </span>
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Response Time Targets</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-foreground text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 pr-4 font-semibold">Priority</th>
                        <th className="text-left py-3 pr-4 font-semibold">Issue Type</th>
                        <th className="text-left py-3 font-semibold">Target Response</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="py-3 pr-4"><span className="text-red-400 font-medium">Critical</span></td>
                        <td className="py-3 pr-4">Full system outage (no one can run workflows)</td>
                        <td className="py-3">8 business hours</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4"><span className="text-yellow-400 font-medium">Urgent</span></td>
                        <td className="py-3 pr-4">Paid account billing issues or broken paid features</td>
                        <td className="py-3">24 business hours</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4"><span className="text-blue-400 font-medium">Normal</span></td>
                        <td className="py-3 pr-4">General how-to questions or template bugs</td>
                        <td className="py-3">3-5 business days</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4"><span className="text-text-muted font-medium">Feedback</span></td>
                        <td className="py-3 pr-4">Feature requests or free tier questions</td>
                        <td className="py-3">Best effort</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-text-muted text-sm mt-3">
                  These are targets, not guarantees. Critical issues affecting all users are always prioritized first.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Before You Reach Out</h2>
            <p className="text-foreground leading-relaxed mb-4">
              You might find the answer to your question in one of these resources:
            </p>
            <ul className="space-y-3">
              <li>
                <a href="/blog" className="text-primary hover:underline font-medium">Blog &amp; Guides</a>
                <span className="text-text-muted"> - Tutorials, tips, and platform updates</span>
              </li>
              <li>
                <a href="/release-notes" className="text-primary hover:underline font-medium">Release Notes</a>
                <span className="text-text-muted"> - Latest features and changes</span>
              </li>
              <li>
                <a href="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</a>
                <span className="text-text-muted"> - How we handle your data</span>
              </li>
              <li>
                <a href="/terms" className="text-primary hover:underline font-medium">Terms of Service</a>
                <span className="text-text-muted"> - Usage rules and guidelines</span>
              </li>
            </ul>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Account Issues</h2>
            <p className="text-foreground leading-relaxed">
              Need to delete your account or manage your data? You can do that directly from your{' '}
              <a href="/settings" className="text-primary hover:underline">account settings</a>.
              If you&apos;re locked out of your account or experiencing issues with login, email us at{' '}
              <a href="mailto:support@zeitflow.io" className="text-primary hover:underline">support@zeitflow.io</a>{' '}
              with the email address associated with your account and I&apos;ll help you get back in.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
