import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { GoogleAnalytics } from '@next/third-parties/google'
import { VemetricScript } from '@vemetric/react';
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
  title: "ZeitFlow - AI Workflow Automation",
  description: "Rethinking the way you work with AI using a unique, powerful system for managing and executing AI prompt chains",
  keywords: ["AI", "prompt chains", "automation", "GPT-4", "productivity", "workflow"],
  authors: [{ name: "ZeitFlow" }],
  creator: "ZeitFlow",
  publisher: "ZeitFlow",
  robots: "index, follow",
  openGraph: {
    title: "ZeitFlow - AI Chain Processing Platform",
    description: "Rethinking the way you work with AI using a unique, powerful system for managing and executing AI prompt chains",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZeitFlow - AI Chain Processing Platform",
    description: "Rethinking the way you work with AI using a unique, powerful system for managing and executing AI prompt chains",
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
    <html lang="en">
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
    </html>
  );
}
