/**
 * ImageList component
 * Displays a list of container images with filtering and sorting
 */

import { useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ImageRow } from './ImageRow';
import { useImageStore } from '../../stores/imageStore';
import { filterImages, sortImages, type ImageSortField, type SortDirection } from '../../utils/imageFilters';
import { useRuntimeStore } from '../../stores/runtimeStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export function ImageList() {
  const {
    images,
    isLoading,
    error,
    loadImages,
    removeImages,
    searchQuery,
    setSearchQuery,
    filterTags,
    setFilterTags,
    selectedImageIds,
    selectImage,
    deselectImage,
    selectAllImages,
    deselectAllImages,
  } = useImageStore();

  const { selectedRuntime } = useRuntimeStore();
  const parentRef = useRef<HTMLDivElement>(null);

  const [sortBy, setSortBy] = useState<ImageSortField>('repository');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [forceRemove, setForceRemove] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter and sort images
  const filteredAndSortedImages = sortImages(
    filterImages(images, searchQuery, filterTags),
    sortBy,
    sortDirection
  );

  // Virtual scrolling for performance
  const rowVirtualizer = useVirtualizer({
    count: filteredAndSortedImages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // Fixed row height
    overscan: 5,
  });

  // Load images on mount or when runtime changes
  useEffect(() => {
    if (selectedRuntime) {
      loadImages(selectedRuntime).catch(() => {
        // Error handled in store
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRuntime?.id]); // Only re-run when runtime ID changes

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectedImageIds.size === filteredAndSortedImages.length) {
      deselectAllImages();
    } else {
      selectAllImages(filteredAndSortedImages.map((img) => img.id));
    }
  };

  const isAllSelected =
    filteredAndSortedImages.length > 0 &&
    selectedImageIds.size === filteredAndSortedImages.length;

  // Handle remove images
  const handleRemoveClick = () => {
    setShowRemoveDialog(true);
  };

  const handleRemoveConfirm = async () => {
    if (!selectedRuntime) return;

    setIsRemoving(true);
    try {
      const imageIds = Array.from(selectedImageIds);
      await removeImages(selectedRuntime, imageIds, forceRemove);
      setSuccessMessage(
        `Successfully removed ${imageIds.length} image${imageIds.length !== 1 ? 's' : ''}`
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      // Error handled in store
    } finally {
      setIsRemoving(false);
      setShowRemoveDialog(false);
      setForceRemove(false);
    }
  };

  const handleRemoveCancel = () => {
    setShowRemoveDialog(false);
    setForceRemove(false);
  };

  // Get images that are in use
  const selectedImagesInUse = Array.from(selectedImageIds)
    .map((id) => images.find((img) => img.id === id))
    .filter((img) => img && img.containers > 0);

  const removeDialogMessage = selectedImagesInUse.length > 0
    ? `${selectedImagesInUse.length} of the selected images are in use by containers.\n\n${
        forceRemove
          ? 'Force removal will stop and remove those containers.'
          : 'Enable "Force" to remove them anyway.'
      }\n\nAre you sure you want to remove ${selectedImageIds.size} image${
        selectedImageIds.size !== 1 ? 's' : ''
      }?`
    : `Are you sure you want to remove ${selectedImageIds.size} image${
        selectedImageIds.size !== 1 ? 's' : ''
      }?`;

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 font-medium mb-2">
            Error loading images
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{error}</div>
          {selectedRuntime && (
            <button
              onClick={() => loadImages(selectedRuntime)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!selectedRuntime) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center text-gray-600 dark:text-gray-400">
          No runtime selected. Please select a Docker or Podman runtime.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          <select
            value={filterTags}
            onChange={(e) => setFilterTags(e.target.value as 'all' | 'tagged' | 'dangling')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Images</option>
            <option value="tagged">Tagged</option>
            <option value="dangling">Dangling</option>
          </select>
        </div>
      </div>

      {/* Actions Toolbar */}
      {selectedImageIds.size > 0 && (
        <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-900 dark:text-blue-100">
              {selectedImageIds.size} image{selectedImageIds.size !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRemoveClick}
                disabled={isRemoving}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
          <div className="text-sm text-green-900 dark:text-green-100">
            {successMessage}
          </div>
        </div>
      )}

      {/* Image List */}
      <div ref={parentRef} className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-600 dark:text-gray-400">Loading images...</div>
          </div>
        ) : filteredAndSortedImages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-600 dark:text-gray-400">
              {searchQuery || filterTags !== 'all'
                ? 'No images match your filters'
                : 'No images found'}
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-[48px_200px_150px_120px_1fr] gap-4 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                <div>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    aria-label="Select all images"
                  />
                </div>
                <div className="cursor-pointer" onClick={() => {
                  if (sortBy === 'repository') {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('repository');
                    setSortDirection('asc');
                  }
                }}>
                  Repository {sortBy === 'repository' && (sortDirection === 'asc' ? '↑' : '↓')}
                </div>
                <div className="cursor-pointer" onClick={() => {
                  if (sortBy === 'tag') {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('tag');
                    setSortDirection('asc');
                  }
                }}>
                  Tag {sortBy === 'tag' && (sortDirection === 'asc' ? '↑' : '↓')}
                </div>
                <div className="cursor-pointer" onClick={() => {
                  if (sortBy === 'size') {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('size');
                    setSortDirection('desc');
                  }
                }}>
                  Size {sortBy === 'size' && (sortDirection === 'asc' ? '↑' : '↓')}
                </div>
                <div className="cursor-pointer" onClick={() => {
                  if (sortBy === 'created') {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('created');
                    setSortDirection('desc');
                  }
                }}>
                  Created {sortBy === 'created' && (sortDirection === 'asc' ? '↑' : '↓')}
                </div>
              </div>
            </div>

            {/* Virtual List */}
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const image = filteredAndSortedImages[virtualRow.index];
                
                if (!image) {
                  return null;
                }
                
                const isSelected = selectedImageIds.has(image.id);

                return (
                  <div
                    key={image.id}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <ImageRow
                      image={image}
                      isSelected={isSelected}
                      onSelect={(id: string) =>
                        isSelected ? deselectImage(id) : selectImage(id)
                      }
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Remove Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRemoveDialog}
        title="Remove Images"
        message={removeDialogMessage}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        isLoading={isRemoving}
        onConfirm={handleRemoveConfirm}
        onCancel={handleRemoveCancel}
      />

      {/* Force Checkbox in Dialog (if images in use) */}
      {showRemoveDialog && selectedImagesInUse.length > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
          <label className="flex items-center gap-2 text-white cursor-pointer">
            <input
              type="checkbox"
              checked={forceRemove}
              onChange={(e) => setForceRemove(e.target.checked)}
              className="h-4 w-4 rounded border-gray-600 text-blue-600"
            />
            <span>Force removal (will remove containers using these images)</span>
          </label>
        </div>
      )}
    </div>
  );
}
