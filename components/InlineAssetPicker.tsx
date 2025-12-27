import { useState } from 'react';
import { AssetUpload } from './AssetUpload';

interface InlineAssetPickerProps {
  onAssetSelect: (asset: { url: string; altText?: string }) => void;
  buttonText?: string;
  className?: string;
}

export const InlineAssetPicker: React.FC<InlineAssetPickerProps> = ({
  onAssetSelect,
  buttonText = "Insert Image",
  className = "",
}) => {
  const [showLibrary, setShowLibrary] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleUploadComplete = (files: { url: string; altText?: string }[]) => {
    if (files && files.length > 0) {
      onAssetSelect({
        url: files[0].url,
        altText: files[0].altText,
      });
      setShowUploadModal(false);
    }
  };

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={() => setShowLibrary(true)}
          className="px-3 py-1 bg-primary text-background rounded hover:bg-primary/80 transition-colors text-sm"
        >
          {buttonText}
        </button>
        
        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="px-3 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors text-sm"
        >
          Upload New
        </button>
      </div>

      {/* Asset Library Modal */}
      {showLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-semibold">Choose from Asset Library</h3>
              <button
                onClick={() => setShowLibrary(false)}
                className="text-text-muted hover:text-foreground"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* We'll use a simpler version here for the inline picker */}
              <div className="text-center py-8">
                <p className="text-text-muted">Asset library integration coming soon...</p>
                <button
                  onClick={() => setShowLibrary(false)}
                  className="mt-4 px-4 py-2 bg-primary text-background rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-semibold">Upload New Images</h3>
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
                defaultTags={['blog-content']}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};