import { useState } from 'react';
import { AssetLibrary } from './AssetLibrary';
import { AssetUpload } from './AssetUpload';
import { Button } from './Button';

interface FeaturedImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
  showAssetLibrary?: boolean;
}

export default function FeaturedImageUpload({ 
  value, 
  onChange, 
  label = "Featured Image",
  helperText = "Upload a featured image for your blog post (optional)",
  showAssetLibrary = true
}: FeaturedImageUploadProps) {
  const [showAssetLibraryModal, setShowAssetLibraryModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleUploadComplete = (files: { url: string; altText?: string }[]) => {
    if (files && files.length > 0) {
      onChange(files[0].url);
      setShowUploadModal(false);
    }
  };

  const handleAssetSelect = (asset: { url: string; altText?: string }) => {
    onChange(asset.url);
    setShowAssetLibraryModal(false);
  };

  const handleRemoveImage = () => {
    onChange('');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
      </label>
      
      <div className="space-y-3">
        {/* Image Preview */}
        {value ? (
          <div className="relative group">
            <img 
              src={value} 
              alt="Featured image preview" 
              className="w-full h-48 object-cover rounded-lg border border-border"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove featured image"
              aria-label="Remove featured image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <div className="space-y-2">
              <svg className="mx-auto h-12 w-12 text-text-muted" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-text-muted">
                <p className="text-sm">No featured image selected</p>
                <p className="text-xs mt-1">JPEG, PNG, GIF, or WebP (max 5MB)</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Buttons */}
        <div className="flex items-center space-x-3">
          <Button
            type="button"
            onClick={() => setShowUploadModal(true)}
          >
            {value ? 'Change Image' : 'Upload Image'}
          </Button>

          {showAssetLibrary && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAssetLibraryModal(true)}
            >
              Browse Library
            </Button>
          )}
          
          {value && (
            <div className="text-xs text-text-muted flex-1 truncate">
              Image URL: {value}
            </div>
          )}
        </div>
      </div>

      {helperText && (
        <p className="mt-1 text-sm text-text-muted">{helperText}</p>
      )}

      {/* Asset Library Modal */}
      {showAssetLibraryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-semibold">Select from Asset Library</h3>
              <button
                onClick={() => setShowAssetLibraryModal(false)}
                className="text-text-muted hover:text-foreground"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <AssetLibrary 
                onAssetSelect={handleAssetSelect}
                allowMultiple={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-semibold">Upload Featured Image</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-text-muted hover:text-foreground"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <AssetUpload
                onUploadComplete={handleUploadComplete}
                allowedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
                maxSize={10 * 1024 * 1024}
                defaultTags={['featured-image']}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
