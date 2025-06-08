import { Footer } from "@/components/Footer";
import Navigation from "@/components/Navigation"

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#d4d4d8]">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-16 mt-10">
        <h1 className="text-4xl font-bold mb-12 text-[#a3e635]">Privacy Policy</h1>
        
        <div className="space-y-8">
          <section className="bg-[#18181b] border border-[#27272a] rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-[#fafafa]">Information We Collect</h2>
            <p className="text-[#d4d4d8] leading-relaxed">
              We collect information you provide directly to us, such as when you create an account, 
              use our AI chain processing services, or contact us for support.
            </p>
          </section>

          <section className="bg-[#18181b] border border-[#27272a] rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-[#fafafa]">How We Use Your Information</h2>
            <p className="text-[#d4d4d8] leading-relaxed">
              We use the information we collect to provide, maintain, and improve our services, 
              process your AI chain requests, and communicate with you about your account.
            </p>
          </section>

          <section className="bg-[#18181b] border border-[#27272a] rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-[#fafafa]">Data Processing</h2>
            <p className="text-[#d4d4d8] leading-relaxed">
              Your AI prompts and chain data are processed through third-party AI services (OpenRouter) 
              to generate responses. We do not store or share your prompt content beyond what is 
              necessary for service operation.
            </p>
          </section>

          <section className="bg-[#18181b] border border-[#27272a] rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-[#fafafa]">Data Security</h2>
            <p className="text-[#d4d4d8] leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal 
              information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="bg-[#18181b] border border-[#27272a] rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-[#fafafa]">Contact Us</h2>
            <p className="text-[#d4d4d8] leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us through our 
              support channels.
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
