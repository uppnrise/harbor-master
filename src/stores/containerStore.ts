import { create } from 'zustand';
import type {
  Container,
  ContainerDetails,
  ContainerListOptions,
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
} from '../services/containerService';
import { useRuntimeStore } from './runtimeStore';

interface ContainerStore {
  // State
  containers: Container[];
  selectedContainer: Container | null;
  containerDetails: ContainerDetails | null;
  loading: boolean;
  error: string | null;
  refreshInterval: number | null;
  operationInProgress: Set<string>; // Track which containers have operations in progress

  // Actions
  fetchContainers: (options?: ContainerListOptions) => Promise<void>;
  selectContainer: (container: Container | null) => void;
  fetchContainerDetails: (id: string) => Promise<void>;
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
  startAutoRefresh: (intervalMs?: number) => void;
  stopAutoRefresh: () => void;
  isOperationInProgress: (id: string) => boolean;
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
}));
