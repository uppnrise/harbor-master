import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { useRuntimeStore } from '../stores/runtimeStore';
import type { StatusUpdate } from '../types/runtime';

/**
 * Hook to manage runtime status polling
 * 
 * Automatically starts polling for runtime status updates when runtimes are detected.
 * Listens for status update events from the backend and updates the store accordingly.
 * Polling runs every 5 seconds and checks if Docker/Podman daemons are running.
 * 
 * Lifecycle:
 * - Starts polling when runtimes.length > 0
 * - Stops polling on component unmount
 * - Cleans up event listeners on unmount
 * 
 * @returns Object containing isActive flag indicating if polling is active
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { isActive } = useRuntimeStatus();
 *   // Polling automatically starts when runtimes are detected
 * }
 * ```
 */
export function useRuntimeStatus() {
  const { runtimes, updateRuntimeStatus } = useRuntimeStore();

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    // Start polling when we have runtimes
    if (runtimes.length > 0) {
      // Start the polling service
      invoke('start_status_polling').catch((err) => {
        console.error('Failed to start status polling:', err);
      });

      // Listen for status updates
      listen<StatusUpdate>('runtime-status-update', (event) => {
        const update = event.payload;
        // Convert timestamp from ISO string to Date if needed
        const timestamp = typeof update.timestamp === 'string' 
          ? update.timestamp 
          : new Date(update.timestamp).toISOString();
        updateRuntimeStatus(update.runtimeId, update.status, timestamp);
      }).then((fn) => {
        unlisten = fn;
      });
    }

    // Cleanup: stop polling and remove listener
    return () => {
      if (unlisten) {
        unlisten();
      }
      invoke('stop_status_polling').catch((err) => {
        console.error('Failed to stop status polling:', err);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runtimes.length]); // Re-run when number of runtimes changes

  return {
    isActive: runtimes.length > 0,
  };
}
