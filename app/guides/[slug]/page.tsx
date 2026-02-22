import Navigation from "@/components/Navigation";
import { Button } from "@/components/Button";
import { MDXClientRenderer } from "@/components/blog/MDXClientRenderer";
import { calculateReadingTime } from "@/lib/reading-time";
import { getGuide, getAllGuides } from "@/lib/guides";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllGuides().map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) {
    return {
      title: "Guide Not Found | ZeitFlow",
      description: "The guide you are looking for does not exist.",
    };
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.zeitflow.io";
  const canonicalUrl = `${baseUrl}/guides/${guide.slug}`;

  return {
    title: `${guide.title} | ZeitFlow Guides`,
    description: guide.excerpt,
    keywords: guide.tags.join(", "),
    openGraph: {
      title: guide.title,
      description: guide.excerpt,
      type: "article",
      url: canonicalUrl,
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
      tags: guide.tags,
      siteName: "ZeitFlow",
    },
    twitter: {
      card: "summary",
      title: guide.title,
      description: guide.excerpt,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) {
    notFound();
  }

  const readingTime = calculateReadingTime(guide.content);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00Z");
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  };

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.zeitflow.io";
  const canonicalUrl = `${baseUrl}/guides/${guide.slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: guide.title,
    description: guide.excerpt,
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    author: {
      "@type": "Organization",
      name: "ZeitFlow",
      url: "https://www.zeitflow.io",
    },
    publisher: {
      "@type": "Organization",
      name: "ZeitFlow",
      url: "https://www.zeitflow.io",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    keywords: guide.tags.join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-background text-foreground relative">
        <Navigation />

        <div className="max-w-4xl mx-auto px-4 py-16 mt-10 relative z-10">
          <div className="mb-8">
            <Button
              href="/guides"
              variant="tertiary"
              className="!bg-transparent !p-0 text-text-muted hover:text-primary transition-colors duration-200 mb-8"
            >
              ← Back to Guides
            </Button>
          </div>

          <article className="max-w-4xl mx-auto">
            <header className="mb-8 animate-slide-up-fade">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {guide.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 mb-4">
                <time
                  className="text-sm text-text-muted"
                  dateTime={guide.publishedAt}
                >
                  {formatDate(guide.publishedAt)}
                </time>
                <span className="text-sm text-text-muted">{readingTime}</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                {guide.title}
              </h1>

              <p className="text-lg text-text-muted leading-relaxed">
                {guide.excerpt}
              </p>
            </header>

            <main role="main" className="animate-slide-up-fade delay-100">
              <MDXClientRenderer content={guide.content} />
            </main>

            <footer
              role="contentinfo"
              className="mt-12 pt-8 border-t border-border animate-slide-up-fade delay-200"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-muted">
                  Last updated {formatDate(guide.updatedAt)}
                </p>
                <Button
                  href="/guides"
                  variant="tertiary"
                  className="!bg-transparent !p-0 text-primary hover:text-accent transition-colors duration-200"
                >
                  ← All Guides
                </Button>
              </div>
            </footer>
          </article>
        </div>
      </div>
    </>
  );
}
