import React, { useState, useCallback } from 'react';
import { Button } from '@/components/Button';
import { AssetUpload } from '@/components/AssetUpload';

interface Asset {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  altText?: string;
  description?: string;
  tags?: string[];
  createdAt: string;
  uploadedBy?: {
    name?: string;
    email?: string;
  };
}

interface AssetLibraryProps {
  onAssetSelect?: (asset: Asset) => void;
  onUploadComplete?: (files: Asset[]) => void;
  allowMultiple?: boolean;
  maxSelection?: number;
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({
  onAssetSelect,
  onUploadComplete,
  allowMultiple = false,
  maxSelection = 10,
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(selectedTags.length > 0 && { tags: selectedTags.join(',') }),
      });

      const response = await fetch(`/api/assets?${params}`);
      const result = await response.json();

      if (result.success) {
        setAssets(result.data.assets);
        setTotalPages(result.data.pagination.totalPages);
      } else {
        console.error('Failed to fetch assets:', result.message);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedTags]);

  const handleUploadComplete = (newAssets: Asset[]) => {
    setShowUploadModal(false);
    fetchAssets(); // Refresh the asset list
    
    // If single selection and onUploadComplete is provided, select the first uploaded asset
    if (!allowMultiple && onUploadComplete && newAssets.length > 0) {
      onUploadComplete(newAssets);
    }
  };

  React.useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleAssetSelect = (asset: Asset) => {
    if (allowMultiple) {
      const isSelected = selectedAssets.some(a => a.id === asset.id);
      if (isSelected) {
        setSelectedAssets(selectedAssets.filter(a => a.id !== asset.id));
      } else if (selectedAssets.length < maxSelection) {
        setSelectedAssets([...selectedAssets, asset]);
      }
    } else {
      setSelectedAssets([asset]);
      if (onAssetSelect) {
        onAssetSelect(asset);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const commonTags = ['blog', 'workflow', 'tutorial', 'featured', 'thumbnail'];

  return (
    <div className="bg-background border border-border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Asset Library</h2>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setShowUploadModal(true)}
            variant="primary"
            className="text-sm"
          >
            Upload Files
          </Button>
          {allowMultiple && selectedAssets.length > 0 && (
            <Button
              onClick={() => {
                if (onAssetSelect) {
                  onAssetSelect(selectedAssets[0]); // Pass first selected for now
                }
              }}
              variant="primary"
              className="text-sm"
            >
              Use Selected ({selectedAssets.length})
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-border rounded-md bg-surface text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {commonTags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                if (selectedTags.includes(tag)) {
                  setSelectedTags(selectedTags.filter(t => t !== tag));
                } else {
                  setSelectedTags([...selectedTags, tag]);
                }
              }}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface text-text-muted hover:bg-border'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted">No assets found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                selectedAssets.some(a => a.id === asset.id)
                  ? 'border-primary ring-2 ring-primary ring-opacity-20'
                  : 'border-border hover:border-primary'
              }`}
              onClick={() => handleAssetSelect(asset)}
            >
              {/* Preview */}
              <div className="aspect-square bg-surface flex items-center justify-center relative">
                {asset.mimeType.startsWith('image/') ? (
                  <img
                    src={asset.url}
                    alt={asset.altText || asset.originalName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <div className="text-3xl mb-2">📄</div>
                    <p className="text-sm text-text-muted">{asset.mimeType}</p>
                  </div>
                )}
                
                {/* Selection indicator */}
                {selectedAssets.some(a => a.id === asset.id) && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="font-medium text-foreground text-sm truncate mb-1">
                  {asset.originalName}
                </h3>
                <p className="text-xs text-text-muted mb-2">
                  {formatFileSize(asset.size)} • {formatDate(asset.createdAt)}
                </p>
                 {asset.altText && (
                   <p className="text-xs text-text-muted italic">
                     &quot;{asset.altText}&quot;
                   </p>
                 )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 text-sm border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface"
          >
            Previous
          </button>
          <span className="text-sm text-text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1 text-sm border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface"
          >
            Next
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Upload Assets</h3>
                <Button
                  onClick={() => setShowUploadModal(false)}
                  variant="tertiary"
                  className="text-sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
            <div className="p-6">
              <AssetUpload 
                onUploadComplete={handleUploadComplete}
                maxSize={10 * 1024 * 1024} // 10MB
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
