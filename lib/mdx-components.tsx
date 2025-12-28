import Image from 'next/image';
import type { ComponentProps } from 'react';

// Enhanced Image component that handles different image types
function OptimizedImage({ src, alt, width, height, ...props }: ComponentProps<typeof Image>) {
  // Handle attachment URLs by converting them or showing fallback
  if (typeof src === 'string' && src.startsWith('attachment:')) {
    // For attachment URLs, use Next.js Image with default dimensions
    return (
      <Image
        src={src.replace('attachment:', '')}
        alt={alt || ''}
        width={width || 800}
        height={height || 600}
        className="rounded-lg my-4"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
        {...props}
      />
    );
  }

  // For external URLs, use provided dimensions or defaults
  if (typeof src === 'string' && (src.startsWith('http') || src.startsWith('//'))) {
    return (
      <Image
        src={src}
        alt={alt || ''}
        width={width || 800}
        height={height || 600}
        className="rounded-lg my-4"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
        {...props}
      />
    );
  }

  // For local assets, use optimized Next.js Image
  return (
    <Image
      src={src}
      alt={alt || ''}
      width={width || 800}
      height={height || 600}
      className="rounded-lg my-4"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
      {...props}
    />
  );
}

// MDX component mapping
export const mdxComponents = {
  // Images with Next.js optimization
  img: OptimizedImage,
  
  // Headings with consistent styling
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
      {children}
    </h1>
  ),
  
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-2xl md:text-3xl font-semibold mb-3 text-foreground">
      {children}
    </h2>
  ),
  
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-xl md:text-2xl font-semibold mb-2 text-foreground">
      {children}
    </h3>
  ),
  
  // Paragraphs with proper spacing
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="mb-4 leading-relaxed text-foreground">
      {children}
    </p>
  ),
  
  // Links with proper styling
  a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
    <a 
      href={href}
      className="text-primary hover:text-accent underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  
  // Blockquotes
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="border-l-4 border-primary/30 pl-4 italic my-4 text-foreground">
      {children}
    </blockquote>
  ),
  
  // Code blocks
  pre: ({ children }: { children: React.ReactNode }) => (
    <pre className="bg-surface border border-border rounded-lg p-4 mb-4 overflow-x-auto text-sm">
      <code>{children}</code>
    </pre>
  ),
  
  // Inline code
  code: ({ children }: { children: React.ReactNode }) => (
    <code className="bg-surface border border-border rounded px-1 py-0.5 text-sm font-mono">
      {children}
    </code>
  ),
  
  // Lists
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="list-disc list-inside mb-4 space-y-1 text-foreground">
      {children}
    </ul>
  ),
  
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="list-decimal list-inside mb-4 space-y-1 text-foreground">
      {children}
    </ol>
  ),
  
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="ml-2">{children}</li>
  ),
  
  // Horizontal rules
  hr: () => (
    <hr className="border-border my-8" />
  ),
  
  // Strong/bold text
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  
  // Emphasis/italic text
  em: ({ children }: { children: React.ReactNode }) => (
    <em className="italic text-foreground">{children}</em>
  ),
};

// Export individual components for use in other parts of the app
export { OptimizedImage };