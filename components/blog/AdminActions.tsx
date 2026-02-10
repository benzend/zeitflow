'use client';

import { useState } from 'react';
import { Button } from '../Button';

interface AdminActionsProps {
  postId: number;
  slug: string;
  isAdmin: boolean;
  content?: string;
}

export function AdminActions({ postId, slug, isAdmin, content }: AdminActionsProps) {
  const [copied, setCopied] = useState(false);

  if (!isAdmin) {
    return null;
  }

  const handleCopyContent = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mb-6 p-4 bg-surface/50 border border-border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">Admin Actions:</span>
        </div>
        <div className="flex items-center gap-2">
          {content && (
            <Button
              variant="tertiary"
              size="sm"
              onClick={handleCopyContent}
            >
              {copied ? 'Copied!' : 'Copy MD'}
            </Button>
          )}
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => window.open(`/blog/preview?id=${postId}`, '_blank')}
          >
            Preview
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.href = `/blog/edit/${postId}`}
          >
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
}