'use client';

import { useState, useEffect } from 'react';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';
import remarkGfm from 'remark-gfm';
import { mdxComponents } from '@/lib/mdx-components';

interface MDXClientRendererProps {
  content: string;
  className?: string;
}

export function MDXClientRenderer({ content, className = '' }: MDXClientRendererProps) {
  const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processContent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const source = await serialize(content, {
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [],
            format: 'mdx',
          },
          parseFrontmatter: false,
        });
        
        setMdxSource(source);
      } catch (err) {
        console.error('MDX serialization error:', err);
        setError('Failed to render content');
      } finally {
        setIsLoading(false);
      }
    };

    processContent();
  }, [content]);

  // Show fallback while loading
  if (isLoading || !mdxSource) {
    return (
      <div className={`prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-text-muted prose-strong:text-foreground prose-code:text-foreground prose-blockquote:text-text-muted prose-blockquote:border-primary prose-a:text-primary prose-a:hover:text-accent ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-surface rounded mb-4 w-3/4"></div>
          <div className="h-4 bg-surface rounded mb-2 w-full"></div>
          <div className="h-4 bg-surface rounded mb-2 w-full"></div>
          <div className="h-4 bg-surface rounded mb-2 w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-text-muted prose-strong:text-foreground prose-code:text-foreground prose-blockquote:text-text-muted prose-blockquote:border-primary prose-a:text-primary prose-a:hover:text-accent ${className}`}>
        <div className="text-red-500 p-4 border border-red-200 rounded">
          Error rendering content: {error}
        </div>
      </div>
    );
  }

  try {
    return (
      <div className={`prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-text-muted prose-strong:text-foreground prose-code:text-foreground prose-blockquote:text-text-muted prose-blockquote:border-primary prose-a:text-primary prose-a:hover:text-accent prose-img:rounded-lg prose-img:my-4 ${className}`}>
        <MDXRemote 
          {...mdxSource} 
          components={mdxComponents} 
        />
      </div>
    );
  } catch (err) {
    console.error('MDX rendering error:', err);
    return (
      <div className={`prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-text-muted prose-strong:text-foreground prose-code:text-foreground prose-blockquote:text-text-muted prose-blockquote:border-primary prose-a:text-primary prose-a:hover:text-accent ${className}`}>
        <div className="text-red-500 p-4 border border-red-200 rounded">
          Failed to render MDX content
        </div>
      </div>
    );
  }
}