import { Eye, Download } from 'lucide-react';
import { Button } from "@/components/Button";
import { getCategoryInfo } from "@/lib/template-utils";

export interface Template {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  category: string;
  tags: string[];
  icon: string | null;
  visibility: string;
  authorName: string | null;
  useCount: number;
  previewImage: string | null;
  createdAt: string;
}

interface TemplateCardProps {
  template: Template;
  onPreview: (template: Template) => void;
  onUse: (template: Template) => void;
}

export function TemplateCard({ template, onPreview, onUse }: TemplateCardProps) {
  const categoryInfo = getCategoryInfo(template.category);

  return (
    <div className="flex flex-col justify-between rounded-lg shadow hover:shadow-md transition duration-200 bg-background-light overflow-hidden">
      {/* Preview Image or Icon */}
      <div
        className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center cursor-pointer hover:from-primary/15 hover:to-primary/10 transition-colors"
        onClick={() => onPreview(template)}
      >
        {template.previewImage ? (
          <img
            src={template.previewImage}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-5xl">{template.icon || categoryInfo.icon}</span>
        )}
        {template.visibility === 'official' && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs bg-blue-500 text-white font-semibold">
            Official
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className="p-4 cursor-pointer flex-1 hover:bg-background-extra-light transition-colors"
        onClick={() => onPreview(template)}
      >
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1">
            <h3 className="text-md text-foreground font-semibold">{template.name}</h3>
          </div>
          <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary font-medium whitespace-nowrap">
            {categoryInfo.label}
          </span>
        </div>

        {template.description && (
          <p className="text-sm text-foreground-light mb-3 line-clamp-2">
            {template.description}
          </p>
        )}

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {template.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
              >
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="px-2 py-0.5 rounded text-xs text-gray-500">
                +{template.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Author and Usage Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {template.authorName || 'Anonymous'}
          </span>
          <span>
            {template.useCount} {template.useCount === 1 ? 'use' : 'uses'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 p-4 border-t border-primary/10">
        <Button
          onClick={() => onPreview(template)}
          variant="tertiary"
          size="sm"
          className="flex-1"
        >
          <Eye size={14} />
          Preview
        </Button>
        <Button
          onClick={() => onUse(template)}
          variant="primary"
          size="sm"
          className="flex-1"
        >
          <Download size={14} />
          Use Template
        </Button>
      </div>
    </div>
  );
}

export function TemplateCardSkeleton() {
  return (
    <div className="flex flex-col justify-between rounded-lg shadow hover:shadow-md transition duration-200 bg-background-light overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="h-32 bg-primary/20"></div>

      {/* Content skeleton */}
      <div className="p-4 flex-1">
        <div className="flex items-start gap-2 mb-2">
          <div className="h-5 w-32 bg-primary/20 rounded flex-1"></div>
          <div className="h-5 w-20 bg-primary/20 rounded"></div>
        </div>
        <div className="h-4 w-full bg-primary/20 rounded mb-2"></div>
        <div className="h-4 w-3/4 bg-primary/20 rounded mb-3"></div>

        {/* Tags skeleton */}
        <div className="flex gap-1 mb-3">
          <div className="h-5 w-16 bg-primary/20 rounded"></div>
          <div className="h-5 w-12 bg-primary/20 rounded"></div>
          <div className="h-5 w-14 bg-primary/20 rounded"></div>
        </div>

        {/* Stats skeleton */}
        <div className="flex justify-between">
          <div className="h-4 w-20 bg-primary/20 rounded"></div>
          <div className="h-4 w-16 bg-primary/20 rounded"></div>
        </div>
      </div>

      {/* Actions skeleton */}
      <div className="flex gap-2 p-4 border-t border-primary/10">
        <div className="h-8 flex-1 bg-primary/20 rounded"></div>
        <div className="h-8 flex-1 bg-primary/20 rounded"></div>
      </div>
    </div>
  );
}
