import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found | ZeitFlow",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold text-foreground">Page not found</h1>
      <p className="mt-3 text-text-muted">That page does not exist.</p>
      <Link href="/" className="mt-6 text-primary hover:underline">
        Back to ZeitFlow
      </Link>
    </main>
  );
}
