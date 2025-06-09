import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { GoogleAnalytics } from '@next/third-parties/google'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "jjoist - AI Chain Processing Platform",
  description: "Rethinking the way you work with AI using a unique, powerful system for managing and executing AI prompt chains",
  keywords: ["AI", "prompt chains", "automation", "GPT-4", "productivity", "workflow"],
  authors: [{ name: "jjoist" }],
  creator: "jjoist",
  publisher: "jjoist",
  robots: "index, follow",
  openGraph: {
    title: "jjoist - AI Chain Processing Platform",
    description: "Rethinking the way you work with AI using a unique, powerful system for managing and executing AI prompt chains",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "jjoist - AI Chain Processing Platform",
    description: "Rethinking the way you work with AI using a unique, powerful system for managing and executing AI prompt chains",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </body>

      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID!} />
    </html>
  );
}
