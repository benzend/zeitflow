interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'pill' | 'underline';
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, variant = 'pill', className = '' }: TabsProps) {
  if (variant === 'underline') {
    return (
      <div className={`border-b border-foreground/20 ${className}`} role="tablist">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-foreground border-foreground'
                  : 'text-foreground-light border-transparent hover:text-foreground hover:border-foreground/50'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-background-light">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex bg-background-light rounded-lg p-1 ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`tabpanel-${tab.id}`}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'bg-background-extra-light text-foreground shadow-sm'
              : 'text-foreground-light hover:text-foreground'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-2">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
