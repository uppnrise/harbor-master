import { useEffect } from 'react';
import { useContainerStore } from '../stores/containerStore';
import type { ContainerListOptions } from '../types/container';

/**
 * Custom hook for managing containers with auto-refresh
 * @param options - Container list options
 * @param autoRefresh - Enable auto-refresh (default: false)
 * @param refreshInterval - Refresh interval in milliseconds (default: 5000)
 */
export function useContainers(
  options?: ContainerListOptions,
  autoRefresh = false,
  refreshInterval = 5000
) {
  const {
    containers,
    loading,
    error,
    fetchContainers,
    startAutoRefresh,
    stopAutoRefresh,
  } = useContainerStore();

  useEffect(() => {
    // Initial fetch
    fetchContainers(options).catch(() => {
      // Error is handled in the store
    });

    // Setup auto-refresh if enabled
    if (autoRefresh) {
      startAutoRefresh(refreshInterval);
    }

    // Cleanup
    return () => {
      if (autoRefresh) {
        stopAutoRefresh();
      }
    };
  }, [
    autoRefresh,
    refreshInterval,
    fetchContainers,
    startAutoRefresh,
    stopAutoRefresh,
    options,
  ]);

  return {
    containers,
    loading,
    error,
    refresh: fetchContainers,
  };
}
