import Image from 'next/image';
import { calculateReadingTime } from '@/lib/reading-time';
import { MDXClientRenderer } from './MDXClientRenderer';
import { enhanceMDXWithImageData } from '@/lib/mdx-enhancer';

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

// Content renderer with image optimization
async function BlogPostContent({ content }: { content: string }) {
  // Enhance content with image metadata on server
  const enhancedContent = await enhanceMDXWithImageData(content);
  
  // Use client renderer to avoid hydration issues
  return <MDXClientRenderer content={enhancedContent} />;
}

export const BlogPost = async ({ post }: BlogPostProps) => {
  const readingTime = calculateReadingTime(post.content);

  // Format dates consistently to avoid hydration mismatch
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Use consistent formatting that won't cause hydration issues
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
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
      
      <main role="main" className="animate-slide-up-fade delay-100">
        <BlogPostContent content={post.content} />
      </main>
      
      <footer role="contentinfo" className="mt-12 pt-8 border-t border-border animate-slide-up-fade delay-200">
        <div className="text-center">
          <p className="text-sm text-text-muted">
            Published on {formatDate(post.publishedAt)}
          </p>
        </div>
      </footer>
    </article>
  );
};
