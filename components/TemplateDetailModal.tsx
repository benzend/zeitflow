import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "./Button";
import { getCategoryInfo } from "@/lib/template-utils";
import { NodeData } from "@/lib/workflow-types";
import { Download, X } from "lucide-react";

interface TemplateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: {
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
    instructions: string | null;
    nodes: NodeData[];
    connections: any[];
    createdAt: string;
  } | null;
}

export default function TemplateDetailModal({
  isOpen,
  onClose,
  template,
}: TemplateDetailModalProps) {
  const router = useRouter();
  const [using, setUsing] = useState(false);
  const [customName, setCustomName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  if (!isOpen || !template) return null;

  const categoryInfo = getCategoryInfo(template.category);

  // Get unique node types from template
  const nodeTypes = Array.from(new Set(template.nodes.map(n => n.type)));

  const handleUseTemplate = async () => {
    setUsing(true);

    try {
      const response = await fetch(`/api/templates/${template.id}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowName: customName.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.workflow) {
        // Redirect to the new workflow editor
        router.push(`/workflow/${data.workflow.id}`);
      } else {
        alert(data.message || 'Failed to create workflow from template');
        setUsing(false);
      }
    } catch (error) {
      console.error('Error using template:', error);
      alert('Failed to create workflow from template');
      setUsing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-light rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background-light border-b border-primary/10 p-6 flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {template.icon && (
                <span className="text-3xl">{template.icon}</span>
              )}
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {template.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary font-medium">
                    {categoryInfo.label}
                  </span>
                  {template.visibility === 'official' && (
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-500 text-white font-semibold">
                      Official
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="tertiary"
            className="!p-2 !bg-transparent hover:!bg-surface-hover"
          >
            <X size={18} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Preview Image */}
          {template.previewImage && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={template.previewImage}
                alt={template.name}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Description */}
          {template.description && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
              <p className="text-foreground-light">{template.description}</p>
            </div>
          )}

          {/* Tags */}
          {template.tags && template.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Node Types */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Included Nodes</h3>
            <div className="flex flex-wrap gap-2">
              {nodeTypes.map((type, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-sm bg-primary/10 text-primary font-medium capitalize"
                >
                  {type}
                </span>
              ))}
            </div>
            <p className="text-xs text-foreground-light mt-2">
              {template.nodes.length} node{template.nodes.length !== 1 ? 's' : ''} total
            </p>
          </div>

          {/* Setup Instructions */}
          {template.instructions && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Setup Instructions</h3>
              <div className="bg-background-extra-light p-4 rounded-lg border border-border">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                  {template.instructions}
                </pre>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between p-4 bg-background-extra-light rounded-lg">
            <div>
              <p className="text-sm text-foreground-light">Created by</p>
              <p className="text-foreground font-medium">{template.authorName || 'Anonymous'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-foreground-light">Usage</p>
              <p className="text-foreground font-medium">
                {template.useCount} {template.useCount === 1 ? 'use' : 'uses'}
              </p>
            </div>
          </div>

          {/* Custom Name Input (Optional) */}
          {showNameInput && (
            <div>
              <label htmlFor="customName" className="block text-sm font-medium text-foreground mb-1">
                Custom Workflow Name (optional)
              </label>
              <input
                type="text"
                id="customName"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 bg-background-extra-light border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                placeholder={template.name}
                disabled={using}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-background-light border-t border-primary/10 p-6">
          {!showNameInput ? (
            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="tertiary"
                className="flex-1"
                disabled={using}
              >
                Close
              </Button>
              <Button
                onClick={() => setShowNameInput(true)}
                variant="secondary"
                className="flex-1"
                disabled={using}
              >
                Customize Name
              </Button>
              <Button
                onClick={handleUseTemplate}
                variant="primary"
                className="flex-1"
                disabled={using}
              >
                <Download size={16} />
                {using ? 'Creating...' : 'Use This Template'}
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowNameInput(false);
                  setCustomName('');
                }}
                variant="tertiary"
                className="flex-1"
                disabled={using}
              >
                Back
              </Button>
              <Button
                onClick={handleUseTemplate}
                variant="primary"
                className="flex-1"
                disabled={using}
              >
                <Download size={16} />
                {using ? 'Creating...' : 'Create Workflow'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
