import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { GoogleAnalytics } from '@next/third-parties/google'
import { VemetricScript } from '@vemetric/react';
import Script from 'next/script';
import { ThemeProvider } from "@/lib/theme-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZeitFlow - The Automation Platform Built for AI Agents",
  description: "Build lightning-fast, enterprise-grade workflows that AI agents discover and use through MCP. Agent-native automation infrastructure for the new era.",
  keywords: ["AI agents", "MCP", "Model Context Protocol", "agent-native automation", "enterprise workflows", "AI workflow platform"],
  authors: [{ name: "ZeitFlow" }],
  creator: "ZeitFlow",
  publisher: "ZeitFlow",
  robots: "index, follow",
  openGraph: {
    title: "ZeitFlow - The Automation Platform Built for AI Agents",
    description: "Lightning-fast, enterprise-grade automations that AI agents natively discover and use through MCP. The automation platform for the agent era.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZeitFlow - The Automation Platform Built for AI Agents",
    description: "Lightning-fast, enterprise-grade automations that AI agents natively discover and use through MCP. The automation platform for the agent era.",
  },
};

// Script to set initial theme to prevent flash
const themeScript = `
  (function() {
    try {
      const savedTheme = localStorage.getItem('theme');
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const theme = savedTheme || systemTheme;
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeScript,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <VemetricScript token={process.env.NEXT_PUBLIC_VEMETRIC_TOKEN!} />
        <ThemeProvider>
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </ThemeProvider>
      </body>

      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID!} />
      <Script
        src="//code.tidio.co/qfp6hlzegcbsjrwby6jjkdgmftsq71se.js"
        strategy="lazyOnload"
      />
    </html>
  );
}
