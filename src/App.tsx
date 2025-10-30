import { useEffect } from 'react';
import { useRuntimeStore } from './stores/runtimeStore';

function App() {
  const { isDetecting, error, runtimes } = useRuntimeStore();

  useEffect(() => {
    // Detection logic will be implemented in later phases
    console.log('HarborMaster initialized');
  }, []);

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
              <p className="text-gray-400">
                {runtimes.length} runtime{runtimes.length !== 1 ? 's' : ''} detected
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
