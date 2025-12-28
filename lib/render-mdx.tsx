import { MDXRemote } from 'next-mdx-remote/rsc';
import { serialize } from 'next-mdx-remote/serialize';
import { mdxComponents } from './mdx-components';

interface RenderMDXProps {
  content: string;
  className?: string;
}

// Server-side MDX renderer
export async function renderMDX(content: string) {
  try {
    const mdxSource = await serialize(content, {
      mdxOptions: {
        remarkPlugins: [], // Add remark plugins here if needed
        rehypePlugins: [], // Add rehype plugins here if needed
        format: 'mdx',
      },
      parseFrontmatter: false, // Since we handle frontmatter separately
    });

    return (
      <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-text-muted prose-strong:text-foreground prose-code:text-foreground prose-blockquote:text-text-muted prose-blockquote:border-primary prose-a:text-primary prose-a:hover:text-accent">
        <MDXRemote 
          source={mdxSource} 
          components={mdxComponents} 
        />
      </div>
    );
  } catch (error) {
    console.error('MDX rendering error:', error);
    // Fallback to basic HTML rendering if MDX fails
    return (
      <div 
        className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-text-muted prose-strong:text-foreground prose-code:text-foreground prose-blockquote:text-text-muted prose-blockquote:border-primary prose-a:text-primary prose-a:hover:text-accent"
        dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }}
      />
    );
  }
}

// Wrapper component for easier usage in React components
export function MDXRenderer({ content, className = '' }: RenderMDXProps) {
  return (
    <div className={className}>
      {renderMDX(content)}
    </div>
  );
}

// Export for server-side usage
export { mdxComponents };