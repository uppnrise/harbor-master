import { useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ContainerRow } from './ContainerRow';
import { FilterBar } from './FilterBar';
import { BatchActionsBar } from './BatchActionsBar';
import ContainerDetails from './ContainerDetails';
import { useContainerStore } from '../../stores/containerStore';
import type { Container } from '../../types/container';

/**
 * ContainerList component - displays a virtualized list of containers
 * Uses @tanstack/react-virtual for efficient rendering of large lists
 */
export function ContainerList() {
  const {
    containers,
    selectedContainer,
    selectContainer,
    loading,
    error,
    fetchContainers,
    searchTerm,
    setSearchTerm,
    stateFilter,
    setStateFilter,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    getFilteredContainers,
    selectedContainerIds,
    selectAllContainers,
    clearSelection,
  } = useContainerStore();

  const parentRef = useRef<HTMLDivElement>(null);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const [detailsContainerId, setDetailsContainerId] = useState<string | null>(null);

  // Get filtered containers
  const filteredContainers = getFilteredContainers();

  // Virtual scrolling for performance with large lists
  const rowVirtualizer = useVirtualizer({
    count: filteredContainers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Estimated row height in pixels
    overscan: 10, // Render 10 extra items above/below viewport
  });

  // Fetch containers on mount
  useEffect(() => {
    fetchContainers({ all: true, size: false }).catch(() => {
      // Error handled in store
    });
  }, [fetchContainers]);

  const handleSelect = (container: Container) => {
    selectContainer(container);
    setDetailsContainerId(container.id);
    setDetailsPanelOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsPanelOpen(false);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 font-medium mb-2">
            Error loading containers
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{error}</div>
          <button
            onClick={() => fetchContainers({ all: true, size: false })}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading && containers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600 dark:text-gray-400">
          Loading containers...
        </div>
      </div>
    );
  }

  if (containers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="text-gray-600 dark:text-gray-400 mb-2">
            No containers found
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            Start a container to see it here
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[600px]">
      {/* Filter Bar */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        stateFilter={stateFilter}
        onStateFilterChange={setStateFilter}
        sortField={sortField}
        onSortFieldChange={setSortField}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        containerCount={containers.length}
        filteredCount={filteredContainers.length}
      />

      {/* Container List */}
      {filteredContainers.length === 0 ? (
        <div className="flex items-center justify-center flex-1 p-8">
          <div className="text-center">
            <div className="text-gray-600 dark:text-gray-400 mb-2">
              No containers match the current filters
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setStateFilter('all');
              }}
              className="mt-2 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
          {/* Batch Actions Bar (appears when containers are selected) */}
          <BatchActionsBar />
          
          {/* Header */}
          <div className="grid grid-cols-[48px_100px_1fr_200px_120px_100px_140px] gap-3 p-3 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 font-medium text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={filteredContainers.length > 0 && filteredContainers.every(c => selectedContainerIds.has(c.id))}
                onChange={(e) => {
                  if (e.target.checked) {
                    selectAllContainers();
                  } else {
                    clearSelection();
                  }
                }}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 focus:ring-2 border-gray-300 rounded cursor-pointer"
                title="Select all"
              />
            </div>
            <div>Status</div>
            <div>Name</div>
            <div className="hidden md:block">Image</div>
            <div className="hidden lg:block">Ports</div>
            <div className="hidden xl:block">Created</div>
            <div>Actions</div>
          </div>

          {/* Container List with Virtual Scrolling */}
          <div
            ref={parentRef}
            className="flex-1 overflow-auto"
            style={{ contain: 'strict' }}
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const container = filteredContainers[virtualRow.index];
                if (!container) return null;
                
                return (
                  <div
                    key={container.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <ContainerRow
                      container={container}
                      isSelected={selectedContainer?.id === container.id}
                      onSelect={handleSelect}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Container Details Panel */}
      {detailsContainerId && (
        <ContainerDetails
          containerId={detailsContainerId}
          isOpen={detailsPanelOpen}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
}
