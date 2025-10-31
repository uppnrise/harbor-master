import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useRuntimeStore } from '../stores/runtimeStore';
import { StatusIndicator } from './StatusIndicator';
import { formatRuntimeVersion, getMinimumVersion } from '../utils/formatters';
import type { Runtime } from '../types/runtime';

/**
 * Dropdown selector component for choosing container runtimes
 * 
 * Features:
 * - Auto-selects runtime on initial load based on preferences
 * - Persists selection to preferences
 * - Shows runtime status, version, and mode information
 * - Displays version warnings for outdated runtimes
 * - Highlights WSL2 installations
 * 
 * Selection priority:
 * 1. Previously selected runtime (if still available)
 * 2. Running runtime
 * 3. Preferred runtime type from preferences
 * 4. First detected runtime
 * 
 * @returns Runtime selector dropdown UI
 * 
 * @example
 * ```tsx
 * <RuntimeSelector />
 * ```
 */
export function RuntimeSelector() {
  const { runtimes, selectedRuntime, setSelectedRuntime } = useRuntimeStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Auto-select runtime on initial load
    if (runtimes.length > 0 && !selectedRuntime) {
      autoSelectRuntime();
    }

    // Listen for runtime-selected events
    const unlisten = listen<string>('runtime-selected', (event) => {
      const runtime = runtimes.find((r) => r.id === event.payload);
      if (runtime) {
        setSelectedRuntime(runtime);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runtimes, selectedRuntime]);

  const autoSelectRuntime = async () => {
    if (runtimes.length === 0) return;

    // Load preferences to check for last selected runtime
    const prefs = await invoke<{ selectedRuntimeId?: string; preferredType?: string }>(
      'get_runtime_preferences'
    );

    let selected: Runtime | null = null;

    // 1. Try to use last selected runtime if it still exists
    if (prefs.selectedRuntimeId) {
      selected = runtimes.find((r) => r.id === prefs.selectedRuntimeId) || null;
    }

    // 2. If no previous selection, prefer running runtime
    if (!selected) {
      selected = runtimes.find((r) => r.status === 'running') || null;
    }

    // 3. Prefer Docker over Podman if both available
    if (!selected && prefs.preferredType) {
      selected = runtimes.find((r) => r.type === prefs.preferredType) || null;
    }

    // 4. Fall back to first detected runtime
    if (!selected && runtimes.length > 0) {
      selected = runtimes[0] || null;
    }

    if (selected) {
      handleSelect(selected);
    }
  };

  const handleSelect = async (runtime: Runtime) => {
    setSelectedRuntime(runtime);
    setIsOpen(false);

    // Persist selection
    try {
      await invoke('select_runtime', { runtimeId: runtime.id });
    } catch (err) {
      console.error('Failed to persist runtime selection:', err);
    }
  };

  const getRuntimeIcon = (type: string) => {
    return type === 'docker' ? '🐳' : '🦭';
  };

  if (runtimes.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 flex items-center justify-between hover:border-blue-500 transition-colors"
      >
        {selectedRuntime ? (
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getRuntimeIcon(selectedRuntime.type)}</span>
            <div className="text-left flex-1">
              <div className="font-semibold text-white flex items-center space-x-2">
                <span>{formatRuntimeVersion(selectedRuntime)}</span>
                {selectedRuntime.versionWarning && (
                  <span
                    className="text-yellow-400 text-sm"
                    title={`Version below minimum (${getMinimumVersion(selectedRuntime.type)} required)`}
                  >
                    ⚠️
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-400 flex items-center space-x-2">
                <StatusIndicator status={selectedRuntime.status} size="sm" />
                <span className="capitalize">{selectedRuntime.status}</span>
                {selectedRuntime.mode && (
                  <span className="text-gray-500">• {selectedRuntime.mode}</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-gray-400">Select a runtime</span>
        )}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          {runtimes.map((runtime) => (
            <button
              key={runtime.id}
              onClick={() => handleSelect(runtime)}
              className={`w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-700 transition-colors ${
                selectedRuntime?.id === runtime.id ? 'bg-gray-700/50' : ''
              }`}
            >
              <span className="text-2xl">{getRuntimeIcon(runtime.type)}</span>
              <div className="flex-1 text-left">
                <div className="font-semibold text-white flex items-center space-x-2">
                  <span>{formatRuntimeVersion(runtime)}</span>
                  {runtime.versionWarning && (
                    <span
                      className="text-yellow-400 text-sm"
                      title={`Version below minimum (${getMinimumVersion(runtime.type)} required)`}
                    >
                      ⚠️
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-400 flex items-center space-x-2">
                  <StatusIndicator status={runtime.status} size="sm" />
                  <span className="capitalize">{runtime.status}</span>
                  {runtime.mode && <span className="text-gray-500">• {runtime.mode}</span>}
                  {runtime.isWsl && <span className="text-yellow-400">• WSL2</span>}
                </div>
                <div className="text-xs text-gray-500 mt-1 truncate">{runtime.path}</div>
              </div>
              {selectedRuntime?.id === runtime.id && (
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
