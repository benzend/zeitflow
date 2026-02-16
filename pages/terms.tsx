"use client";
import { Footer } from "@/components/Footer";
import Navigation from "@/components/Navigation"
import Head from "next/head"

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Head>
        <title>Terms of Service - ZeitFlow | AI Workflow Automation Platform</title>
        <meta name="description" content="Read ZeitFlow's terms of service to understand the rules and guidelines for using our AI workflow automation platform." />
        <meta name="keywords" content="terms of service, terms, legal, ZeitFlow, AI workflows, workflow automation, user agreement, service terms" />
        <meta property="og:title" content="Terms of Service - ZeitFlow" />
        <meta property="og:description" content="Read the terms and conditions for using ZeitFlow's AI workflow automation platform." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.ai'}/terms`} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.ai'}/logo-on-black.png`} />
        <meta property="og:site_name" content="ZeitFlow" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Terms of Service - ZeitFlow" />
        <meta name="twitter:description" content="Read the terms and conditions for using ZeitFlow's AI workflow automation platform." />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.ai'}/logo-on-black.png`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.ai'}/terms`} />
      </Head>
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 py-16 mt-10">
        <h1 className="text-4xl font-bold mb-4 text-primary">Terms of Service</h1>
        <p className="text-text-muted mb-12">
          Effective Date: February 16, 2026 | Last Updated: February 16, 2026
        </p>

        <div className="space-y-8">
          {/* 1. Acceptance */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Acceptance of Terms</h2>
            <p className="text-foreground leading-relaxed">
              By accessing or using ZeitFlow (&quot;the Service&quot;), operated by ZeitFlow (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;),
              you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms,
              you must not access or use the Service. We may update these Terms from time to time. We will notify
              you of material changes via the email address associated with your account or through a prominent
              notice on the Service. Continued use of the Service after such notification constitutes acceptance
              of the updated Terms.
            </p>
          </section>

          {/* 2. Eligibility / Age Restriction */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Eligibility</h2>
            <p className="text-foreground leading-relaxed mb-4">
              The Service is intended solely for users who are 18 years of age or older (or 16 in jurisdictions
              where this is the legal minimum age for consent to data processing). By using the Service, you
              represent and warrant that you meet this age requirement.
            </p>
            <p className="text-foreground leading-relaxed">
              <strong>Children&apos;s Privacy (COPPA Compliance):</strong> We do not knowingly collect personal
              information from children under the age of 13. If we learn that a user is under 13, we will
              terminate the account and delete all associated data immediately. If you believe a child under
              13 has provided us with personal information, please contact us at{' '}
              <a href="mailto:privacy@zeitflow.ai" className="text-primary hover:underline">privacy@zeitflow.ai</a> so
              we can take appropriate action.
            </p>
          </section>

          {/* 3. Service Description */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Service Description</h2>
            <p className="text-foreground leading-relaxed">
              ZeitFlow is an AI workflow automation platform that allows you to create, configure, and execute
              automated workflows. The Service processes your requests through third-party AI model providers
              (via OpenRouter, which routes to downstream providers such as Google, Anthropic, Meta, and others)
              and returns the results to you. The Service also integrates with third-party services including
              but not limited to email providers, SMS providers, messaging platforms, and calendar services.
            </p>
          </section>

          {/* 4. Intellectual Property & Content Ownership */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Intellectual Property &amp; Content Ownership</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Your Content</h3>
                <p className="text-foreground leading-relaxed">
                  You retain ownership of all content you submit to the Service, including prompts, workflow
                  configurations, uploaded files, and any other input data (&quot;Your Content&quot;). By using the
                  Service, you grant us a limited, non-exclusive license to process Your Content solely for
                  the purpose of providing and operating the Service.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">AI-Generated Output</h3>
                <p className="text-foreground leading-relaxed">
                  To the extent permitted by applicable law, you own the output generated by the Service based
                  on Your Content (&quot;Output&quot;). However, we make no guarantees regarding the uniqueness of any
                  Output, as similar prompts from different users may produce similar results. We do not claim
                  ownership of your Output.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Our Content</h3>
                <p className="text-foreground leading-relaxed">
                  The Service itself, including its design, code, branding, documentation, and any templates
                  or content created by ZeitFlow, remains our intellectual property or the property of our
                  licensors.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">No Training on Your Data</h3>
                <p className="text-foreground leading-relaxed">
                  We do not use Your Content or Output to train, fine-tune, or improve any AI models. Your
                  data is processed solely to fulfill your requests and is handled in accordance with our{' '}
                  <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
                </p>
              </div>
            </div>
          </section>

          {/* 5. Marketplace & Template Licensing */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Marketplace &amp; Template Licensing</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Platform Ownership</h3>
                <p className="text-foreground leading-relaxed">
                  We own the Platform and all underlying technology, including the code that powers workflows,
                  the user interface, the marketplace infrastructure, and the engine that connects to AI providers.
                  Nothing in these Terms transfers ownership of our proprietary software to you.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Official Templates</h3>
                <p className="text-foreground leading-relaxed">
                  Pre-built workflow templates provided by ZeitFlow (&quot;Official Templates&quot;) are our intellectual
                  property. You are granted a license to use Official Templates within the Service for your own
                  purposes. You may not package, redistribute, resell, or claim ownership of Official Templates
                  or any derivative works based on their structure.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Creator-Uploaded Templates</h3>
                <p className="text-foreground leading-relaxed">
                  Users who upload templates to the Marketplace (&quot;Creators&quot;) retain ownership of the original
                  templates they create, including the specific sequence of prompts, variables, and logic.
                  By listing a template on the Marketplace, the Creator grants ZeitFlow a worldwide, non-exclusive,
                  royalty-free license to host, display, distribute, and promote that template on the Platform.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Buyer Usage Rights</h3>
                <p className="text-foreground leading-relaxed">
                  When a user purchases or uses a Marketplace template, they are granted a perpetual,
                  non-transferable license to execute that template for their own internal business purposes.
                  Buyers may not redistribute, resell, sublicense, or publicly share purchased templates.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Template Content Requirements</h3>
                <p className="text-foreground leading-relaxed mb-3">
                  All templates uploaded to the Marketplace must comply with the following requirements.
                  Creators represent and warrant that:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
                  <li>They are the original creator of the template or have obtained all necessary licenses and permissions to distribute it</li>
                  <li>The template does not contain or facilitate the generation of copyrighted material owned by third parties without proper licensing</li>
                  <li>The template does not contain, generate, or facilitate any illegal content, including but not limited to child sexual abuse material (CSAM), non-consensual intimate imagery, or content that exploits minors in any way</li>
                  <li>The template does not facilitate hate speech, harassment, fraud, phishing, or any activity prohibited by our Acceptable Use Policy</li>
                  <li>The template does not contain malware, malicious code, or mechanisms designed to harm users or their systems</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Content Moderation &amp; Removal</h3>
                <p className="text-foreground leading-relaxed">
                  We reserve the right to review, reject, remove, or disable any template from the Marketplace
                  at any time, for any reason, with or without notice. This includes templates that violate these
                  Terms, our Acceptable Use Policy, applicable laws, or that we determine in our sole discretion
                  to be harmful, misleading, or inappropriate. Repeat violations will result in permanent removal
                  of the Creator&apos;s Marketplace privileges and potential account termination.
                </p>
              </div>
            </div>
          </section>

          {/* 6. Acceptable Use Policy */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Acceptable Use Policy</h2>
            <p className="text-foreground leading-relaxed mb-4">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
              <li>Generate, distribute, or facilitate the creation of malware, viruses, or other harmful code</li>
              <li>Produce content that constitutes hate speech, harassment, threats, or incitement to violence</li>
              <li>Create deepfakes, non-consensual intimate imagery, or impersonate real individuals without authorization</li>
              <li>Generate content that sexually exploits or endangers minors in any way</li>
              <li>Engage in fraud, phishing, social engineering, or any form of deception</li>
              <li>Violate any applicable local, state, national, or international law or regulation</li>
              <li>Infringe upon the intellectual property rights of any third party</li>
              <li>Attempt to reverse-engineer, decompile, or extract the source code of the Service</li>
              <li>Circumvent rate limits, access controls, or other technical restrictions</li>
              <li>Use the Service to send unsolicited bulk communications (spam)</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Access or attempt to access other users&apos; accounts or data without authorization</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              We reserve the right to investigate and take appropriate action against anyone who, in our sole
              discretion, violates this Acceptable Use Policy, including removing content, suspending or
              terminating accounts, and reporting to law enforcement authorities.
            </p>
          </section>

          {/* 7. User Responsibilities */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. User Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
              <li>You are responsible for the content of your prompts, workflow configurations, and any data processed through the Service</li>
              <li>You must maintain the security of your account credentials and must not share them with others</li>
              <li>You are responsible for all activity that occurs under your account</li>
              <li>You must promptly notify us at <a href="mailto:support@zeitflow.ai" className="text-primary hover:underline">support@zeitflow.ai</a> if you suspect unauthorized use of your account</li>
              <li>If you connect third-party accounts (e.g., Google, Slack), you are responsible for ensuring you have the necessary permissions to authorize those connections</li>
            </ul>
          </section>

          {/* 8. AI Accuracy Disclaimer */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. AI Output Disclaimer</h2>
            <p className="text-foreground leading-relaxed mb-4">
              <strong>AI models can produce inaccurate, incomplete, or misleading output (&quot;hallucinations&quot;).</strong> The
              Service relies on third-party AI models that may generate factually incorrect information, produce
              biased results, or provide responses that appear authoritative but are wrong.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
              <li>You should independently verify any AI-generated output before relying on it for decisions,
                especially in areas involving health, legal, financial, or safety matters</li>
              <li>The Service is not a substitute for professional advice of any kind</li>
              <li>We are not responsible for any actions you take based on AI-generated output</li>
              <li>AI output quality may vary depending on the model selected and the specificity of your prompts</li>
            </ul>
          </section>

          {/* 9. Third-Party Services */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Third-Party Services</h2>
            <p className="text-foreground leading-relaxed mb-4">
              The Service integrates with and relies on third-party services. Your use of these integrations
              is also subject to the terms and policies of those third-party providers:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
              <li><strong>AI Processing:</strong> OpenRouter (which routes to model providers including Google, Anthropic, Meta, OpenAI, and others)</li>
              <li><strong>Email:</strong> Resend</li>
              <li><strong>SMS:</strong> Twilio</li>
              <li><strong>Messaging:</strong> Slack, Telegram</li>
              <li><strong>Calendar:</strong> Google Calendar</li>
              <li><strong>Payments:</strong> Stripe</li>
              <li><strong>Storage:</strong> Vercel Blob</li>
              <li><strong>Database:</strong> Neon (PostgreSQL)</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              If a third-party provider changes their terms, experiences downtime, or discontinues their
              service, it may affect the functionality of ZeitFlow. We are not liable for any disruption
              caused by third-party service changes.
            </p>
          </section>

          {/* 10. Service Availability & Rate Limits */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Service Availability &amp; Rate Limits</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Service Availability</h3>
                <p className="text-foreground leading-relaxed">
                  We strive to maintain high service availability but do not guarantee uninterrupted access.
                  The Service may be temporarily unavailable due to maintenance, updates, or technical issues.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Hard Limits</h3>
                <p className="text-foreground leading-relaxed">
                  We impose strict rate limits to ensure platform stability. The current standard limits are
                  20 requests per hour for queue operations and 100 requests per hour for workflow API calls.
                  Rate limits may vary by subscription plan. We reserve the right to modify these limits at
                  any time, with or without notice, based on infrastructure load or security requirements.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Abuse Detection</h3>
                <p className="text-foreground leading-relaxed">
                  Any attempt to circumvent rate limits — including but not limited to using multiple accounts,
                  automated scripting, API abuse, or &quot;botting&quot; the queue — is a material breach of these Terms.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Enforcement Actions</h3>
                <p className="text-foreground leading-relaxed mb-3">
                  If your usage is deemed excessive or abusive at our sole discretion, we reserve the right to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
                  <li>Temporarily suspend your IP address or account for a cooling-off period</li>
                  <li>Permanently terminate your access to the Service without a refund</li>
                  <li>Blacklist your payment method and email address from future registrations</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">No Liability for Enforcement</h3>
                <p className="text-foreground leading-relaxed">
                  We are not liable for any data loss, workflow interruption, or business damages resulting
                  from a suspension or ban triggered by rate limit violations or abuse detection.
                </p>
              </div>
            </div>
          </section>

          {/* 11. Subscription & Payments */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">11. Subscriptions &amp; Payments</h2>
            <p className="text-foreground leading-relaxed mb-4">
              Certain features of the Service require a paid subscription. Payments are processed through
              Stripe. By subscribing to a paid plan, you agree to pay the applicable fees and authorize
              recurring charges. You may cancel your subscription at any time through your account settings.
              Cancellation takes effect at the end of the current billing period.
            </p>
            <p className="text-foreground leading-relaxed">
              <strong>Immediate Access Acknowledgment:</strong> By subscribing and using the Service, you
              acknowledge that you are requesting immediate access to the digital service and that you
              understand this may affect your right to a cooling-off period in jurisdictions where such
              rights apply (see Section 12 for details).
            </p>
          </section>

          {/* 12. Refund & Cancellation Policy */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">12. Refund &amp; Cancellation Policy</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Digital Service &amp; Consumption</h3>
                <p className="text-foreground leading-relaxed">
                  You acknowledge that the Service processes data through third-party AI APIs in real-time.
                  Once a workflow or chain has been executed, the associated costs incurred from third-party
                  providers (OpenRouter and downstream AI models) are non-recoverable. Due to the immediate
                  nature of digital service delivery, <strong>all sales are final once services have been
                  consumed</strong> (i.e., workflows executed, chains processed, or API calls made).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Subscription Cancellations</h3>
                <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
                  <li>You may cancel your subscription at any time through your account settings</li>
                  <li>Cancellation takes effect at the end of the current billing period - you retain access until then</li>
                  <li>No prorated refunds are provided for partial billing periods</li>
                  <li>If you cancel and re-subscribe, you will be charged at the current rate</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">When Refunds May Be Issued</h3>
                <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
                  <li><strong>Platform Technical Error:</strong> If a workflow fails due to a documented technical
                    error on our platform (not a third-party API timeout or rate limit), we will credit your
                    account for the failed execution. Cash refunds are generally not issued for platform downtime.</li>
                  <li><strong>Duplicate Charges:</strong> If you are charged more than once for the same billing
                    period due to a billing error, we will refund the duplicate charge.</li>
                  <li><strong>Unauthorized Charges:</strong> If your account was compromised and unauthorized
                    charges were made, contact us immediately at{' '}
                    <a href="mailto:support@zeitflow.ai" className="text-primary hover:underline">support@zeitflow.ai</a>.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">When Refunds Are Not Provided</h3>
                <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
                  <li>Dissatisfaction with AI output quality (output quality varies by model and prompt)</li>
                  <li>Failure to use the Service during a billing period</li>
                  <li>Third-party service outages (e.g., OpenRouter, Twilio, or Resend downtime)</li>
                  <li>Account suspension or termination due to Terms of Service violations</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Marketplace Template Refunds</h3>
                <p className="text-foreground leading-relaxed mb-3">
                  Marketplace templates are digital goods. The following refund policy applies:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
                  <li><strong>Subjective dissatisfaction</strong> (&quot;I didn&apos;t like the template&quot;): No refund. Review the template description and preview before acquiring.</li>
                  <li><strong>Broken or non-functional template:</strong> If a template is fundamentally flawed and
                    does not execute as described, you may receive a credit or partial refund. Contact{' '}
                    <a href="mailto:support@zeitflow.ai" className="text-primary hover:underline">support@zeitflow.ai</a> with details.</li>
                  <li><strong>Accidental purchase:</strong> Refund may be issued within 24 hours only if the template
                    has not been executed or downloaded.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">EU/UK Cooling-Off Period</h3>
                <p className="text-foreground leading-relaxed">
                  Under the EU Consumer Rights Directive and UK Consumer Rights Act, digital services may be
                  subject to a 14-day cooling-off period. However, by creating an account and using the Service,
                  you acknowledge and agree that: (a) you are requesting immediate access to the Service, and
                  (b) you understand that once you execute your first workflow or chain, you waive your right
                  to the 14-day cooling-off period for that billing period, as the digital service has been
                  substantially performed.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Account Credits</h3>
                <p className="text-foreground leading-relaxed">
                  In lieu of cash refunds, we may offer account credits at our discretion. Account credits
                  can be applied to future subscription periods or Marketplace purchases. Credits have no
                  cash value and are non-transferable.
                </p>
              </div>
            </div>
          </section>

          {/* 13. Chargebacks */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">13. Chargebacks &amp; Payment Disputes</h2>
            <p className="text-foreground leading-relaxed mb-4">
              We have a <strong>zero-tolerance policy for fraudulent chargebacks</strong>. If you have a billing
              concern, you must contact us at{' '}
              <a href="mailto:support@zeitflow.ai" className="text-primary hover:underline">support@zeitflow.ai</a>{' '}
              before initiating a dispute with your bank or payment provider.
            </p>
            <p className="text-foreground leading-relaxed mb-4">
              If you dispute a legitimate charge with your bank or payment provider without first attempting
              to resolve the issue with us:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
              <li>Your account and all associated data will be immediately suspended pending investigation</li>
              <li>If the chargeback is determined to be fraudulent, your account will be permanently terminated</li>
              <li>You will be responsible for any chargeback fees and associated costs we incur</li>
              <li>We reserve the right to pursue recovery of the disputed amount through appropriate legal channels</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              We maintain detailed records of account activity, service usage, and consent to these Terms,
              which we will provide to payment processors during any dispute resolution process.
            </p>
          </section>

          {/* 14. Intermediary Liability & DMCA */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">14. Intermediary Liability &amp; Copyright (DMCA)</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Intermediary Status</h3>
                <p className="text-foreground leading-relaxed">
                  As a provider of an intermediary platform service, ZeitFlow is not responsible for the content
                  of templates, prompts, or outputs generated by users. Users represent and warrant that they
                  own or have obtained all necessary licenses and permissions for all material they upload,
                  create, or distribute through the Service. While we do not monitor all user-generated content,
                  we will respond promptly to valid notices of alleged infringement.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">DMCA Takedown Notices</h3>
                <p className="text-foreground leading-relaxed mb-3">
                  If you believe that content on the Service infringes your copyright, you may submit a
                  DMCA takedown notice using our{' '}
                  <a href="/report" className="text-primary hover:underline">Report Content form</a> or
                  by emailing our designated agent at{' '}
                  <a href="mailto:legal@zeitflow.ai" className="text-primary hover:underline">legal@zeitflow.ai</a>.
                  Your notice must include:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
                  <li>Identification of the copyrighted work you believe has been infringed</li>
                  <li>Identification of the material on the Service that you believe is infringing, with enough detail for us to locate it</li>
                  <li>Your contact information (name, address, email, phone number)</li>
                  <li>A statement that you have a good-faith belief that the use is not authorized by the copyright owner, its agent, or the law</li>
                  <li>A statement, under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on their behalf</li>
                  <li>Your physical or electronic signature</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Content Removal &amp; Review Process</h3>
                <p className="text-foreground leading-relaxed">
                  We reserve the right to remove any content immediately upon receiving a valid takedown
                  notice or upon our own determination that content violates these Terms, our Acceptable
                  Use Policy, or applicable law. For Marketplace templates, we may implement a review process
                  before templates are published to help prevent malicious content, malware, or material that
                  could compromise user data or systems.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Repeat Infringer Policy</h3>
                <p className="text-foreground leading-relaxed">
                  We maintain a policy to terminate the accounts of repeat infringers. Users who receive
                  multiple valid copyright complaints, or who repeatedly violate our content policies, will
                  have their accounts permanently terminated and will be banned from creating new accounts.
                  We track infringement notices and policy violations per account, and termination may occur
                  without prior warning for severe violations.
                </p>
              </div>
            </div>
          </section>

          {/* 15. Termination */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">15. Termination</h2>
            <p className="text-foreground leading-relaxed mb-4">
              We reserve the right to suspend or terminate your account and access to the Service at our
              sole discretion, with or without notice, for any reason, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
              <li>Violation of these Terms or the Acceptable Use Policy</li>
              <li>Conduct that we determine is harmful to other users, third parties, or the Service</li>
              <li>Extended periods of inactivity</li>
              <li>Requests by law enforcement or government agencies</li>
              <li>Non-payment of subscription fees</li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              You may terminate your account at any time through the account settings page. Upon termination,
              your right to use the Service ceases immediately. We will delete your account data in accordance
              with our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
            </p>
          </section>

          {/* 16. Indemnification */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">16. Indemnification</h2>
            <p className="text-foreground leading-relaxed">
              You agree to indemnify, defend, and hold harmless ZeitFlow and its officers, directors,
              employees, and agents from and against any claims, liabilities, damages, losses, and expenses
              (including reasonable legal fees) arising out of or in any way connected with: (a) your access
              to or use of the Service; (b) Your Content or any Output generated from Your Content; (c) your
              violation of these Terms; or (d) your violation of any third-party rights, including intellectual
              property, privacy, or publicity rights.
            </p>
          </section>

          {/* 17. Limitation of Liability */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">17. Limitation of Liability</h2>
            <p className="text-foreground leading-relaxed mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS PROVIDED &quot;AS IS&quot; AND
              &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING
              BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
              AND NON-INFRINGEMENT.
            </p>
            <p className="text-foreground leading-relaxed mb-4">
              IN NO EVENT SHALL ZEITFLOW BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
              OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR IN
              CONNECTION WITH YOUR USE OF THE SERVICE, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING
              NEGLIGENCE), OR ANY OTHER LEGAL THEORY, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF
              SUCH DAMAGES.
            </p>
            <p className="text-foreground leading-relaxed">
              OUR TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR
              THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE TWELVE (12)
              MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS ($100).
            </p>
          </section>

          {/* 18. Dispute Resolution */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">18. Dispute Resolution</h2>
            <p className="text-foreground leading-relaxed mb-4">
              <strong>Informal Resolution:</strong> Before filing any formal dispute, you agree to first
              contact us at <a href="mailto:support@zeitflow.ai" className="text-primary hover:underline">support@zeitflow.ai</a> and
              attempt to resolve the dispute informally for at least 30 days.
            </p>
            <p className="text-foreground leading-relaxed mb-4">
              <strong>Binding Arbitration:</strong> If the dispute is not resolved informally, you and
              ZeitFlow agree to resolve any remaining dispute through binding arbitration administered by
              the American Arbitration Association (AAA) under its Commercial Arbitration Rules. The
              arbitration shall be conducted in English. Judgment on the arbitration award may be entered
              in any court of competent jurisdiction.
            </p>
            <p className="text-foreground leading-relaxed mb-4">
              <strong>Class Action Waiver:</strong> You agree that any dispute resolution proceedings will
              be conducted only on an individual basis and not as a class, consolidated, or representative
              action.
            </p>
            <p className="text-foreground leading-relaxed">
              <strong>Governing Law:</strong> These Terms shall be governed by and construed in accordance
              with the laws of the State of Delaware, United States, without regard to its conflict of law
              provisions.
            </p>
          </section>

          {/* 19. Data Protection Commitment */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">19. Data Protection</h2>
            <p className="text-foreground leading-relaxed mb-4">
              We are committed to protecting your data. Key points:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
              <li><strong>We do not sell your personal information.</strong> Your data is never sold to advertisers, data brokers, or any third parties.</li>
              <li><strong>We do not use your data for advertising.</strong> Your prompts, workflows, and personal information are not used for ad targeting.</li>
              <li><strong>We do not train AI models on your data.</strong> Your Content and Output are not used to train, fine-tune, or improve any AI models.</li>
              <li>For full details on how we collect, use, and protect your data, please review our{' '}
                <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
              </li>
            </ul>
          </section>

          {/* 20. Contact */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">20. Contact Information</h2>
            <p className="text-foreground leading-relaxed mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <ul className="list-none space-y-2 text-foreground leading-relaxed">
              <li><strong>General Support:</strong>{' '}
                <a href="mailto:support@zeitflow.ai" className="text-primary hover:underline">support@zeitflow.ai</a>
              </li>
              <li><strong>Privacy Inquiries:</strong>{' '}
                <a href="mailto:privacy@zeitflow.ai" className="text-primary hover:underline">privacy@zeitflow.ai</a>
              </li>
              <li><strong>Legal Inquiries:</strong>{' '}
                <a href="mailto:legal@zeitflow.ai" className="text-primary hover:underline">legal@zeitflow.ai</a>
              </li>
            </ul>
            <p className="text-foreground leading-relaxed mt-4">
              You can also reach us through our{' '}
              <a href="/contact" className="text-primary hover:underline">Contact page</a>.
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
