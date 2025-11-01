/**
 * Image filtering and sorting utilities
 */

import type { Image } from '../types/image';
import { isDanglingImage } from '../types/image';

export type ImageFilterTag = 'all' | 'tagged' | 'dangling';
export type ImageSortField = 'repository' | 'tag' | 'size' | 'created';
export type SortDirection = 'asc' | 'desc';

/**
 * Filter images based on search query and tag filter
 */
export function filterImages(
  images: Image[],
  searchQuery: string,
  filterTag: ImageFilterTag
): Image[] {
  let filtered = images;

  // Apply tag filter
  if (filterTag === 'tagged') {
    filtered = filtered.filter((img) => !isDanglingImage(img));
  } else if (filterTag === 'dangling') {
    filtered = filtered.filter((img) => isDanglingImage(img));
  }

  // Apply search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (img) =>
        img.repository.toLowerCase().includes(query) ||
        img.tag.toLowerCase().includes(query) ||
        img.id.toLowerCase().includes(query)
    );
  }

  return filtered;
}

/**
 * Sort images by specified field and direction
 */
export function sortImages(
  images: Image[],
  sortBy: ImageSortField,
  direction: SortDirection
): Image[] {
  const sorted = [...images];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'repository':
        comparison = a.repository.localeCompare(b.repository);
        break;
      case 'tag':
        comparison = a.tag.localeCompare(b.tag);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'created':
        comparison = new Date(a.created).getTime() - new Date(b.created).getTime();
        break;
    }

    return direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
