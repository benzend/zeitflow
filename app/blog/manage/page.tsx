'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { GODMODE_EMAILS } from '@/lib/constants';

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt?: string;
  published: boolean;
  featuredImage?: string;
  tags?: string[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BlogManage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  const parseTags = (tags: string | string[] | undefined): string[] => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    try {
      return JSON.parse(tags);
    } catch {
      return [];
    }
  };

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

  useEffect(() => {
    if (session) {
      fetchPosts();
    }
  }, [session, filterStatus]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const published = filterStatus === 'all' ? undefined : filterStatus === 'published';
      const params = new URLSearchParams({
        published: published !== undefined ? published.toString() : '', // Get all posts (including drafts)
        limit: '100',
      });

      const response = await fetch(`/api/blog?${params}`);
      const data = await response.json();

      if (data.success) {
        // Admins can see all posts
        setPosts(data.posts);
      } else {
        showMessage('Failed to fetch posts', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleDelete = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/blog?id=${postId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        showMessage('Post deleted successfully', 'success');
        setPosts(posts.filter(post => post.id !== postId));
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      const response = await fetch(`/api/blog?id=${post.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          published: !post.published,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showMessage(
          post.published ? 'Post unpublished successfully' : 'Post published successfully',
          'success'
        );
        setPosts(posts.map(p => 
          p.id === post.id 
            ? { ...p, published: !p.published, publishedAt: !p.published ? new Date().toISOString() : undefined }
            : p
        ));
      } else {
        showMessage(data.message || 'Failed to update post', 'error');
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 py-16 mt-10">
          <div className="animate-pulse">
            <div className="h-8 bg-surface rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-surface rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-16 mt-10">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">
                Manage Blog Posts
              </h1>
              <p className="text-text-muted">
                Create, edit, and manage your blog posts
              </p>
            </div>
            <Button
              onClick={() => router.push('/blog/create')}
              variant="primary"
            >
              Create New Post
            </Button>
          </div>
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

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search posts..."
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'primary' : 'secondary'}
              onClick={() => setFilterStatus('all')}
              size="sm"
            >
              All ({posts.length})
            </Button>
            <Button
              variant={filterStatus === 'published' ? 'primary' : 'secondary'}
              onClick={() => setFilterStatus('published')}
              size="sm"
            >
              Published ({posts.filter(p => p.published).length})
            </Button>
            <Button
              variant={filterStatus === 'draft' ? 'primary' : 'secondary'}
              onClick={() => setFilterStatus('draft')}
              size="sm"
            >
              Drafts ({posts.filter(p => !p.published).length})
            </Button>
          </div>
        </div>

        {/* Posts List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-surface rounded animate-pulse"></div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="bg-surface border border-border rounded-lg p-8">
                <h2 className="text-2xl font-semibold mb-4 text-foreground">
                  {searchTerm ? 'No posts found' : 'No posts yet'}
                </h2>
                <p className="text-text-muted mb-6">
                  {searchTerm 
                    ? 'Try adjusting your search terms or filters.'
                    : 'Get started by creating your first blog post.'
                  }
                </p>
                <Button onClick={() => router.push('/blog/create')} variant="primary">
                  Create Your First Post
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div key={post.id} className="bg-surface border border-border rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-foreground truncate">
                        {post.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        post.published 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    {post.excerpt && (
                      <p className="text-text-muted mb-3 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-text-muted">
                      <span>
                        Created: {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                      {post.publishedAt && (
                        <span>
                          Published: {new Date(post.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                      {(() => {
                        const tags = parseTags(post.tags);
                        return tags.length > 0 && (
                          <div className="flex gap-1">
                            {tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-border rounded text-xs">
                                {tag}
                              </span>
                            ))}
                            {tags.length > 3 && (
                              <span className="px-2 py-1 bg-border rounded text-xs">
                                +{tags.length - 3}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleTogglePublish(post)}
                    >
                      {post.published ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/blog/edit/${post.id}`)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="clear"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}