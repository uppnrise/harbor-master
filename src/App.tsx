import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, emit } from '@tauri-apps/api/event';
import { useRuntimeStore } from './stores/runtimeStore';
import { useRuntimeStatus } from './hooks/useRuntimeStatus';
import { WelcomeScreen } from './components/WelcomeScreen';
import { RuntimeSelector } from './components/RuntimeSelector';
import { NoRuntimesMessage } from './components/NoRuntimesMessage';
import { RuntimeError } from './components/RuntimeError';
import { Toast } from './components/Toast';
import { formatRelativeTime } from './utils/formatters';
import type { DetectionResult } from './types/runtime';

/**
 * Toast notification state
 */
interface ToastState {
  /** Message to display */
  message: string;
  /** Toast type (affects color and icon) */
  type: 'success' | 'error' | 'info';
  /** Whether toast is currently visible */
  show: boolean;
}

/**
 * Main application component for HarborMaster
 * 
 * Features:
 * - Automatic runtime detection on startup
 * - Manual refresh via menu (Cmd/Ctrl+R keyboard shortcut)
 * - Welcome screen during initial detection
 * - Runtime status polling for selected runtime
 * - Toast notifications for detection results
 * - Error handling with troubleshooting UI
 * - Empty state with installation links
 * 
 * Event listeners:
 * - `detection-completed`: Updates runtime list when detection finishes
 * - `menu-refresh`: Triggers manual detection from menu
 * - Keyboard shortcut: Cmd/Ctrl+R for refresh
 * 
 * @returns Main application UI
 */
function App() {
  const { isDetecting, error, runtimes, selectedRuntime, setRuntimes, setDetecting, setError, setSelectedRuntime } = useRuntimeStore();
  const [showWelcome, setShowWelcome] = useState(true);
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', show: false });
  
  // Start status polling when runtimes are detected
  useRuntimeStatus();

  useEffect(() => {
    console.log('HarborMaster initialized');

    // Start detection immediately
    detectRuntimes();

    // Listen for detection events
    const unlisten = listen<DetectionResult>('detection-completed', (event) => {
      console.log('Detection completed:', event.payload);
      setRuntimes(event.payload.runtimes);
      setDetecting(false);
    });

    // Listen for menu refresh event
    const unlistenMenu = listen('menu-refresh', () => {
      console.log('Refresh from menu');
      detectRuntimes(true);
    });

    // Add keyboard shortcut for refresh (Cmd/Ctrl+R)
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        detectRuntimes(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      unlisten.then((fn) => fn());
      unlistenMenu.then((fn) => fn());
      window.removeEventListener('keydown', handleKeyPress);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Hide welcome screen when runtimes are detected
    if (!isDetecting && runtimes.length > 0) {
      setShowWelcome(false);
    }
  }, [isDetecting, runtimes.length]);

  const detectRuntimes = async (force = false) => {
    try {
      setDetecting(true);
      setError(null);
      
      // Emit detection-started event
      await emit('detection-started', { force, timestamp: new Date() });
      
      if (force) {
        // Clear cache before detecting
        await invoke('clear_detection_cache');
      }
      
      const result = await invoke<DetectionResult>('detect_runtimes');
      setRuntimes(result.runtimes);
      
      // Emit detection-completed event
      await emit('detection-completed', result);
      
      // Show success toast
      setToast({
        message: `Found ${result.runtimes.length} runtime${result.runtimes.length !== 1 ? 's' : ''}`,
        type: 'success',
        show: true,
      });
    } catch (err) {
      console.error('Detection error:', err);
      setError(err as string);
      
      // Show error toast
      setToast({
        message: 'Failed to detect runtimes',
        type: 'error',
        show: true,
      });
    } finally {
      setDetecting(false);
    }
  };

  // Show welcome screen on first load or during initial detection
  if (showWelcome && isDetecting) {
    return <WelcomeScreen isDetecting={isDetecting} />;
  }

  // Show no runtimes message after detection completes with no runtimes
  if (!isDetecting && runtimes.length === 0 && !showWelcome) {
    return <NoRuntimesMessage onRetry={() => detectRuntimes(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-blue-500">⚓ HarborMaster</h1>
              <p className="text-gray-400 mt-2">Master Your Containers</p>
            </div>
            {!showWelcome && runtimes.length > 0 && (
              <button
                onClick={() => detectRuntimes(true)}
                disabled={isDetecting}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
                title="Refresh runtime detection (Cmd/Ctrl+R)"
              >
                <svg
                  className={`w-5 h-5 ${isDetecting ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>{isDetecting ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            )}
          </div>
        </header>

        <main className="space-y-6">
          {isDetecting ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-400">Detecting container runtimes...</p>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          ) : runtimes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No container runtimes detected</p>
              <p className="text-gray-500 text-sm mt-2">Install Docker or Podman to get started</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase mb-2">
                  Active Runtime
                </h2>
                <RuntimeSelector />
              </div>

              {/* Show error banner if selected runtime has error status */}
              {selectedRuntime && selectedRuntime.status === 'error' && (
                <RuntimeError
                  runtime={selectedRuntime}
                  onRetry={() => detectRuntimes(true)}
                  onSwitchRuntime={() => {
                    // Find an alternative runtime that's not in error state
                    const alternative = runtimes.find(
                      (r) => r.id !== selectedRuntime.id && r.status !== 'error'
                    );
                    if (alternative) {
                      setSelectedRuntime(alternative);
                    }
                  }}
                  hasAlternatives={runtimes.filter((r) => r.status !== 'error').length > 1}
                />
              )}

              <div>
                <h2 className="text-sm font-semibold text-gray-400 uppercase mb-4">
                  Detected Runtimes ({runtimes.length})
                </h2>
                <div className="grid gap-4">
                  {runtimes.map((runtime) => (
                    <div
                      key={runtime.id}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-blue-400">
                            {runtime.type === 'docker' ? '🐳 Docker' : '🦭 Podman'}
                          </h3>
                          <p className="text-sm text-gray-400 mt-1">
                            Version: {runtime.version.full}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Path: {runtime.path}</p>
                          <p className="text-xs text-gray-500">
                            Last checked: {formatRelativeTime(runtime.lastChecked)}
                          </p>
                          {runtime.mode && (
                            <p className="text-xs text-gray-500">Mode: {runtime.mode}</p>
                          )}
                          {runtime.isWsl && (
                            <p className="text-xs text-yellow-400">Running via WSL2</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm ${
                              runtime.status === 'running'
                                ? 'bg-green-500/20 text-green-400'
                                : runtime.status === 'stopped'
                                  ? 'bg-gray-500/20 text-gray-400'
                                  : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {runtime.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
      
      {/* Toast notifications */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}

export default App;
