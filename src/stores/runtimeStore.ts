import { create } from 'zustand';
import type { Runtime, RuntimeStatus } from '../types/runtime';

/**
 * Runtime store state interface
 * Manages detected container runtimes, selection, and detection state
 */
interface RuntimeState {
  // State
  /** Array of all detected container runtimes */
  runtimes: Runtime[];
  /** Currently selected runtime for operations */
  selectedRuntime: Runtime | null;
  /** Whether runtime detection is currently in progress */
  isDetecting: boolean;
  /** Error message if detection or runtime operations failed */
  error: string | null;

  // Actions
  /** Sets the list of detected runtimes */
  setRuntimes: (runtimes: Runtime[]) => void;
  /** Sets the currently selected runtime */
  setSelectedRuntime: (runtime: Runtime | null) => void;
  /** Sets the detection loading state */
  setDetecting: (isDetecting: boolean) => void;
  /** Sets an error message */
  setError: (error: string | null) => void;
  /** Updates the status of a specific runtime by ID */
  updateRuntimeStatus: (runtimeId: string, status: RuntimeStatus, timestamp: string, error?: string) => void;
  /** Adds a new runtime to the list */
  addRuntime: (runtime: Runtime) => void;
  /** Removes a runtime from the list by ID */
  removeRuntime: (runtimeId: string) => void;
  /** Clears all runtimes and selection */
  clearRuntimes: () => void;
}

/**
 * Zustand store for managing container runtime state
 * 
 * Handles:
 * - List of detected Docker and Podman runtimes
 * - Currently selected runtime
 * - Detection loading state
 * - Error states
 * - Runtime status updates from polling
 * 
 * @example
 * ```tsx
 * const { runtimes, selectedRuntime, setSelectedRuntime } = useRuntimeStore();
 * ```
 */
export const useRuntimeStore = create<RuntimeState>((set) => ({
  // Initial state
  runtimes: [],
  selectedRuntime: null,
  isDetecting: false,
  error: null,

  // Actions
  setRuntimes: (runtimes) => set({ runtimes }),

  setSelectedRuntime: (runtime) => set({ selectedRuntime: runtime }),

  setDetecting: (isDetecting) => set({ isDetecting }),

  setError: (error) => set({ error }),

  updateRuntimeStatus: (runtimeId, status, timestamp, errorMsg) =>
    set((state) => ({
      runtimes: state.runtimes.map((runtime) => {
        if (runtime.id === runtimeId) {
          const updated: Runtime = {
            ...runtime,
            status,
            lastChecked: timestamp,
          };
          if (errorMsg) {
            updated.error = errorMsg;
          }
          return updated;
        }
        return runtime;
      }),
      selectedRuntime:
        state.selectedRuntime?.id === runtimeId && state.selectedRuntime
          ? (() => {
              const updated: Runtime = {
                ...state.selectedRuntime,
                status,
                lastChecked: timestamp,
              };
              if (errorMsg) {
                updated.error = errorMsg;
              }
              return updated;
            })()
          : state.selectedRuntime,
    })),

  addRuntime: (runtime) =>
    set((state) => ({
      runtimes: [...state.runtimes, runtime],
    })),

  removeRuntime: (runtimeId) =>
    set((state) => ({
      runtimes: state.runtimes.filter((r) => r.id !== runtimeId),
      selectedRuntime: state.selectedRuntime?.id === runtimeId ? null : state.selectedRuntime,
    })),

  clearRuntimes: () =>
    set({
      runtimes: [],
      selectedRuntime: null,
    }),
}));
