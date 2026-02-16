import { Footer } from "@/components/Footer";
import Navigation from "@/components/Navigation"
import Head from "next/head"

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Head>
        <title>Privacy Policy - ZeitFlow | AI Workflow Automation Platform</title>
        <meta name="description" content="Read ZeitFlow's privacy policy to understand how we collect, use, and protect your data when you use our AI workflow automation services." />
        <meta name="keywords" content="privacy policy, data protection, GDPR, CCPA, ZeitFlow, AI workflows, workflow automation, privacy, data security" />
        <meta property="og:title" content="Privacy Policy - ZeitFlow" />
        <meta property="og:description" content="Learn how ZeitFlow protects your privacy and data when using our AI workflow automation services." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.io'}/privacy`} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.io'}/logo-on-black.png`} />
        <meta property="og:site_name" content="ZeitFlow" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Privacy Policy - ZeitFlow" />
        <meta name="twitter:description" content="Learn how ZeitFlow protects your privacy and data when using our AI workflow automation services." />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.io'}/logo-on-black.png`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.io'}/privacy`} />
      </Head>
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 py-16 mt-10">
        <h1 className="text-4xl font-bold mb-4 text-primary">Privacy Policy</h1>
        <p className="text-text-muted mb-12">
          Effective Date: February 16, 2026 | Last Updated: February 16, 2026
        </p>

        <div className="space-y-8">
          {/* Introduction */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Introduction</h2>
            <p className="text-foreground leading-relaxed mb-4">
              ZeitFlow (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your information when you use
              our AI workflow automation platform (&quot;the Service&quot;).
            </p>
            <p className="text-foreground leading-relaxed font-semibold">
              We do not sell your personal information. We do not use your data for advertising. We do
              not train AI models on your data.
            </p>
          </section>

          {/* 1. Information We Collect */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Information We Collect</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Information You Provide</h3>
                <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
                  <li><strong>Account Information:</strong> Name, email address, and password when you register. If you sign in via Google OAuth, we receive your name, email, and profile picture from Google.</li>
                  <li><strong>Workflow Data:</strong> Prompts, workflow configurations, node settings, and any content you input into the Service.</li>
                  <li><strong>Integration Credentials:</strong> OAuth tokens and API keys for third-party services you connect (e.g., Slack, Google Calendar). These are stored encrypted.</li>
                  <li><strong>Payment Information:</strong> Billing details processed through Stripe. We do not store your full credit card number; Stripe handles this directly.</li>
                  <li><strong>Communications:</strong> Messages you send to our support team or through any contact forms.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Information Collected Automatically</h3>
                <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
                  <li><strong>Usage Data:</strong> Pages visited, features used, workflow execution logs, timestamps, and interaction patterns.</li>
                  <li><strong>Device Information:</strong> Browser type, operating system, and device type.</li>
                  <li><strong>Log Data:</strong> IP address, access times, and referring URLs.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 2. How We Use Your Information */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. How We Use Your Information</h2>
            <p className="text-foreground leading-relaxed mb-4">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
              <li><strong>Providing the Service:</strong> Processing your workflow requests, executing AI prompts, and delivering results.</li>
              <li><strong>Account Management:</strong> Creating and managing your account, authenticating your identity, and processing payments.</li>
              <li><strong>Service Improvement:</strong> Analyzing aggregate, anonymized usage patterns to improve the Service. We do not use individual prompt content for this purpose.</li>
              <li><strong>Communication:</strong> Sending you account-related notifications, security alerts, and (with your consent) product updates.</li>
              <li><strong>Security:</strong> Detecting, preventing, and addressing fraud, abuse, and security issues.</li>
              <li><strong>Legal Compliance:</strong> Complying with applicable laws, regulations, and legal processes.</li>
            </ul>
          </section>

          {/* 3. Data Processing & Third-Party Sub-Processors */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Data Processing &amp; Third-Party Sub-Processors</h2>
            <p className="text-foreground leading-relaxed mb-4">
              To provide the Service, your data is shared with the following categories of third-party
              sub-processors. When you submit a prompt or execute a workflow, your data may pass through
              these services:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-foreground text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 pr-4 font-semibold">Category</th>
                    <th className="text-left py-3 pr-4 font-semibold">Provider</th>
                    <th className="text-left py-3 font-semibold">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-3 pr-4">AI Processing</td>
                    <td className="py-3 pr-4">OpenRouter</td>
                    <td className="py-3">Routes AI requests to downstream model providers</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">AI Models</td>
                    <td className="py-3 pr-4">Google, Anthropic, Meta, OpenAI, and others via OpenRouter</td>
                    <td className="py-3">Process AI prompts and generate output</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">Database</td>
                    <td className="py-3 pr-4">Neon</td>
                    <td className="py-3">Serverless PostgreSQL database hosting</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">File Storage</td>
                    <td className="py-3 pr-4">Vercel Blob</td>
                    <td className="py-3">Image and asset storage</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">Email</td>
                    <td className="py-3 pr-4">Resend</td>
                    <td className="py-3">Transactional and workflow email delivery</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">SMS</td>
                    <td className="py-3 pr-4">Twilio</td>
                    <td className="py-3">SMS/text message delivery for workflows</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">Payments</td>
                    <td className="py-3 pr-4">Stripe</td>
                    <td className="py-3">Payment processing and subscription management</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">Authentication</td>
                    <td className="py-3 pr-4">Google OAuth</td>
                    <td className="py-3">Optional sign-in via Google account</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">Analytics</td>
                    <td className="py-3 pr-4">Google Analytics, Vemetric</td>
                    <td className="py-3">Aggregate usage analytics (anonymized)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-foreground leading-relaxed mt-4">
              Each sub-processor is bound by their own privacy policies and data processing agreements.
              We select sub-processors that maintain appropriate security standards and data protection
              practices.
            </p>
          </section>

          {/* 4. Data Retention */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Data Retention</h2>
            <p className="text-foreground leading-relaxed mb-4">
              We retain your data only as long as necessary for the purposes described in this policy:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
              <li><strong>Account Data:</strong> Retained for the duration of your account. Deleted within 30 days of account deletion request.</li>
              <li><strong>Workflow Data &amp; Prompts:</strong> Retained while your account is active. Deleted within 30 days of account deletion.</li>
              <li><strong>Workflow Execution Logs:</strong> Retained for 90 days, then automatically purged.</li>
              <li><strong>Debug &amp; Server Logs:</strong> Automatically scrubbed and deleted every 30 days.</li>
              <li><strong>Payment Records:</strong> Retained as required by tax and accounting regulations (typically 7 years for financial records).</li>
              <li><strong>AI Prompt Data:</strong> Prompts are sent to AI providers in real-time for processing and are not stored by us beyond the workflow execution log retention period. Refer to each AI provider&apos;s data retention policies for their handling of prompt data.</li>
            </ul>
          </section>

          {/* 5. Your Rights */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Your Rights</h2>
            <p className="text-foreground leading-relaxed mb-4">
              Depending on your location, you may have the following rights regarding your personal data.
              We honor these rights for all users regardless of jurisdiction:
            </p>
            <ul className="list-disc pl-6 space-y-3 text-foreground leading-relaxed">
              <li>
                <strong>Right to Access:</strong> You can request a copy of the personal data we hold about you.
                We will provide this in a commonly used, machine-readable format within 30 days of your request.
              </li>
              <li>
                <strong>Right to Rectification:</strong> You can request that we correct any inaccurate or
                incomplete personal data. You can also update most information directly through your account settings.
              </li>
              <li>
                <strong>Right to Deletion (Right to be Forgotten):</strong> You can request that we delete your
                personal data. You can initiate account deletion from your{' '}
                <a href="/settings" className="text-primary hover:underline">account settings page</a>.
                We will fulfill deletion requests within 30 days. Note: some data may be retained where required
                by law (e.g., financial records for tax compliance).
              </li>
              <li>
                <strong>Right to Data Portability:</strong> You can request a copy of your data in a structured,
                commonly used, machine-readable format (JSON or CSV).
              </li>
              <li>
                <strong>Right to Opt-Out of Data Sharing:</strong> We do not sell your data. However, you may
                opt out of analytics tracking by disabling cookies in your browser or by contacting us.
              </li>
              <li>
                <strong>Right to Restrict Processing:</strong> You can request that we limit how we process
                your personal data in certain circumstances.
              </li>
              <li>
                <strong>Right to Object:</strong> You can object to the processing of your personal data for
                certain purposes, such as direct marketing.
              </li>
              <li>
                <strong>Right to Withdraw Consent:</strong> Where processing is based on consent, you may
                withdraw that consent at any time without affecting the lawfulness of processing conducted
                before withdrawal.
              </li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:privacy@zeitflow.io" className="text-primary hover:underline">privacy@zeitflow.io</a>.
              We will respond to your request within 30 days. If we need additional time, we will notify you
              of the reason and extension period.
            </p>
          </section>

          {/* 6. GDPR Compliance (EEA/UK Users) */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. For Users in the European Economic Area &amp; United Kingdom</h2>
            <p className="text-foreground leading-relaxed mb-4">
              If you are located in the EEA or UK, the following additional provisions apply:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
              <li><strong>Legal Basis for Processing:</strong> We process your data based on: (a) performance of our contract with you (providing the Service), (b) your consent (for optional features like analytics), (c) our legitimate interests (security, fraud prevention, service improvement), and (d) legal obligations.</li>
              <li><strong>International Data Transfers:</strong> Your data may be transferred to and processed in the United States and other countries where our sub-processors operate. We rely on Standard Contractual Clauses (SCCs) and other appropriate safeguards to protect your data during international transfers.</li>
              <li><strong>Data Protection Officer:</strong> For GDPR-related inquiries, contact us at <a href="mailto:privacy@zeitflow.io" className="text-primary hover:underline">privacy@zeitflow.io</a>.</li>
              <li><strong>Supervisory Authority:</strong> You have the right to lodge a complaint with your local data protection supervisory authority if you believe we have not complied with applicable data protection laws.</li>
            </ul>
          </section>

          {/* 7. CCPA/CPRA Compliance (California Users) */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. For California Residents</h2>
            <p className="text-foreground leading-relaxed mb-4">
              If you are a California resident, the California Consumer Privacy Act (CCPA) and California
              Privacy Rights Act (CPRA) provide you with additional rights:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
              <li><strong>Right to Know:</strong> You have the right to know what personal information we collect, use, disclose, and sell (we do not sell personal information).</li>
              <li><strong>Right to Delete:</strong> You have the right to request deletion of your personal information, subject to certain exceptions.</li>
              <li><strong>Right to Opt-Out of Sale:</strong> We do not sell your personal information. As such, we do not offer an opt-out of sale mechanism because there is no sale to opt out of.</li>
              <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights.</li>
              <li><strong>Shine the Light:</strong> We do not disclose personal information to third parties for their direct marketing purposes.</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              To exercise your CCPA/CPRA rights, contact us at{' '}
              <a href="mailto:privacy@zeitflow.io" className="text-primary hover:underline">privacy@zeitflow.io</a>.
            </p>
          </section>

          {/* 8. Cookies & Tracking */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Cookies &amp; Tracking Technologies</h2>
            <p className="text-foreground leading-relaxed mb-4">
              We use the following cookies and similar technologies:
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Essential Cookies</h3>
                <p className="text-foreground leading-relaxed">
                  Required for the Service to function. These include session cookies for authentication
                  (NextAuth.js session tokens) and CSRF protection. These cannot be disabled.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Functional Cookies</h3>
                <p className="text-foreground leading-relaxed">
                  Used to remember your preferences, such as your theme choice (light/dark mode). Stored
                  in localStorage.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Analytics Cookies</h3>
                <p className="text-foreground leading-relaxed">
                  We use Google Analytics and Vemetric to understand aggregate usage patterns. These
                  collect anonymized data about page views, feature usage, and general interaction
                  patterns. You can opt out of analytics tracking by:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-foreground leading-relaxed mt-2">
                  <li>Using your browser&apos;s Do Not Track (DNT) setting</li>
                  <li>Installing a browser extension that blocks analytics scripts</li>
                  <li>Contacting us at <a href="mailto:privacy@zeitflow.io" className="text-primary hover:underline">privacy@zeitflow.io</a> to request opt-out</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Third-Party Scripts</h3>
                <p className="text-foreground leading-relaxed">
                  We do not use cookies for advertising or ad targeting. We do not allow third-party
                  advertising networks to place cookies through our Service.
                </p>
              </div>
            </div>
          </section>

          {/* 9. Children's Privacy */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Children&apos;s Privacy (COPPA)</h2>
            <p className="text-foreground leading-relaxed mb-4">
              The Service is intended solely for users 18 or older (or 16 in certain jurisdictions). We
              do not knowingly collect personal information from children under the age of 13.
            </p>
            <p className="text-foreground leading-relaxed mb-4">
              If we learn that a user is under 13, we will:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
              <li>Terminate the account immediately</li>
              <li>Delete all associated personal data within 48 hours</li>
              <li>Notify the parent or guardian if contact information is available</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              If you are a parent or guardian and believe your child under 13 has provided us with personal
              information, please contact us immediately at{' '}
              <a href="mailto:privacy@zeitflow.io" className="text-primary hover:underline">privacy@zeitflow.io</a> so
              we can take appropriate action.
            </p>
          </section>

          {/* 10. Data Security */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Data Security</h2>
            <p className="text-foreground leading-relaxed mb-4">
              We implement appropriate technical and organizational measures to protect your personal
              information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
              <li>Encryption of data in transit (TLS/HTTPS) and sensitive data at rest</li>
              <li>Secure password hashing (bcrypt)</li>
              <li>OAuth token encryption for third-party integrations</li>
              <li>Rate limiting and abuse prevention mechanisms</li>
              <li>Regular security reviews of our codebase and infrastructure</li>
              <li>Access controls limiting employee access to personal data on a need-to-know basis</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              While we strive to protect your data, no method of electronic transmission or storage is
              100% secure. We cannot guarantee absolute security, but we are committed to implementing
              industry-standard protections.
            </p>
          </section>

          {/* 11. Security Incident Response */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">11. Security Incident Response</h2>
            <p className="text-foreground leading-relaxed mb-4">
              In the event of a data breach that affects your personal information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
              <li><strong>Notification Timeline:</strong> We will notify affected users via email within
                72 hours of discovering the breach, in compliance with GDPR requirements. For California
                residents, we will comply with applicable state notification deadlines.</li>
              <li><strong>Notification Content:</strong> Our notification will include the nature of the breach,
                the types of data affected, the steps we are taking to address it, and recommendations for
                protecting yourself.</li>
              <li><strong>Regulatory Reporting:</strong> We will report the breach to relevant supervisory
                authorities as required by applicable law.</li>
              <li><strong>Sub-Processor Breaches:</strong> If a breach occurs at one of our sub-processors
                (e.g., OpenRouter, Neon, Vercel), we will notify affected users as soon as we are informed
                by the sub-processor.</li>
            </ul>
          </section>

          {/* 12. Account Deletion */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">12. Account Deletion</h2>
            <p className="text-foreground leading-relaxed mb-4">
              You can delete your account at any time from your{' '}
              <a href="/settings" className="text-primary hover:underline">account settings page</a>.
              When you request account deletion:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
              <li>Your account will be deactivated immediately</li>
              <li>All personal data, workflows, chains, execution logs, and associated content will be permanently deleted within 30 days</li>
              <li>Integration tokens (Slack, Google, etc.) will be revoked and deleted</li>
              <li>Data that has already been sent to third-party services (e.g., emails sent via Resend, SMS sent via Twilio) cannot be recalled</li>
              <li>Financial records may be retained as required by law</li>
              <li>We will request deletion of your data from our sub-processors where technically feasible</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              If you need assistance with account deletion or have questions about data removal, contact
              us at{' '}
              <a href="mailto:privacy@zeitflow.io" className="text-primary hover:underline">privacy@zeitflow.io</a>.
            </p>
          </section>

          {/* 13. Data Minimization */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">13. Data Minimization</h2>
            <p className="text-foreground leading-relaxed">
              We adhere to the principle of data minimization. We only collect and retain the minimum
              amount of personal data necessary to provide the Service and fulfill our legal obligations.
              We do not collect data &quot;just in case&quot; or for speculative future use. Workflow execution
              data is automatically purged according to the retention schedules outlined in Section 4.
              Debug logs are automatically scrubbed and deleted every 30 days.
            </p>
          </section>

          {/* 14. Law Enforcement & Third-Party Data Requests */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">14. Law Enforcement &amp; Third-Party Data Requests</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Our Commitment</h3>
                <p className="text-foreground leading-relaxed">
                  We take your privacy extremely seriously. <strong>Under no circumstances will we voluntarily
                  disclose your personal information, prompt history, workflow data, or account information to
                  any third party</strong> — including law enforcement agencies, government bodies, or private
                  litigants — unless we are legally compelled to do so.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">The Warrant &amp; Court Order Requirement</h3>
                <p className="text-foreground leading-relaxed">
                  Access to user data by any third party is strictly prohibited unless we are served with
                  <strong> both a valid search warrant and a court order</strong> issued by a court of competent
                  jurisdiction, specifically identifying the data to be disclosed. We will not honor informal
                  requests, voluntary information-sharing agreements, or requests that do not meet this
                  standard. Broad or vague requests that do not specify the particular data sought will be
                  challenged.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">No Voluntary Disclosure</h3>
                <p className="text-foreground leading-relaxed">
                  We do not participate in voluntary data-sharing programs with law enforcement or government
                  agencies. We do not provide &quot;backdoor&quot; access to user data. We do not retain data
                  beyond our stated retention periods for the purpose of making it available to third parties.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">User Notification</h3>
                <p className="text-foreground leading-relaxed">
                  If we receive a valid legal request for your data, we will notify you at the email address
                  associated with your account as soon as legally permitted. The only exception to this
                  notification is if we are subject to a court-issued gag order or similar legal prohibition
                  that prevents us from informing you. Once any such prohibition expires, we will notify you
                  promptly.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Compelled Disclosure</h3>
                <p className="text-foreground leading-relaxed">
                  If we are legally compelled to disclose your data pursuant to a valid warrant and court order,
                  we will disclose only the specific data identified in the order — nothing more. We are not
                  liable for any disclosure made in compliance with valid legal process.
                </p>
              </div>
            </div>
          </section>

          {/* 15. Do Not Sell */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">15. We Do Not Sell Your Information</h2>
            <p className="text-foreground leading-relaxed">
              We want to be unambiguous about this: <strong>we do not sell, rent, lease, or trade your
              personal information to any third party for any purpose.</strong> Your prompts, workflow
              data, personal details, and usage information are never monetized through data brokerage
              or advertising. Your data is used solely to provide and improve the Service as described
              in this policy.
            </p>
          </section>

          {/* 16. Changes to This Policy */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">16. Changes to This Policy</h2>
            <p className="text-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material changes
              by sending an email to the address associated with your account and/or by placing a prominent
              notice on the Service at least 30 days before the changes take effect. We encourage you to
              review this policy periodically. Your continued use of the Service after changes become
              effective constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* 17. Contact */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">17. Contact Us</h2>
            <p className="text-foreground leading-relaxed mb-4">
              If you have questions about this Privacy Policy, want to exercise your data rights, or have
              a privacy concern, please contact us:
            </p>
            <ul className="list-none space-y-2 text-foreground leading-relaxed">
              <li><strong>Privacy Inquiries:</strong>{' '}
                <a href="mailto:privacy@zeitflow.io" className="text-primary hover:underline">privacy@zeitflow.io</a>
              </li>
              <li><strong>General Support:</strong>{' '}
                <a href="mailto:support@zeitflow.io" className="text-primary hover:underline">support@zeitflow.io</a>
              </li>
              <li><strong>Data Deletion Requests:</strong>{' '}
                <a href="mailto:privacy@zeitflow.io" className="text-primary hover:underline">privacy@zeitflow.io</a> (or use the{' '}
                <a href="/settings" className="text-primary hover:underline">account settings page</a>)
              </li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              We aim to respond to all privacy-related inquiries within 30 days. You can also reach us
              through our <a href="/contact" className="text-primary hover:underline">Contact page</a>.
            </p>
          </section>

          <section className="text-center pt-8">
            <p className="text-sm text-text-muted">
              Effective Date: February 16, 2026
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
