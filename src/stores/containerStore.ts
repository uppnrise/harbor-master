import { create } from 'zustand';
import type {
  Container,
  ContainerDetails,
  ContainerListOptions,
  ContainerState,
  RemoveOptions,
  PruneResult,
} from '../types/container';
import {
  listContainers,
  startContainer as startContainerService,
  stopContainer as stopContainerService,
  restartContainer as restartContainerService,
  pauseContainer as pauseContainerService,
  unpauseContainer as unpauseContainerService,
  inspectContainer as inspectContainerService,
  removeContainer as removeContainerService,
  removeContainers as removeMultipleContainers,
  pruneContainers as pruneContainersService,
  startContainers as startMultipleContainers,
  stopContainers as stopMultipleContainers,
  restartContainers as restartMultipleContainers,
  pauseContainers as pauseMultipleContainers,
  unpauseContainers as unpauseMultipleContainers,
  type BatchOperationResult,
} from '../services/containerService';
import { useRuntimeStore } from './runtimeStore';
import { applyFiltersAndSort, type SortField, type SortOrder } from '../utils/containerFilters';

interface ContainerStore {
  // State
  containers: Container[];
  selectedContainer: Container | null;
  containerDetails: ContainerDetails | null;
  loading: boolean;
  error: string | null;
  refreshInterval: number | null;
  operationInProgress: Set<string>; // Track which containers have operations in progress
  
  // Multi-selection and batch operations
  selectedContainerIds: Set<string>; // Track selected containers for batch operations
  batchOperationInProgress: boolean;
  batchOperationResults: BatchOperationResult[];
  
  // Filter and sort state
  searchTerm: string;
  stateFilter: ContainerState | 'all';
  sortField: SortField;
  sortOrder: SortOrder;

  // Actions
  fetchContainers: (options?: ContainerListOptions) => Promise<Container[]>;
  selectContainer: (container: Container | null) => void;
  fetchContainerDetails: (id: string) => Promise<ContainerDetails>;
  startContainer: (id: string) => Promise<void>;
  stopContainer: (id: string, timeout?: number) => Promise<void>;
  restartContainer: (id: string, timeout?: number) => Promise<void>;
  pauseContainer: (id: string) => Promise<void>;
  unpauseContainer: (id: string) => Promise<void>;
  removeContainer: (id: string, options?: RemoveOptions) => Promise<void>;
  removeContainers: (ids: string[], options?: RemoveOptions) => Promise<void>;
  pruneContainers: () => Promise<PruneResult>;
  setError: (error: string | null) => void;
  clearError: () => void;
  startAutoRefresh: (interval?: number) => void;
  stopAutoRefresh: () => void;
  isOperationInProgress: (id: string) => boolean;
  
  // Multi-selection actions
  toggleContainerSelection: (id: string) => void;
  selectAllContainers: () => void;
  clearSelection: () => void;
  isContainerSelected: (id: string) => boolean;
  
  // Batch operation actions
  batchStartContainers: (ids: string[]) => Promise<BatchOperationResult[]>;
  batchStopContainers: (ids: string[], timeout?: number) => Promise<BatchOperationResult[]>;
  batchRestartContainers: (ids: string[], timeout?: number) => Promise<BatchOperationResult[]>;
  batchPauseContainers: (ids: string[]) => Promise<BatchOperationResult[]>;
  batchUnpauseContainers: (ids: string[]) => Promise<BatchOperationResult[]>;
  batchRemoveContainers: (ids: string[], options?: RemoveOptions) => Promise<BatchOperationResult[]>;
  clearBatchResults: () => void;
  
  // Filter and sort actions
  setSearchTerm: (term: string) => void;
  setStateFilter: (state: ContainerState | 'all') => void;
  setSortField: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  getFilteredContainers: () => Container[];
}

