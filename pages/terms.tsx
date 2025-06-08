import { Footer } from "@/components/Footer";
import Navigation from "@/components/Navigation"

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#d4d4d8]">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-16 mt-10">
        <h1 className="text-4xl font-bold mb-12 text-[#a3e635]">Terms of Service</h1>
        
        <div className="space-y-8">
          <section className="bg-[#18181b] border border-[#27272a] rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-[#fafafa]">Acceptance of Terms</h2>
            <p className="text-[#d4d4d8] leading-relaxed">
              By accessing and using this AI chain processing service, you accept and agree to be 
              bound by the terms and provision of this agreement.
            </p>
          </section>

          <section className="bg-[#18181b] border border-[#27272a] rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-[#fafafa]">Service Description</h2>
            <p className="text-[#d4d4d8] leading-relaxed">
              Our service allows you to create and execute chains of AI prompts. We process your 
              requests through third-party AI providers and return the results to you.
            </p>
          </section>

          <section className="bg-[#18181b] border border-[#27272a] rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-[#fafafa]">User Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2 text-[#d4d4d8] leading-relaxed">
              <li>You must not use the service for illegal or unauthorized purposes</li>
              <li>You are responsible for the content of your prompts and chains</li>
              <li>You must not attempt to circumvent rate limits or abuse the service</li>
              <li>You must not share your account credentials with others</li>
            </ul>
          </section>

          <section className="bg-[#18181b] border border-[#27272a] rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-[#fafafa]">Service Availability</h2>
            <p className="text-[#d4d4d8] leading-relaxed">
              We strive to maintain high service availability but do not guarantee uninterrupted 
              access. The service may be temporarily unavailable due to maintenance, updates, 
              or technical issues.
            </p>
          </section>

          <section className="bg-[#18181b] border border-[#27272a] rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-[#fafafa]">Rate Limits</h2>
            <p className="text-[#d4d4d8] leading-relaxed">
              We implement rate limits to ensure fair usage. Current limits include 20 requests 
              per hour for queue operations. Excessive usage may result in temporary restrictions.
            </p>
          </section>

          <section className="bg-[#18181b] border border-[#27272a] rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-[#fafafa]">Limitation of Liability</h2>
            <p className="text-[#d4d4d8] leading-relaxed">
              We provide the service &quot;as is&quot; without warranties. We are not liable for any damages 
              arising from your use of the service, including but not limited to data loss or 
              service interruptions.
            </p>
          </section>

          <section className="bg-[#18181b] border border-[#27272a] rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-[#fafafa]">Modifications</h2>
            <p className="text-[#d4d4d8] leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of the service 
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="text-center pt-8">
            <p className="text-sm text-[#71717a]">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
