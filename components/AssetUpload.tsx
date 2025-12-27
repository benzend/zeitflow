import React, { useState, useRef } from 'react';
import { Button } from '@/components/Button';

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

interface AssetUploadProps {
  onUploadComplete?: (assets: Asset[]) => void;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  defaultTags?: string[];
}

export const AssetUpload: React.FC<AssetUploadProps> = ({
  onUploadComplete,
  maxSize = 10 * 1024 * 1024, // 10MB
  allowedTypes,
  defaultTags = [],
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = allowedTypes || [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    const validFiles = Array.from(files).filter(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`File type ${file.type} is not allowed`);
        return false;
      }
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large. Max size is ${maxSize / 1024 / 1024}MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    await uploadFiles(validFiles);
  };

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileData = await Promise.all(
        files.map(async (file) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target?.result,
                altText: '', // Could be added via form fields
                description: '', // Could be added via form fields
                tags: defaultTags, // Use default tags passed as props
              });
            };
            reader.readAsDataURL(file);
          });
        })
      );

      setUploadProgress(50);

      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: fileData,
        }),
      });

      setUploadProgress(90);

      const result = await response.json();

      if (result.success) {
        setUploadProgress(100);
        if (onUploadComplete) {
          onUploadComplete(result.data);
        }
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setError(result.message || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Upload Assets</h3>
      
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(',')}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={isUploading}
        />
        
        <div className="mb-4">
          <div className="text-4xl mb-2">📁</div>
          <h4 className="text-lg font-medium mb-2">
            {isUploading ? 'Uploading...' : 'Drop files here or click to browse'}
          </h4>
          <p className="text-sm text-text-muted">
            Images up to {maxSize / 1024 / 1024}MB each ({ALLOWED_TYPES.join(', ')})
          </p>
        </div>
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="secondary"
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Select Files'}
        </Button>
      </div>

      {/* Progress Bar */}
      {isUploading && uploadProgress > 0 && (
        <div className="mt-4">
          <div className="bg-border rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-text-muted mt-2 text-center">
            {uploadProgress}% complete
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* File Format Help */}
      <div className="mt-4 text-xs text-text-muted">
        <p className="font-medium mb-1">Supported formats:</p>
        <div className="flex flex-wrap gap-2">
          {ALLOWED_TYPES.map(type => (
            <span key={type} className="px-2 py-1 bg-background border border-border rounded">
              {type.replace('image/', '')}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};