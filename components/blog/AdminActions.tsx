'use client';

import { Button } from '../Button';

interface AdminActionsProps {
  postId: number;
  slug: string;
  isAdmin: boolean;
}

export function AdminActions({ postId, slug, isAdmin }: AdminActionsProps) {
  // slug is available for future use (e.g., direct blog URL generation)
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-surface/50 border border-border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">Admin Actions:</span>
        </div>
        <div className="flex items-center gap-2">
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