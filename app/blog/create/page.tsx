'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import RichTextEditor from '@/components/RichTextEditor';
import FeaturedImageUpload from '@/components/FeaturedImageUpload';
import { GODMODE_EMAILS } from '@/lib/constants';

interface BlogPost {
  id?: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  published: boolean;
  featuredImage?: string;
  tags: string[];
  tagInput?: string; // For raw input display
}

export default function BlogCreate() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  
  const [post, setPost] = useState<BlogPost>({
    slug: '',
    title: '',
    excerpt: '',
    content: '',
    published: false,
    featuredImage: '',
    tags: [],
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      // Check if user is admin
      if (!GODMODE_EMAILS.includes(session.user.email)) {
        router.push('/blog');
        return;
      }
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-16 mt-10">
          <div className="animate-pulse">
            <div className="h-8 bg-surface rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-surface rounded"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleInputChange = (field: keyof BlogPost, value: string | boolean) => {
    setPost(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setPost(prev => ({
      ...prev,
      tags,
      tagInput: value // Store the raw input for display
    }));
  };

  const handleSave = async (publish = false) => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...post,
          published: publish,
          tags: JSON.stringify(post.tags),
        }),
      });

      const data = await response.json();

      if (data.success) {
        showMessage(publish ? 'Post published successfully!' : 'Post saved as draft!', 'success');
        if (publish) {
          setTimeout(() => router.push('/blog'), 2000);
        }
      } else {
        showMessage(data.message || 'Failed to save post', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-16 mt-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Create Blog Post
          </h1>
          <p className="text-text-muted">
            Write and publish your thoughts on AI workflow automation
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            messageType === 'success' 
              ? 'bg-green-500/10 border-green-500/50 text-green-400' 
              : 'bg-red-500/10 border-red-500/50 text-red-400'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={post.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter your post title..."
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-foreground mb-2">
              URL Slug *
            </label>
            <input
              type="text"
              id="slug"
              value={post.slug}
              onChange={(e) => {
                // Allow user to type freely, only lowercase and replace spaces/underscores with dashes
                const slug = e.target.value
                  .toLowerCase()
                  .replace(/[ _]+/g, '-');
                handleInputChange('slug', slug);
              }}
              onBlur={(e) => {
                // Format and validate on blur
                const formatted = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/(^-|-$)/g, '');
                handleInputChange('slug', formatted);
              }}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="your-post-url"
              required
            />
            <p className="mt-1 text-sm text-text-muted">
              This will be used in the URL: /blog/{post.slug || 'your-post-slug'}
              <br />
              <span className="text-xs">Use lowercase letters, numbers, and hyphens. Auto-formatted when you click away.</span>
            </p>
          </div>

          {/* Excerpt */}
          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-foreground mb-2">
              Excerpt
            </label>
            <textarea
              id="excerpt"
              value={post.excerpt}
              onChange={(e) => handleInputChange('excerpt', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Brief description of your post (optional)..."
            />
          </div>

          {/* Featured Image */}
          <FeaturedImageUpload
            value={post.featuredImage}
            onChange={(url) => handleInputChange('featuredImage', url)}
          />

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-foreground mb-2">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              value={post.tagInput || post.tags.join(', ')}
              onChange={(e) => handleTagsChange(e.target.value)}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="ai, workflow, automation (comma-separated)"
            />
            <p className="mt-1 text-sm text-text-muted">
              Separate tags with commas
            </p>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-foreground mb-2">
              Content *
            </label>
            <RichTextEditor
              value={post.content}
              onChange={(value) => handleInputChange('content', value)}
              placeholder="Write your post content here..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-border">
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                onClick={() => handleSave(false)}
                disabled={isSaving || !post.title.trim() || !post.content.trim() || !post.slug.trim()}
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                variant="tertiary"
                onClick={() => {
                  const previewData = encodeURIComponent(JSON.stringify({
                    ...post,
                    publishedAt: new Date().toISOString(),
                  }));
                  window.open(`/blog/preview?data=${previewData}`, '_blank');
                }}
                disabled={!post.title.trim() || !post.content.trim() || !post.slug.trim()}
              >
                Preview
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSave(true)}
                disabled={isSaving || !post.title.trim() || !post.content.trim() || !post.slug.trim()}
              >
                {isSaving ? 'Publishing...' : 'Publish Post'}
              </Button>
            </div>
            <Button
              variant="clear"
              onClick={() => router.push('/blog')}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}