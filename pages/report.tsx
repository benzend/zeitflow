"use client";
import { Footer } from "@/components/Footer";
import Navigation from "@/components/Navigation"
import Head from "next/head"
import { useState } from "react";
import { Button } from "@/components/Button";

type ReportType = "copyright" | "illegal" | "tos" | "";

export default function Report() {
  const [reportType, setReportType] = useState<ReportType>("");
  const [formData, setFormData] = useState({
    fullName: "",
    organization: "",
    email: "",
    phone: "",
    address: "",
    infringingUrl: "",
    description: "",
    originalWorkUrl: "",
    goodFaith: false,
    accuracyStatement: false,
    ownerStatement: false,
    onlineSafetyAct: false,
    signature: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
    setFormData(prev => ({ ...prev, [target.name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build mailto body
    const subject = encodeURIComponent(
      `[${reportType === "copyright" ? "DMCA" : reportType === "illegal" ? "Illegal Content" : "ToS Violation"}] Report from ${formData.fullName}`
    );
    const body = encodeURIComponent(
      `Report Type: ${reportType === "copyright" ? "Copyright Infringement (DMCA)" : reportType === "illegal" ? "Illegal Content" : "Terms of Service Violation"}\n\n` +
      `--- Contact Information ---\n` +
      `Full Legal Name: ${formData.fullName}\n` +
      `Organization: ${formData.organization || "N/A"}\n` +
      `Email: ${formData.email}\n` +
      `Phone: ${formData.phone || "N/A"}\n` +
      `Address: ${formData.address}\n\n` +
      `--- Material Identification ---\n` +
      `URL of infringing material: ${formData.infringingUrl}\n` +
      `Description: ${formData.description}\n` +
      `Original work URL: ${formData.originalWorkUrl || "N/A"}\n\n` +
      `--- Declarations ---\n` +
      `Good faith belief: ${formData.goodFaith ? "Yes" : "No"}\n` +
      `Accuracy statement: ${formData.accuracyStatement ? "Yes" : "No"}\n` +
      `Owner/authorized: ${formData.ownerStatement ? "Yes" : "No"}\n` +
      `${reportType === "illegal" ? `Online Safety Act acknowledgment: ${formData.onlineSafetyAct ? "Yes" : "No"}\n` : ""}` +
      `\n--- Electronic Signature ---\n` +
      `Signed: ${formData.signature}\n` +
      `Date: ${formData.date}`
    );

    window.location.href = `mailto:legal@zeitflow.ai?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  const isFormValid = reportType &&
    formData.fullName &&
    formData.email &&
    formData.address &&
    formData.infringingUrl &&
    formData.description &&
    formData.goodFaith &&
    formData.accuracyStatement &&
    formData.ownerStatement &&
    formData.signature &&
    (reportType !== "illegal" || formData.onlineSafetyAct);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Head>
        <title>Report Content - ZeitFlow | AI Workflow Automation Platform</title>
        <meta name="description" content="Report copyright infringement, illegal content, or Terms of Service violations on ZeitFlow." />
        <meta property="og:title" content="Report Content - ZeitFlow" />
        <meta property="og:description" content="Report copyright infringement, illegal content, or Terms of Service violations." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.ai'}/report`} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.ai'}/logo-on-black.png`} />
        <meta property="og:site_name" content="ZeitFlow" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_URL || 'https://zeitflow.ai'}/report`} />
      </Head>
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 py-16 mt-10">
        <h1 className="text-4xl font-bold mb-4 text-primary">Report Content</h1>
        <p className="text-text-muted mb-8 text-lg">
          Use this form to report copyright infringement, illegal content, or violations of our
          Terms of Service. You can also email reports directly to{" "}
          <a href="mailto:legal@zeitflow.ai" className="text-primary hover:underline">legal@zeitflow.ai</a>.
        </p>

        {submitted ? (
          <section className="bg-surface border border-border rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Report Submitted</h2>
            <p className="text-foreground leading-relaxed mb-4">
              Your email client should have opened with the report details. If it didn&apos;t,
              please copy the information and send it directly to{" "}
              <a href="mailto:legal@zeitflow.ai" className="text-primary hover:underline">legal@zeitflow.ai</a>.
            </p>
            <p className="text-foreground leading-relaxed mb-6">
              We will review your report and take appropriate action. You will receive a
              confirmation within 5 business days.
            </p>
            <Button
              onClick={() => { setSubmitted(false); setReportType(""); }}
              variant="primary"
            >
              Submit Another Report
            </Button>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Report Type */}
            <section className="bg-surface border border-border rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Type of Report</h2>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="reportType"
                    value="copyright"
                    checked={reportType === "copyright"}
                    onChange={() => setReportType("copyright")}
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <span className="text-foreground font-medium">Copyright Infringement (DMCA / UK CDPA)</span>
                    <p className="text-text-muted text-sm">Someone is using your copyrighted work without permission</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="reportType"
                    value="illegal"
                    checked={reportType === "illegal"}
                    onChange={() => setReportType("illegal")}
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <span className="text-foreground font-medium">Illegal Content (UK Online Safety Act)</span>
                    <p className="text-text-muted text-sm">Content that is illegal, harmful, or exploitative (e.g., deepfakes, CSAM, harmful material)</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="reportType"
                    value="tos"
                    checked={reportType === "tos"}
                    onChange={() => setReportType("tos")}
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <span className="text-foreground font-medium">Terms of Service Violation</span>
                    <p className="text-text-muted text-sm">Content that violates our Acceptable Use Policy or other terms</p>
                  </div>
                </label>
              </div>
            </section>

            {reportType && (
              <>
                {/* Step 2: Contact Information */}
                <section className="bg-surface border border-border rounded-lg p-6">
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Your Contact Information</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-1">
                        Full Legal Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="organization" className="block text-sm font-medium text-foreground mb-1">
                        Organization (if applicable)
                      </label>
                      <input
                        type="text"
                        id="organization"
                        name="organization"
                        value={formData.organization}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="address" className="block text-sm font-medium text-foreground mb-1">
                        Physical Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </section>

                {/* Step 3: Material Identification */}
                <section className="bg-surface border border-border rounded-lg p-6">
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Identification of the Material</h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="infringingUrl" className="block text-sm font-medium text-foreground mb-1">
                        URL of the infringing template/content on our site <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="infringingUrl"
                        name="infringingUrl"
                        required
                        placeholder="https://zeitflow.ai/templates/..."
                        value={formData.infringingUrl}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
                        Description of the {reportType === "copyright" ? "original work or infringement" : reportType === "illegal" ? "illegal nature of the content" : "violation"} <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        required
                        rows={4}
                        placeholder={
                          reportType === "copyright"
                            ? 'e.g., "The prompt in this template uses the full text of my copyrighted book [Title]"'
                            : reportType === "illegal"
                            ? 'e.g., "This template generates non-consensual deepfake imagery"'
                            : 'e.g., "This template is being used to send spam emails"'
                        }
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                      />
                    </div>
                    {reportType === "copyright" && (
                      <div>
                        <label htmlFor="originalWorkUrl" className="block text-sm font-medium text-foreground mb-1">
                          Link to the original work (if applicable)
                        </label>
                        <input
                          type="text"
                          id="originalWorkUrl"
                          name="originalWorkUrl"
                          placeholder="https://..."
                          value={formData.originalWorkUrl}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    )}
                  </div>
                </section>

                {/* Step 4: Required Statements */}
                <section className="bg-surface border border-border rounded-lg p-6">
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Required Declarations</h2>
                  <p className="text-text-muted text-sm mb-4">
                    By submitting this form, you declare under penalty of perjury that:
                  </p>
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="goodFaith"
                        checked={formData.goodFaith}
                        onChange={handleChange}
                        required
                        className="mt-1 accent-primary"
                      />
                      <span className="text-foreground text-sm">
                        I have a good faith belief that the use of the material in the manner complained
                        of is not authorized by the copyright owner, its agent, or the law. <span className="text-red-400">*</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="accuracyStatement"
                        checked={formData.accuracyStatement}
                        onChange={handleChange}
                        required
                        className="mt-1 accent-primary"
                      />
                      <span className="text-foreground text-sm">
                        The information in this notification is accurate. <span className="text-red-400">*</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="ownerStatement"
                        checked={formData.ownerStatement}
                        onChange={handleChange}
                        required
                        className="mt-1 accent-primary"
                      />
                      <span className="text-foreground text-sm">
                        I am the owner, or authorized to act on behalf of the owner, of an exclusive right
                        that is allegedly infringed. <span className="text-red-400">*</span>
                      </span>
                    </label>
                    {reportType === "illegal" && (
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="onlineSafetyAct"
                          checked={formData.onlineSafetyAct}
                          onChange={handleChange}
                          required
                          className="mt-1 accent-primary"
                        />
                        <span className="text-foreground text-sm">
                          I understand that under the UK Online Safety Act, I am reporting content that I
                          believe to be illegal or a priority harm. <span className="text-red-400">*</span>
                        </span>
                      </label>
                    )}
                  </div>
                </section>

                {/* Step 5: Electronic Signature */}
                <section className="bg-surface border border-border rounded-lg p-6">
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Electronic Signature</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="signature" className="block text-sm font-medium text-foreground mb-1">
                        Typed Full Name (as signature) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="signature"
                        name="signature"
                        required
                        value={formData.signature}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-foreground mb-1">
                        Date <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        required
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </section>

                {/* Submit */}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!isFormValid}
                    className="px-8"
                  >
                    Submit Report
                  </Button>
                </div>
              </>
            )}
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
