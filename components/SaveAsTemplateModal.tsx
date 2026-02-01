import { useState, useEffect } from "react";
import { Button } from "./Button";
import { TEMPLATE_CATEGORIES } from "@/lib/template-utils";

interface SaveAsTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: number;
  workflowName: string;
  onSave: (templateData: {
    name: string;
    description: string;
    category: string;
    tags: string[];
    icon: string;
    visibility: 'private' | 'public';
    instructions: string;
  }) => Promise<void>;
}

export default function SaveAsTemplateModal({
  isOpen,
  onClose,
  workflowId,
  workflowName,
  onSave,
}: SaveAsTemplateModalProps) {
  const [formData, setFormData] = useState({
    name: workflowName || '',
    description: '',
    category: 'general',
    tags: '',
    icon: '',
    visibility: 'private' as 'private' | 'public',
    instructions: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset form when modal opens with new workflow
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: workflowName || '',
        description: '',
        category: 'general',
        tags: '',
        icon: '',
        visibility: 'private',
        instructions: '',
      });
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, workflowName]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSave = async () => {
    // Validate
    if (!formData.name.trim()) {
      setError('Template name is required');
      return;
    }

    if (!formData.category) {
      setError('Category is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Parse tags
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await onSave({
        ...formData,
        tags,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save template');
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background-light rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Save as Template
            </h2>
            <Button
              onClick={onClose}
              variant="tertiary"
              className="!p-2 !bg-transparent hover:!bg-surface-hover"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="13" y2="13" />
                <line x1="13" y1="1" x2="1" y2="13" />
              </svg>
            </Button>
          </div>

          {/* Success State */}
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-success/20 rounded-full flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-foreground font-medium mb-2">Template Saved!</p>
              <p className="text-sm text-foreground-light">
                Your workflow has been saved as a template.
              </p>
            </div>
          ) : (
            <>
              {/* Form */}
              <div className="space-y-4">
                {/* Template Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 bg-background-extra-light border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    placeholder="e.g., Email Notification Workflow"
                    disabled={saving}
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 bg-background-extra-light border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    placeholder="Describe what this template does..."
                    rows={3}
                    disabled={saving}
                  />
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">
                    Category *
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 bg-background-extra-light border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    disabled={saving}
                  >
                    {TEMPLATE_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-foreground mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    className="w-full px-3 py-2 bg-background-extra-light border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    placeholder="email, automation, ai"
                    disabled={saving}
                  />
                </div>

                {/* Icon */}
                <div>
                  <label htmlFor="icon" className="block text-sm font-medium text-foreground mb-1">
                    Icon (emoji)
                  </label>
                  <input
                    type="text"
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => handleInputChange('icon', e.target.value)}
                    className="w-full px-3 py-2 bg-background-extra-light border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    placeholder="📧"
                    maxLength={2}
                    disabled={saving}
                  />
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Visibility
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="visibility"
                        value="private"
                        checked={formData.visibility === 'private'}
                        onChange={(e) => handleInputChange('visibility', e.target.value)}
                        className="mr-2 text-primary focus:ring-primary"
                        disabled={saving}
                      />
                      <span className="text-sm text-foreground">
                        Private <span className="text-foreground-light">(only you)</span>
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={formData.visibility === 'public'}
                        onChange={(e) => handleInputChange('visibility', e.target.value)}
                        className="mr-2 text-primary focus:ring-primary"
                        disabled={saving}
                      />
                      <span className="text-sm text-foreground">
                        Public <span className="text-foreground-light">(community marketplace)</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label htmlFor="instructions" className="block text-sm font-medium text-foreground mb-1">
                    Setup Instructions (optional)
                  </label>
                  <textarea
                    id="instructions"
                    value={formData.instructions}
                    onChange={(e) => handleInputChange('instructions', e.target.value)}
                    className="w-full px-3 py-2 bg-background-extra-light border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground font-mono text-sm"
                    placeholder="Provide setup instructions for users..."
                    rows={4}
                    disabled={saving}
                  />
                  <p className="text-xs text-foreground-light mt-1">
                    Supports Markdown formatting
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={onClose}
                  variant="tertiary"
                  className="flex-1"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  variant="primary"
                  className="flex-1"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Create Template'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
