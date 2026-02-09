# Blog System Architecture

This document provides a comprehensive overview of the blog system architecture, including technology choices, data flow, and implementation details.

> **Related Documentation**: See [MDX_IMPLEMENTATION.md](./MDX_IMPLEMENTATION.md) for details on the image optimization pipeline.

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Database Schema](#database-schema)
5. [Page Routes](#page-routes)
6. [Components](#components)
7. [API Endpoints](#api-endpoints)
8. [Data Flow](#data-flow)
9. [Authentication & Authorization](#authentication--authorization)
10. [SEO Implementation](#seo-implementation)
11. [Content Rendering Pipeline](#content-rendering-pipeline)
12. [Asset Management](#asset-management)

---

## Overview

The blog system is a full-featured content management system built within ZeitFlow. It uses **Next.js App Router** (the only part of the application using App Router—the rest uses Pages Router) for server-side rendering and SEO optimization.

### Key Features

- **MDX Content**: Write blog posts in Markdown with React component support
- **Draft/Publish Workflow**: Save drafts, preview, and publish when ready
- **Image Optimization**: Automatic Next.js Image optimization with blur placeholders
- **SEO-First Design**: Structured data, Open Graph, reading time estimation
- **Admin Dashboard**: Search, filter, bulk actions for content management
- **Real-Time Preview**: See rendered content while editing

---

## Technology Stack

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next-mdx-remote` | ^5.0.0 | MDX compilation and rendering (server + client) |
| `sharp` | ^0.34.5 | Image processing, blur placeholder generation |
| `image-size` | ^2.0.2 | Extract image dimensions on upload |
| `marked` | ^17.0.1 | Markdown parsing (fallback renderer) |

### Why These Choices?

**next-mdx-remote over @next/mdx**
- Allows storing MDX content in a database (not just filesystem)
- Supports dynamic content loading
- Works with both App Router and Pages Router
- Enables custom component injection at runtime

**sharp for image processing**
- Industry-standard Node.js image processing
- Fast, memory-efficient
- Supports blur placeholder generation (base64 data URLs)
- Handles multiple formats (JPEG, PNG, WebP, AVIF)

**App Router for blog pages**
- Better SEO with server components
- Streaming and Suspense support
- Cleaner metadata API
- Parallel route segments for layouts

---

## Directory Structure

```
app/blog/
├── layout.tsx                 # Blog layout wrapper (navigation, footer)
├── page.tsx                   # Blog listing page with pagination
├── [slug]/
│   └── page.tsx              # Individual blog post (dynamic route)
├── create/
│   └── page.tsx              # Create new post (admin only)
├── edit/
│   └── [id]/
│       └── page.tsx          # Edit existing post (admin only)
├── manage/
│   └── page.tsx              # Admin dashboard (admin only)
└── preview/
    └── page.tsx              # Preview before publishing (admin only)

components/blog/
├── index.ts                   # Barrel exports
├── BlogPost.tsx              # Main post renderer (async server component)
├── BlogPostCard.tsx          # Card for listing grid
├── BlogNavigation.tsx        # Pagination controls
├── MDXClientRenderer.tsx     # Client-side MDX rendering
└── AdminActions.tsx          # Edit/delete buttons

lib/
├── mdx-components.tsx        # Custom MDX element mappings
├── mdx-enhancer.ts           # Server-side content enhancement
├── render-mdx.tsx            # Server-side MDX rendering utility
└── reading-time.ts           # Reading time calculator

pages/api/blog/
├── index.ts                  # Main CRUD operations
├── [slug].ts                 # Fetch by slug
└── preview.ts                # Preview endpoint
```

---

## Database Schema

The blog uses a single `blog_posts` table defined in `schema.ts`:

```typescript
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  published: boolean("published").default(false),
  authorId: text("author_id").references(() => users.id, { onDelete: "cascade" }),
  featuredImage: text("featured_image"),
  tags: text("tags"),                    // JSON array stored as string
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Field Details

| Field | Type | Description |
|-------|------|-------------|
| `slug` | text | URL-friendly identifier (auto-generated from title) |
| `content` | text | Raw MDX/Markdown content |
| `published` | boolean | Draft (false) or published (true) |
| `tags` | text | JSON array as string, e.g., `'["tech", "tutorial"]'` |
| `featuredImage` | text | URL to featured image (Vercel Blob or external) |
| `publishedAt` | timestamp | Set when first published, used for ordering |

### Indexes

- Unique index on `slug` for fast lookups
- Foreign key on `authorId` with cascade delete

---

## Page Routes

### Public Routes

#### `/blog` - Blog Listing
- **Rendering**: Server-side (force-dynamic)
- **Features**: Pagination (12 posts/page), featured images, reading time
- **Data**: Fetches published posts ordered by `publishedAt` DESC

#### `/blog/[slug]` - Individual Post
- **Rendering**: Server-side with dynamic metadata
- **Features**: Full MDX rendering, author info, admin actions
- **SEO**: Generates Open Graph images, structured data

### Admin Routes

All admin routes check against `GODMODE_EMAILS` environment variable.

#### `/blog/create` - Create Post
- **Components**: RichTextEditor, FeaturedImageUpload, tag input
- **Features**: Markdown toolbar, image upload, draft saving

#### `/blog/edit/[id]` - Edit Post
- **Features**: Same as create, loads existing content

#### `/blog/manage` - Admin Dashboard
- **Features**: Search, filter by status, publish/unpublish toggle, delete

#### `/blog/preview` - Preview
- **Access**: Query param `id` (database) or `data` (encoded content)
- **Features**: Yellow preview banner, full rendering

---

## Components

### Server Components

#### `BlogPost.tsx` (Async)
The main blog post renderer. Handles:
- Reading time calculation
- Featured image with Next.js Image
- MDX content rendering via `MDXClientRenderer`
- Author display with admin badge

```tsx
// Usage in app/blog/[slug]/page.tsx
<BlogPost post={post} />
```

### Client Components

#### `MDXClientRenderer.tsx`
Client-side MDX serialization and rendering:
- Uses `serialize()` from `next-mdx-remote`
- Applies custom components from `mdx-components.tsx`
- Loading state with skeleton
- Error fallback UI

```tsx
<MDXClientRenderer content={post.content} />
```

#### `RichTextEditor.tsx`
Markdown editor with:
- Formatting toolbar (bold, italic, headings, links, code, lists)
- Preview mode toggle
- Image upload integration
- Asset library picker

#### `BlogPostCard.tsx`
Grid card for listing pages:
- Featured image thumbnail
- Title, excerpt (truncated)
- Reading time, author, date
- Hover effects

---

## API Endpoints

### `POST /api/blog` - Create Post

```typescript
// Request body
{
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  tags?: string[];
  published?: boolean;
}

// Response
{ success: true, post: BlogPost }
```

### `GET /api/blog` - List/Fetch Posts

```typescript
// Query params
?id=123                    // Fetch single post by ID
?page=1&limit=12           // Pagination
?published=true            // Filter by status
?search=keyword            // Search title/excerpt

// Response
{ posts: BlogPost[], total: number, page: number, limit: number }
```

### `PUT /api/blog?id=123` - Update Post

```typescript
// Request body (partial update)
{
  title?: string;
  content?: string;
  published?: boolean;
  // ... any field
}
```

### `DELETE /api/blog?id=123` - Delete Post

Requires admin authentication. Permanent deletion.

### `GET /api/blog/[slug]` - Fetch by Slug

Public endpoint for fetching published posts by slug.

---

## Data Flow

### Creating a Post

```
User writes in RichTextEditor
    ↓
Images uploaded to Vercel Blob via /api/assets/upload
    ↓
Image URLs inserted into markdown content
    ↓
POST /api/blog with content
    ↓
Server generates slug from title
    ↓
Content saved to blog_posts table
    ↓
Redirect to manage page or continue editing
```

### Rendering a Post

```
User visits /blog/[slug]
    ↓
Server fetches post by slug (App Router server component)
    ↓
Metadata generated (title, description, OG image)
    ↓
BlogPost component renders:
    ├── Featured image (Next.js Image with blur)
    ├── Title, author, reading time
    └── MDXClientRenderer receives content
            ↓
        Client serializes MDX
            ↓
        Custom components applied (mdx-components.tsx)
            ↓
        Rendered HTML displayed
```

### Image Pipeline

```
Upload via RichTextEditor or FeaturedImageUpload
    ↓
/api/assets/upload receives file
    ↓
Sharp extracts dimensions
    ↓
Sharp generates blur placeholder (base64)
    ↓
File uploaded to Vercel Blob
    ↓
Metadata saved to assets table:
    { url, width, height, blurDataURL }
    ↓
URL returned to editor, inserted as markdown image
```

---

## Authentication & Authorization

### Authentication
Uses NextAuth.js with the existing user system:
- Session checked via `getServerSession()`
- User info available in session object

### Authorization Levels

| Role | Capabilities |
|------|-------------|
| Anonymous | View published posts only |
| Authenticated | View published posts only |
| Admin (GODMODE) | Create, edit, delete, manage all posts |

### Admin Check

```typescript
// lib/auth.ts or inline
const GODMODE_EMAILS = process.env.GODMODE_EMAILS?.split(",") || [];

function isAdmin(email: string | null | undefined): boolean {
  return email ? GODMODE_EMAILS.includes(email) : false;
}
```

### Protected Routes

Admin routes redirect to `/blog` if user is not admin:

```typescript
// In page component
const session = await getServerSession(authOptions);
if (!isAdmin(session?.user?.email)) {
  redirect("/blog");
}
```

---

## SEO Implementation

### Metadata API

Each page exports metadata using Next.js App Router patterns:

```typescript
// Static metadata
export const metadata: Metadata = {
  title: "Blog | ZeitFlow",
  description: "...",
};

// Dynamic metadata for [slug] pages
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await fetchPost(params.slug);
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.featuredImage],
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
  };
}
```

### Structured Data (JSON-LD)

Blog listing page:

```json
{
  "@context": "https://schema.org",
  "@type": "Blog",
  "name": "ZeitFlow Blog",
  "description": "...",
  "url": "https://zeitflow.com/blog"
}
```

Individual post:

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Post Title",
  "description": "...",
  "image": "...",
  "datePublished": "2024-01-15T10:00:00Z",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  }
}
```

### Reading Time

Calculated at render time using `lib/reading-time.ts`:

```typescript
export function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}
```

---

## Content Rendering Pipeline

### MDX Components (`lib/mdx-components.tsx`)

Custom styled components for MDX elements:

```typescript
export const mdxComponents: MDXComponents = {
  // Headings with anchor links
  h1: (props) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
  h2: (props) => <h2 className="text-2xl font-semibold mt-6 mb-3" {...props} />,

  // Optimized images
  img: ({ src, alt }) => (
    <OptimizedImage src={src} alt={alt} className="rounded-lg" />
  ),

  // Code blocks with syntax highlighting
  pre: (props) => <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto" {...props} />,
  code: (props) => <code className="bg-gray-100 px-1 rounded" {...props} />,

  // Links open in new tab for external
  a: ({ href, children }) => (
    <a
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),

  // ... blockquote, lists, tables, etc.
};
```

### Server-Side Rendering (`lib/render-mdx.tsx`)

For server components (used in email, RSS, etc.):

```typescript
import { compileMDX } from "next-mdx-remote/rsc";

export async function renderMDX(content: string) {
  try {
    const { content: rendered } = await compileMDX({
      source: content,
      components: mdxComponents,
    });
    return rendered;
  } catch (error) {
    // Fallback to marked() for invalid MDX
    return <div dangerouslySetInnerHTML={{ __html: marked(content) }} />;
  }
}
```

### Client-Side Rendering (`MDXClientRenderer.tsx`)

For interactive pages:

```typescript
"use client";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote } from "next-mdx-remote";

export function MDXClientRenderer({ content }: { content: string }) {
  const [mdxSource, setMdxSource] = useState(null);

  useEffect(() => {
    serialize(content).then(setMdxSource);
  }, [content]);

  if (!mdxSource) return <Skeleton />;

  return <MDXRemote {...mdxSource} components={mdxComponents} />;
}
```

---

## Asset Management

### Upload Flow

1. User selects file in editor or featured image picker
2. File sent to `/api/assets/upload`
3. Server processes with Sharp:
   - Extract dimensions
   - Generate blur placeholder (20px wide, base64)
4. Upload to Vercel Blob
5. Save metadata to `assets` table
6. Return URL to client

### Assets Table Schema

```typescript
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  filename: text("filename"),
  contentType: text("content_type"),
  size: integer("size"),
  width: integer("width"),           // Extracted on upload
  height: integer("height"),         // Extracted on upload
  blurDataURL: text("blur_data_url"), // Base64 blur placeholder
  uploadedBy: text("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Backfill Existing Assets

For assets uploaded before the optimization system:

```bash
pnpm backfill-assets
```

This script:
1. Fetches all assets missing dimensions
2. Downloads each image
3. Extracts dimensions with `image-size`
4. Generates blur with Sharp
5. Updates database records

---

## Performance Considerations

### Caching

- Blog listing: `force-dynamic` for fresh content
- Individual posts: Could add `revalidate` for ISR
- API responses: Consider adding Cache-Control headers

### Image Optimization

- Next.js Image handles format conversion (WebP/AVIF)
- Blur placeholders reduce perceived load time
- Responsive `sizes` attribute for proper srcset

### Bundle Size

- MDX serialization happens client-side (adds ~30KB)
- Consider server-only rendering for static posts
- Sharp is server-only, not bundled to client

---

## Future Enhancements

### Planned

- [ ] Categories in addition to tags
- [ ] Related posts suggestions
- [ ] RSS feed generation
- [ ] Newsletter integration (auto-send on publish)
- [ ] Scheduled publishing

### Potential

- [ ] Comments system
- [ ] Post reactions/likes
- [ ] Reading progress indicator
- [ ] Table of contents generation
- [ ] Full-text search with PostgreSQL

---

## Troubleshooting

### Common Issues

**MDX parsing fails**
- Check for unescaped special characters (`{`, `}`, `<`, `>`)
- Ensure all JSX is properly closed
- Fallback renderer will show basic HTML

**Images not optimizing**
- Verify image exists in `assets` table with dimensions
- Run `pnpm backfill-assets` for existing images
- Check Vercel Blob token is configured

**Admin access denied**
- Verify email is in `GODMODE_EMAILS` env var
- Emails are comma-separated, no spaces
- Restart server after env changes

### Debug Mode

Add to page component:

```typescript
console.log("Post data:", post);
console.log("Session:", session);
console.log("Is admin:", isAdmin(session?.user?.email));
```
