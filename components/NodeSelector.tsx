import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { NODE_CONFIGS, NodeType, CATEGORY_ORDER, CATEGORY_LABELS, NodeCategory } from '@/lib/node-registry';

interface NodeSelectorProps {
  onSelect: (type: NodeType) => void;
  onClose: () => void;
  excludeTypes?: string[];
}

function getIcon(iconName: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[iconName];
  return Icon || LucideIcons.Circle;
}

export default function NodeSelector({ onSelect, onClose, excludeTypes = [] }: NodeSelectorProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Close on Escape
  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  const entries = useMemo(() => {
    const all = (Object.entries(NODE_CONFIGS) as [NodeType, typeof NODE_CONFIGS[NodeType]][])
      .filter(([type]) => !excludeTypes.includes(type));

    if (!search) return all;

    const q = search.toLowerCase();
    return all.filter(([, config]) =>
      config.label.toLowerCase().includes(q) ||
      config.description.toLowerCase().includes(q)
    );
  }, [search, excludeTypes]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Partial<Record<NodeCategory, typeof entries>> = {};
    for (const entry of entries) {
      const cat = entry[1].category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat]!.push(entry);
    }
    return groups;
  }, [entries]);

  // Flat list for keyboard nav
  const flatList = useMemo(() => {
    const list: NodeType[] = [];
    for (const cat of CATEGORY_ORDER) {
      if (grouped[cat]) {
        for (const [type] of grouped[cat]!) {
          list.push(type);
        }
      }
    }
    return list;
  }, [grouped]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Scroll selected item into view
  useEffect(() => {
    if (flatList.length === 0) return;
    const selectedType = flatList[selectedIndex];
    if (!selectedType || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-node-type="${selectedType}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, flatList]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && flatList[selectedIndex]) {
      e.preventDefault();
      onSelect(flatList[selectedIndex]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-80 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Search */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 bg-background-extra-light rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search nodes..."
              className="bg-transparent text-sm text-foreground outline-none w-full placeholder-text-placeholder"
            />
          </div>
        </div>

        {/* Node list */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto py-1">
          {flatList.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-6">No nodes found</p>
          ) : (
            CATEGORY_ORDER.map((cat) => {
              const items = grouped[cat];
              if (!items || items.length === 0) return null;
              return (
                <div key={cat}>
                  <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider px-4 pt-3 pb-1">
                    {CATEGORY_LABELS[cat]}
                  </p>
                  {items.map(([type, config]) => {
                    const Icon = getIcon(config.icon);
                    const isSelected = flatList[selectedIndex] === type;
                    return (
                      <button
                        key={type}
                        data-node-type={type}
                        onClick={() => onSelect(type)}
                        onMouseEnter={() => setSelectedIndex(flatList.indexOf(type))}
                        className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                          isSelected ? 'bg-surface-hover' : 'hover:bg-surface-hover'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-foreground-light flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{config.label}</p>
                          <p className="text-xs text-text-muted leading-tight">{config.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
