import { marked } from 'marked';
import Image from 'next/image';
import { calculateReadingTime } from '@/lib/reading-time';

interface BlogPostProps {
  post: {
    id: number;
    slug: string;
    title: string;
    excerpt?: string;
    content: string;
    featuredImage?: string;
    tags?: string;
    publishedAt?: string;
    author: {
      name?: string;
      email?: string;
      isAdmin?: boolean;
    };
  };
}

export const BlogPost = ({ post }: BlogPostProps) => {
  const tags = post.tags ? JSON.parse(post.tags) : [];
  const readingTime = calculateReadingTime(post.content);
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatContent = (content: string) => {
    return marked(content);
  };

  return (
    <article className="max-w-4xl mx-auto">
      <header className="mb-8 animate-slide-up-fade">
        {post.featuredImage && (
          <div className="mb-8 rounded-lg overflow-hidden relative w-full aspect-[1938/1016]">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
            />
          </div>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {post.publishedAt && (
              <time className="text-sm text-text-muted" dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
            )}
            <span className="text-sm text-text-muted">{readingTime}</span>
          </div>
          {post.author.name && (
            <span className="text-sm text-text-muted">By {post.author.isAdmin ? 'ZeitFlow' : post.author.name}</span>
          )}
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
          {post.title}
        </h1>
      </header>
      
      <div 
        className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-text-muted prose-strong:text-foreground prose-code:text-foreground prose-blockquote:text-text-muted prose-blockquote:border-primary prose-a:text-primary prose-a:hover:text-accent animate-slide-up-fade delay-100"
        dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
      />
      
      <footer className="mt-12 pt-8 border-t border-border animate-slide-up-fade delay-200">
        <div className="text-center">
          <p className="text-sm text-text-muted">
            Published on {formatDate(post.publishedAt)}
          </p>
        </div>
      </footer>
    </article>
  );
};
