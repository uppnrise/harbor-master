/**
 * Container filtering and sorting utilities
 */
import { Container, ContainerState } from '../types/container';

/**
 * Filter containers by search term (name or ID)
 */
export function filterBySearch(containers: Container[], searchTerm: string): Container[] {
  if (!searchTerm.trim()) {
    return containers;
  }

  const term = searchTerm.toLowerCase();
  return containers.filter(
    (container) =>
      container.name.toLowerCase().includes(term) ||
      container.id.toLowerCase().includes(term)
  );
}

/**
 * Filter containers by state
 */
export function filterByState(
  containers: Container[],
  state: ContainerState | 'all'
): Container[] {
  if (state === 'all') {
    return containers;
  }

  return containers.filter((container) => container.state === state);
}

/**
 * Sort order type
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Sort field type
 */
export type SortField = 'name' | 'state' | 'created' | 'image';

/**
 * Sort containers by field
 */
export function sortContainers(
  containers: Container[],
  field: SortField,
  order: SortOrder = 'asc'
): Container[] {
  const sorted = [...containers].sort((a, b) => {
    let comparison = 0;

    switch (field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'state':
        comparison = a.state.localeCompare(b.state);
        break;
      case 'created':
        comparison = a.created - b.created;
        break;
      case 'image':
        comparison = a.image.localeCompare(b.image);
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Apply all filters and sorting to containers
 */
export function applyFiltersAndSort(
  containers: Container[],
  searchTerm: string,
  stateFilter: ContainerState | 'all',
  sortField: SortField,
  sortOrder: SortOrder
): Container[] {
  let filtered = containers;

  // Apply search filter
  filtered = filterBySearch(filtered, searchTerm);

  // Apply state filter
  filtered = filterByState(filtered, stateFilter);

  // Apply sorting
  filtered = sortContainers(filtered, sortField, sortOrder);

  return filtered;
}
