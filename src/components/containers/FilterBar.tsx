import { memo } from 'react';
import { ContainerState } from '../../types/container';
import type { SortField } from '../../utils/containerFilters';

export interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  stateFilter: ContainerState | 'all';
  onStateFilterChange: (state: ContainerState | 'all') => void;
  sortField: SortField;
  onSortFieldChange: (field: SortField) => void;
}

/**
 * FilterBar component for filtering and sorting containers
 * Matches the clean, simple layout of the Images tab
 */
export const FilterBar = memo(function FilterBar({
  searchTerm,
  onSearchChange,
  stateFilter,
  onStateFilterChange,
  sortField,
  onSortFieldChange,
}: FilterBarProps) {
  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex gap-4">
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
        
        {/* State Filter */}
        <select
          value={stateFilter}
          onChange={(e) => onStateFilterChange(e.target.value as ContainerState | 'all')}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="all">All States</option>
          <option value="running">Running</option>
          <option value="exited">Exited</option>
          <option value="paused">Paused</option>
          <option value="created">Created</option>
          <option value="restarting">Restarting</option>
          <option value="removing">Removing</option>
          <option value="dead">Dead</option>
        </select>

        {/* Sort By */}
        <select
          value={sortField}
          onChange={(e) => onSortFieldChange(e.target.value as SortField)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="name">Sort: Name</option>
          <option value="state">Sort: State</option>
          <option value="created">Sort: Created</option>
          <option value="image">Sort: Image</option>
        </select>
      </div>
    </div>
  );
});
