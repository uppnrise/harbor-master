import { create } from 'zustand';
import type { Runtime, RuntimeStatus } from '../types/runtime';

interface RuntimeState {
  // State
  runtimes: Runtime[];
  selectedRuntime: Runtime | null;
  isDetecting: boolean;
  error: string | null;

  // Actions
  setRuntimes: (runtimes: Runtime[]) => void;
  setSelectedRuntime: (runtime: Runtime | null) => void;
  setDetecting: (isDetecting: boolean) => void;
  setError: (error: string | null) => void;
  updateRuntimeStatus: (runtimeId: string, status: RuntimeStatus, timestamp: string, error?: string) => void;
  addRuntime: (runtime: Runtime) => void;
  removeRuntime: (runtimeId: string) => void;
  clearRuntimes: () => void;
}

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
