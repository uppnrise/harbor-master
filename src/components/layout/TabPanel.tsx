import { memo, useState } from 'react';

export interface Tab {
  /** Unique identifier for the tab */
  id: string;
  /** Tab label */
  label: string;
  /** Tab content */
  content: React.ReactNode;
  /** Optional badge count */
  badge?: number;
}

interface TabPanelProps {
  /** Array of tabs */
  tabs: Tab[];
  /** Optional default active tab ID */
  defaultTab?: string;
}

/**
 * TabPanel - A tabbed interface component
 * 
 * Features:
 * - Multiple tabs with smooth transitions
 * - Active tab highlighting
 * - Optional badge counts
 * - Keyboard navigation (arrow keys)
 * - Accessible (ARIA labels)
 */
export const TabPanel = memo(function TabPanel({ tabs, defaultTab }: TabPanelProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowLeft' && index > 0) {
      const prevTab = tabs[index - 1];
      if (prevTab) setActiveTab(prevTab.id);
    } else if (e.key === 'ArrowRight' && index < tabs.length - 1) {
      const nextTab = tabs[index + 1];
      if (nextTab) setActiveTab(nextTab.id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab Headers */}
      <div
        className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        role="tablist"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
              px-4 py-3 text-sm font-medium transition-colors relative
              ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-blue-600 dark:bg-blue-500 rounded-full min-w-[20px]">
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            hidden={activeTab !== tab.id}
            className={activeTab === tab.id ? 'h-full' : ''}
          >
            {activeTab === tab.id && tab.content}
          </div>
        ))}
      </div>
    </div>
  );
});