export const useContainerStore = create<ContainerStore>((set, get) => ({
  // Initial state
  containers: [],
  selectedContainer: null,
  containerDetails: null,
  loading: false,
  error: null,
  refreshInterval: null,
  operationInProgress: new Set<string>(),
  
  // Multi-selection and batch initial state
  selectedContainerIds: new Set<string>(),
  batchOperationInProgress: false,
  batchOperationResults: [],
  
  // Filter and sort initial state
  searchTerm: '',
  stateFilter: 'all',
  sortField: 'name',
  sortOrder: 'asc',

    // Fetch containers list
  fetchContainers: async (options?: ContainerListOptions) => {
    set({ loading: true, error: null });
    try {
      const runtime = useRuntimeStore.getState().selectedRuntime;
      if (!runtime) {
        throw new Error('No runtime selected');
      }
      const defaultOptions: ContainerListOptions = { all: true, size: false };
      const containers = await listContainers(runtime, options || defaultOptions);
      set({ containers, loading: false });
      return containers;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to fetch containers';
      set({ error, loading: false });
      throw err;
    }
  },

  // Select a container
  selectContainer: (container: Container | null) => {
    set({ selectedContainer: container, containerDetails: null });
  },

  // Fetch detailed information for a container
  fetchContainerDetails: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const runtime = useRuntimeStore.getState().selectedRuntime;
      if (!runtime) {
        throw new Error('No runtime selected');
      }
      const details = await inspectContainerService(runtime, id);
      set({ containerDetails: details, loading: false });
      return details;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to fetch container details';
      set({ error, loading: false });
      throw err;
    }
  },

  // Start a container
  startContainer: async (id: string) => {
    const { operationInProgress } = get();
    if (operationInProgress.has(id)) {
      return; // Operation already in progress
    }
    
    set({ 
      operationInProgress: new Set(operationInProgress).add(id),
      error: null 
    });
    
    try {
      const runtime = useRuntimeStore.getState().selectedRuntime;
      if (!runtime) {
        throw new Error('No runtime selected');
      }
      await startContainerService(runtime, id);
      
      const current = get().operationInProgress;
      const updated = new Set(current);
      updated.delete(id);
      set({ operationInProgress: updated });
      
      // Refresh the container list
      await get().fetchContainers();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to start container';
      const current = get().operationInProgress;
      const updated = new Set(current);
      updated.delete(id);
      set({ error, operationInProgress: updated });
      throw err;
    }
  },

  // Stop a container
  stopContainer: async (id: string, timeout?: number) => {
    const { operationInProgress } = get();
    if (operationInProgress.has(id)) {
      return; // Operation already in progress
    }
    
    set({ 
      operationInProgress: new Set(operationInProgress).add(id),
      error: null 
    });
    
    try {
      const runtime = useRuntimeStore.getState().selectedRuntime;
      if (!runtime) {
        throw new Error('No runtime selected');
      }
      await stopContainerService(runtime, id, timeout);
      
      const current = get().operationInProgress;
      const updated = new Set(current);
      updated.delete(id);
      set({ operationInProgress: updated });
      
      // Refresh the container list
      await get().fetchContainers();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to stop container';
      const current = get().operationInProgress;
      const updated = new Set(current);
      updated.delete(id);
      set({ error, operationInProgress: updated });
      throw err;
    }
  },

  // Restart a container
  restartContainer: async (id: string, timeout?: number) => {
    const { operationInProgress } = get();
    if (operationInProgress.has(id)) {
      return; // Operation already in progress
    }
    
    set({ 
      operationInProgress: new Set(operationInProgress).add(id),
      error: null 
    });
    
    try {
      const runtime = useRuntimeStore.getState().selectedRuntime;
      if (!runtime) {
        throw new Error('No runtime selected');
      }
      await restartContainerService(runtime, id, timeout);
      
      const current = get().operationInProgress;
      const updated = new Set(current);
      updated.delete(id);
      set({ operationInProgress: updated });
      
      // Refresh the container list
      await get().fetchContainers();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to restart container';
      const current = get().operationInProgress;
      const updated = new Set(current);
      updated.delete(id);
      set({ error, operationInProgress: updated });
      throw err;
    }
  },

  // Pause a container
  pauseContainer: async (id: string) => {
    const { operationInProgress } = get();
    if (operationInProgress.has(id)) {
      return; // Operation already in progress
    }
    
    set({ 
      operationInProgress: new Set(operationInProgress).add(id),
      error: null 
    });
    
    try {
      const runtime = useRuntimeStore.getState().selectedRuntime;
      if (!runtime) {
        throw new Error('No runtime selected');
      }
      await pauseContainerService(runtime, id);
      
      const current = get().operationInProgress;
      const updated = new Set(current);
      updated.delete(id);
      set({ operationInProgress: updated });
      
      // Refresh the container list
      await get().fetchContainers();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to pause container';
      const current = get().operationInProgress;
      const updated = new Set(current);
      updated.delete(id);
      set({ error, operationInProgress: updated });
      throw err;
    }
  },

  // Unpause a container
  unpauseContainer: async (id: string) => {
    const { operationInProgress } = get();
    if (operationInProgress.has(id)) {
      return; // Operation already in progress
    }
    
    set({ 
      operationInProgress: new Set(operationInProgress).add(id),
      error: null 
    });
    
    try {
      const runtime = useRuntimeStore.getState().selectedRuntime;
      if (!runtime) {
        throw new Error('No runtime selected');
      }
      await unpauseContainerService(runtime, id);
      
      const current = get().operationInProgress;
      const updated = new Set(current);
      updated.delete(id);
      set({ operationInProgress: updated });
      
      // Refresh the container list
      await get().fetchContainers();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to unpause container';
      const current = get().operationInProgress;
      const updated = new Set(current);
      updated.delete(id);
      set({ error, operationInProgress: updated });
      throw err;
    }
  },

  // Remove a single container
  removeContainer: async (id: string, options?: RemoveOptions) => {
    set({ loading: true, error: null });
    try {
      const runtime = useRuntimeStore.getState().selectedRuntime;
      if (!runtime) {
        throw new Error('No runtime selected');
      }
      await removeContainerService(
        runtime,
        id,
        options?.force || false,
        options?.volumes || false
      );
      set({ loading: false });
      // Clear selected container if it was removed
      const { selectedContainer } = get();
      if (selectedContainer?.id === id) {
        set({ selectedContainer: null, containerDetails: null });
      }
      // Refresh the container list
      await get().fetchContainers();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to remove container';
      set({ error, loading: false });
      throw err;
    }
  },

  // Remove multiple containers
  removeContainers: async (ids: string[], options?: RemoveOptions) => {
    set({ loading: true, error: null });
    try {
      const runtime = useRuntimeStore.getState().selectedRuntime;
      if (!runtime) {
        throw new Error('No runtime selected');
      }
      await removeMultipleContainers(
        runtime,
        ids,
        options?.force || false,
        options?.volumes || false
      );
      set({ loading: false });
      // Clear selected container if it was in the removed list
      const { selectedContainer } = get();
      if (selectedContainer && ids.includes(selectedContainer.id)) {
        set({ selectedContainer: null, containerDetails: null });
      }
      // Refresh the container list
      await get().fetchContainers();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to remove containers';
      set({ error, loading: false });
      throw err;
    }
  },

  // Prune stopped containers
  pruneContainers: async () => {
    set({ loading: true, error: null });
    try {
      const runtime = useRuntimeStore.getState().selectedRuntime;
      if (!runtime) {
        throw new Error('No runtime selected');
      }
      const result = await pruneContainersService(runtime);
      set({ loading: false });
      // Refresh the container list
      await get().fetchContainers();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to prune containers';
      set({ error, loading: false });
      throw err;
    }
  },

  // Set error message
  setError: (error: string | null) => {
    set({ error });
  },

  // Clear error message
  clearError: () => {
    set({ error: null });
  },

  // Start auto-refresh
  startAutoRefresh: (intervalMs: number = 5000) => {
    const { refreshInterval } = get();
    // Stop existing interval if any
    if (refreshInterval !== null) {
      window.clearInterval(refreshInterval);
    }
    // Start new interval
    const id = window.setInterval(() => {
      get().fetchContainers().catch(() => {
        // Silently fail on auto-refresh errors
      });
    }, intervalMs);
    set({ refreshInterval: id });
  },

  // Stop auto-refresh
  stopAutoRefresh: () => {
    const { refreshInterval } = get();
    if (refreshInterval !== null) {
      window.clearInterval(refreshInterval);
      set({ refreshInterval: null });
    }
  },

  // Check if an operation is in progress for a container
  isOperationInProgress: (id: string) => {
    return get().operationInProgress.has(id);
  },
  
  // Filter and sort methods
  setSearchTerm: (term: string) => {
    set({ searchTerm: term });
  },
  
  setStateFilter: (state: ContainerState | 'all') => {
    set({ stateFilter: state });
  },
  
  setSortField: (field: SortField) => {
    set({ sortField: field });
  },
  
  setSortOrder: (order: SortOrder) => {
    set({ sortOrder: order });
  },
  
  getFilteredContainers: () => {
    const { containers, searchTerm, stateFilter, sortField, sortOrder } = get();
    return applyFiltersAndSort(containers, searchTerm, stateFilter, sortField, sortOrder);
  },
  
  // Multi-selection methods
  toggleContainerSelection: (id: string) => {
    const selectedContainerIds = new Set(get().selectedContainerIds);
    if (selectedContainerIds.has(id)) {
      selectedContainerIds.delete(id);
    } else {
      selectedContainerIds.add(id);
    }
    set({ selectedContainerIds });
  },
  
  selectAllContainers: () => {
    const containers = get().getFilteredContainers();
    const selectedContainerIds = new Set(containers.map(c => c.id));
    set({ selectedContainerIds });
  },
  
  clearSelection: () => {
    set({ selectedContainerIds: new Set<string>() });
  },
  
  isContainerSelected: (id: string) => {
    return get().selectedContainerIds.has(id);
  },
  
  // Batch operation methods
  batchStartContainers: async (ids: string[]) => {
    set({ batchOperationInProgress: true, batchOperationResults: [], error: null });
    try {
      const runtime = useRuntimeStore.getState().selectedRuntime;
      if (!runtime) {
        throw new Error('No runtime selected');
      }
      const results = await startMultipleContainers(runtime, ids);
      set({ batchOperationInProgress: false, batchOperationResults: results });
      // Refresh the container list
      await get().fetchContainers();
      return results;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to start containers';
      set({ error, batchOperationInProgress: false });
      throw err;
    }
  },
  
  batchStopContainers: async (ids: string[], timeout?: number) => {
    set({ batchOperationInProgress: true, batchOperationResults: [], error: null });
    try {
      const runtime = useRuntimeStore.getState().selectedRuntime;
      if (!runtime) {
        throw new Error('No runtime selected');
      }
      const results = await stopMultipleContainers(runtime, ids, timeout);
      set({ batchOperationInProgress: false, batchOperationResults: results });
      // Refresh the container list
      await get().fetchContainers();
      return results;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to stop containers';
      set({ error, batchOperationInProgress: false });
      throw err;
    }
  },
  
  batchRestartContainers: async (ids: string[], timeout?: number) => {
    set({ batchOperationInProgress: true, batchOperationResults: [], error: null });
    try {
      const runtime = useRuntimeStore.getState().selectedRuntime;
      if (!runtime) {
        throw new Error('No runtime selected');
      }
      const results = await restartMultipleContainers(runtime, ids, timeout);
      set({ batchOperationInProgress: false, batchOperationResults: results });
      // Refresh the container list
      await get().fetchContainers();
      return results;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to restart containers';
      set({ error, batchOperationInProgress: false });
      throw err;
    }
  },
  
  batchPauseContainers: async (ids: string[]) => {
    set({ batchOperationInProgress: true, batchOperationResults: [], error: null });
    try {
      const runtime = useRuntimeStore.getState().selectedRuntime;
      if (!runtime) {
        throw new Error('No runtime selected');
      }
      const results = await pauseMultipleContainers(runtime, ids);
      set({ batchOperationInProgress: false, batchOperationResults: results });
      // Refresh the container list
      await get().fetchContainers();
      return results;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to pause containers';
      set({ error, batchOperationInProgress: false });
      throw err;
    }
  },
  
  batchUnpauseContainers: async (ids: string[]) => {
    set({ batchOperationInProgress: true, batchOperationResults: [], error: null });
    try {
      const runtime = useRuntimeStore.getState().selectedRuntime;
      if (!runtime) {
        throw new Error('No runtime selected');
      }
      const results = await unpauseMultipleContainers(runtime, ids);
      set({ batchOperationInProgress: false, batchOperationResults: results });
      // Refresh the container list
      await get().fetchContainers();
      return results;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to unpause containers';
      set({ error, batchOperationInProgress: false });
      throw err;
    }
  },
  
  batchRemoveContainers: async (ids: string[], options?: RemoveOptions) => {
    set({ batchOperationInProgress: true, batchOperationResults: [], error: null });
    try {
      const runtime = useRuntimeStore.getState().selectedRuntime;
      if (!runtime) {
        throw new Error('No runtime selected');
      }
      // Use existing removeContainers which already handles batch removal
      await removeMultipleContainers(
        runtime,
        ids,
        options?.force || false,
        options?.volumes || false
      );
      // Convert to BatchOperationResult format
      const results: BatchOperationResult[] = ids.map(id => ({
        id,
        success: true,
        error: undefined,
      }));
      set({ batchOperationInProgress: false, batchOperationResults: results });
      // Clear selected container if it was in the removed list
      const { selectedContainer } = get();
      if (selectedContainer && ids.includes(selectedContainer.id)) {
        set({ selectedContainer: null, containerDetails: null });
      }
      // Refresh the container list
      await get().fetchContainers();
      return results;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to remove containers';
      // On error, mark all as failed
      const results: BatchOperationResult[] = ids.map(id => ({
        id,
        success: false,
        error: error,
      }));
      set({ error, batchOperationInProgress: false, batchOperationResults: results });
      throw err;
    }
  },
  
  clearBatchResults: () => {
    set({ batchOperationResults: [] });
  },
}));
