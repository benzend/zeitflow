import { useState, useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Upload failed');
      }

      // Insert image markdown at cursor position
      const imageMarkdown = `![${file.name}](${result.url})`;
      insertText(imageMarkdown);

    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toolbarButtons = [
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
      action: () => fileInputRef.current?.click(),
      className: '',
      isImageUpload: true
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
          {toolbarButtons.map((button, index) => (
            <button
              key={index}
              type="button"
              onClick={button.action}
              disabled={isUploading && (button as any).isImageUpload}
              className={`p-2 text-xs rounded hover:bg-primary/10 transition-colors text-foreground ${button.className} ${
                isUploading && (button as any).isImageUpload ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={button.label}
            >
              {isUploading && (button as any).isImageUpload ? '⏳' : button.icon}
            </button>
          ))}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageUpload}
            className="hidden"
          />
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
    </div>
  );
}