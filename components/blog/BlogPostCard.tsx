import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../Button';
import { calculateReadingTime } from '@/lib/reading-time';

interface BlogPostCardProps {
  post: {
    id: number;
    slug: string;
    title: string;
    excerpt?: string;
    content?: string;
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

export const BlogPostCard = ({ post }: BlogPostCardProps) => {
  const tags = post.tags ? JSON.parse(post.tags) : [];
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <article className="bg-surface border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 animate-slide-up-fade">
      {post.featuredImage && (
        <div className="bg-gradient-to-br from-primary/20 to-accent/20 relative w-full aspect-[1938/1016]">
          <Link href={`/blog/${post.slug}`}>
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </Link>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            {post.publishedAt && (
              <time className="text-sm text-text-muted" dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
            )}
            {post.content && (
              <span className="text-sm text-text-muted">{calculateReadingTime(post.content)}</span>
            )}
          </div>
          {post.author.name && (
            <span className="text-sm text-text-muted">By {post.author.isAdmin ? 'ZeitFlow' : post.author.name}</span>
          )}
        </div>
        
        <h2 className="text-xl font-semibold mb-3 text-foreground hover:text-primary transition-colors duration-200">
          <Link href={`/blog/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </h2>
        
        {post.excerpt && (
          <p className="text-text-muted mb-4 line-clamp-3 leading-relaxed">
            {post.excerpt}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <Button
            href={`/blog/${post.slug}`}
            variant="tertiary"
            className="!bg-transparent !p-0 text-primary hover:text-accent transition-colors duration-200"
          >
            Read more →
          </Button>
        </div>
      </div>
    </article>
  );
};
