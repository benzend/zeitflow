import Link from 'next/link';
import { Button } from '../Button';

interface BlogPostCardProps {
  post: {
    id: number;
    slug: string;
    title: string;
    excerpt?: string;
    featuredImage?: string;
    tags?: string;
    publishedAt?: string;
    author: {
      name?: string;
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
        <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-primary/20 to-accent/20">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-48 object-cover"
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          {post.publishedAt && (
            <time className="text-sm text-text-muted" dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>
          )}
          {post.author.name && (
            <span className="text-sm text-text-muted">By {post.author.name}</span>
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
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag: string) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors duration-200"
              >
                {tag}
              </span>
            ))}
          </div>
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