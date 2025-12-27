import { useState, useRef } from 'react';
import { AssetLibrary } from './AssetLibrary';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface ToolbarButton {
  label: string;
  icon: string;
  action: () => void;
  className: string;
  isImageUpload?: boolean;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = before + selectedText + after;
    
    const newValue = value.substring(0, start) + newText + value.substring(end);
    onChange(newValue);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const handleAssetSelect = (asset: { url: string; altText?: string }) => {
    const imageMarkdown = `![${asset.altText || 'image'}](${asset.url})`;
    insertText(imageMarkdown);
    setShowLibraryModal(false);
  };

  const handleUploadComplete = (files: { url: string; altText?: string }[]) => {
    if (files && files.length > 0) {
      const imageMarkdown = `![${files[0].altText || 'image'}](${files[0].url})`;
      insertText(imageMarkdown);
      setShowLibraryModal(false);
    }
  };

  const toolbarButtons: ToolbarButton[] = [
    {
      label: 'Bold',
      icon: 'B',
      action: () => insertText('**', '**'),
      className: 'font-bold'
    },
    {
      label: 'Italic',
      icon: 'I',
      action: () => insertText('*', '*'),
      className: 'italic'
    },
    {
      label: 'Heading',
      icon: 'H',
      action: () => insertText('\n## ', ''),
      className: 'font-semibold'
    },
    {
      label: 'Link',
      icon: '🔗',
      action: () => insertText('[', '](url)'),
      className: ''
    },
    {
      label: 'Code',
      icon: '</>',
      action: () => insertText('`', '`'),
      className: 'font-mono text-xs'
    },
    {
      label: 'Code Block',
      icon: '{}',
      action: () => insertText('\n```\n', '\n```\n'),
      className: 'font-mono text-xs'
    },
    {
      label: 'List',
      icon: '•',
      action: () => insertText('\n- ', ''),
      className: ''
    },
    {
      label: 'Quote',
      icon: '"',
      action: () => insertText('\n> ', ''),
      className: ''
    },
    {
      label: 'Image',
      icon: '🖼️',
      action: () => setShowLibraryModal(true),
      className: '',
      isImageUpload: false
    }
  ];

  const renderPreview = (text: string) => {
    // Simple markdown to HTML conversion for preview
    const html = text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-surface border border-border rounded p-3 mb-4 overflow-x-auto"><code>$1</code></pre>')
      // Inline code
      .replace(/`(.+?)`/g, '<code class="bg-surface border border-border rounded px-1 py-0.5 text-sm font-mono">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded my-4" />')
      // Lists
      .replace(/^- (.+)$/gim, '<li class="ml-4">• $1</li>')
      // Quotes
      .replace(/^> (.+)$/gim, '<blockquote class="border-l-4 border-primary/30 pl-4 italic mb-2">$1</blockquote>')
      // Line breaks
      .replace(/\n/g, '<br />');

    return { __html: html };
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-surface">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface/50">
        <div className="flex items-center space-x-1">
          {/* eslint-disable-next-line react-hooks/refs */}
          {toolbarButtons.map((button, index) => (
            <button
              key={index}
              type="button"
              onClick={button.action}
              disabled={button.isImageUpload}
              className={`p-2 text-xs rounded hover:bg-primary/10 transition-colors text-foreground ${button.className} ${
                button.isImageUpload ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={button.label}
            >
              {button.isImageUpload ? '⏳' : button.icon}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              isPreviewMode 
                ? 'bg-primary text-background' 
                : 'bg-border text-foreground hover:bg-primary/20'
            }`}
          >
            {isPreviewMode ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      {/* Editor/Preview */}
      <div className="min-h-[400px]">
        {isPreviewMode ? (
          <div className="p-4 prose prose-invert max-w-none">
            {value ? (
              <div 
                dangerouslySetInnerHTML={renderPreview(value)}
                className="text-foreground"
              />
            ) : (
              <div className="text-text-muted italic">
                Nothing to preview yet. Start writing...
              </div>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || 'Start writing your content...'}
            className="w-full h-[400px] p-4 bg-transparent text-foreground placeholder-text-muted resize-none focus:outline-none font-mono text-sm leading-relaxed"
          />
        )}
      </div>

      {/* Markdown Help */}
      <div className="px-4 py-2 border-t border-border bg-surface/30">
        <div className="text-xs text-text-muted">
          Supports markdown: **bold**, *italic*, ## headings, `code`, [links](url), ![images](url), - lists, &gt; quotes
        </div>
      </div>

      {/* Asset Library Modal with Upload */}
      {showLibraryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-semibold">Choose or Upload Image</h3>
              <button
                onClick={() => setShowLibraryModal(false)}
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
                onUploadComplete={handleUploadComplete}
                allowMultiple={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
