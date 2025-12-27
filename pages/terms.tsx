"use client";
import { Footer } from "@/components/Footer";
import Navigation from "@/components/Navigation"
import Head from "next/head"

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Head>
        <title>Terms of Service - ZeitFlow | AI Prompt Chain Management</title>
        <meta name="description" content="Read ZeitFlow's terms of service to understand the rules and guidelines for using our AI prompt chain and workflow automation platform." />
        <meta name="keywords" content="terms of service, terms, legal, ZeitFlow, AI prompt chains, workflow management, user agreement, service terms" />
        <meta property="og:title" content="Terms of Service - ZeitFlow" />
        <meta property="og:description" content="Read the terms and conditions for using ZeitFlow's AI prompt chain platform." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.ai'}/terms`} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.ai'}/logo-on-black.png`} />
        <meta property="og:site_name" content="ZeitFlow" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Terms of Service - ZeitFlow" />
        <meta name="twitter:description" content="Read the terms and conditions for using ZeitFlow's AI prompt chain platform." />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.ai'}/logo-on-black.png`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.ai'}/terms`} />
      </Head>
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 py-16 mt-10">
        <h1 className="text-4xl font-bold mb-12 text-primary">Terms of Service</h1>
        
        <div className="space-y-8">
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Acceptance of Terms</h2>
            <p className="text-foreground leading-relaxed">
              By accessing and using this AI chain processing service, you accept and agree to be 
              bound by the terms and provision of this agreement.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Service Description</h2>
            <p className="text-foreground leading-relaxed">
              Our service allows you to create and execute chains of AI prompts. We process your 
              requests through third-party AI providers and return the results to you.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">User Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground leading-relaxed">
              <li>You must not use the service for illegal or unauthorized purposes</li>
              <li>You are responsible for the content of your prompts and chains</li>
              <li>You must not attempt to circumvent rate limits or abuse the service</li>
              <li>You must not share your account credentials with others</li>
            </ul>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Service Availability</h2>
            <p className="text-foreground leading-relaxed">
              We strive to maintain high service availability but do not guarantee uninterrupted 
              access. The service may be temporarily unavailable due to maintenance, updates, 
              or technical issues.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Rate Limits</h2>
            <p className="text-foreground leading-relaxed">
              We implement rate limits to ensure fair usage. Current limits include 20 requests 
              per hour for queue operations. Excessive usage may result in temporary restrictions.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Limitation of Liability</h2>
            <p className="text-foreground leading-relaxed">
              We provide the service &quot;as is&quot; without warranties. We are not liable for any damages 
              arising from your use of the service, including but not limited to data loss or 
              service interruptions.
            </p>
          </section>

          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Modifications</h2>
            <p className="text-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of the service 
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="text-center pt-8">
            <p className="text-sm text-text-muted">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
