import Navigation from "@/components/Navigation";
import AnimatedBackground from "@/app/components/AnimatedBackground";
import { Button } from "@/components/Button";
import { getAllGuides } from "@/lib/guides";
import { calculateReadingTime } from "@/lib/reading-time";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Guides | ZeitFlow",
  description:
    "Step-by-step guides for integrating and automating with ZeitFlow",
  openGraph: {
    title: "Guides | ZeitFlow",
    description:
      "Step-by-step guides for integrating and automating with ZeitFlow",
    type: "website",
  },
};

export default function GuidesPage() {
  const guides = getAllGuides();

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <AnimatedBackground />
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 py-16 mt-10 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up-fade">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
            Guides
          </h1>
          <p className="text-xl text-text-muted max-w-2xl mx-auto">
            Step-by-step guides for integrating and automating with ZeitFlow
          </p>
        </div>

        {/* Guides Grid */}
        {guides.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {guides.map((guide, index) => (
              <article
                key={guide.slug}
                className="bg-surface border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 animate-slide-up-fade"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl" role="img" aria-hidden="true">
                      {guide.icon}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {guide.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <time
                      className="text-sm text-text-muted"
                      dateTime={guide.publishedAt}
                    >
                      {new Date(guide.publishedAt + "T00:00:00Z").toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        timeZone: "UTC",
                      })}
                    </time>
                    <span className="text-sm text-text-muted">
                      {calculateReadingTime(guide.content)}
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold mb-3 text-foreground hover:text-primary transition-colors duration-200">
                    <Link
                      href={`/guides/${guide.slug}`}
                      className="hover:underline"
                    >
                      {guide.title}
                    </Link>
                  </h2>

                  <p className="text-text-muted mb-4 line-clamp-3 leading-relaxed">
                    {guide.excerpt}
                  </p>

                  <Button
                    href={`/guides/${guide.slug}`}
                    variant="tertiary"
                    className="!bg-transparent !p-0 text-primary hover:text-accent transition-colors duration-200"
                  >
                    Read guide →
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 animate-slide-up-fade">
            <div className="max-w-md mx-auto">
              <div className="bg-surface border border-border rounded-lg p-8">
                <h2 className="text-2xl font-semibold mb-4 text-foreground">
                  No guides yet
                </h2>
                <p className="text-text-muted mb-6">
                  We&apos;re working on some great guides for you. Check back
                  soon!
                </p>
                <Button href="/" variant="primary">
                  Back to Home
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
