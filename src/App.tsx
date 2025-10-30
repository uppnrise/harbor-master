import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useRuntimeStore } from './stores/runtimeStore';
import { WelcomeScreen } from './components/WelcomeScreen';
import type { DetectionResult } from './types/runtime';

function App() {
  const { isDetecting, error, runtimes, setRuntimes, setDetecting, setError } = useRuntimeStore();
  const [showWelcome, setShowWelcome] = useState(true);

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

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    // Hide welcome screen when runtimes are detected
    if (!isDetecting && runtimes.length > 0) {
      setShowWelcome(false);
    }
  }, [isDetecting, runtimes.length]);

  const detectRuntimes = async () => {
    try {
      setDetecting(true);
      setError(null);
      const result = await invoke<DetectionResult>('detect_runtimes');
      console.log('Detection result:', result);
      setRuntimes(result.runtimes);
    } catch (err) {
      console.error('Detection error:', err);
      setError(err as string);
    } finally {
      setDetecting(false);
    }
  };

  // Show welcome screen on first load or during initial detection
  if (showWelcome && (isDetecting || runtimes.length === 0)) {
    return <WelcomeScreen isDetecting={isDetecting} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-blue-500">⚓ HarborMaster</h1>
          <p className="text-gray-400 mt-2">Master Your Containers</p>
        </header>

        <main>
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
            <div className="grid gap-4">
              <h2 className="text-2xl font-semibold mb-4">Detected Runtimes</h2>
              {runtimes.map((runtime) => (
                <div key={runtime.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-blue-400">
                        {runtime.type === 'docker' ? '🐳 Docker' : '🦭 Podman'}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Version: {runtime.version.full}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Path: {runtime.path}
                      </p>
                      {runtime.mode && (
                        <p className="text-xs text-gray-500">
                          Mode: {runtime.mode}
                        </p>
                      )}
                      {runtime.isWsl && (
                        <p className="text-xs text-yellow-400">
                          Running via WSL2
                        </p>
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
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
