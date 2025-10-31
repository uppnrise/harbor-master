import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

/**
 * Props for the NoRuntimesMessage component
 */
interface NoRuntimesMessageProps {
  /** Callback invoked when user clicks retry button */
  onRetry: () => void;
}

/**
 * Message component displayed when no container runtimes are detected
 * 
 * Features:
 * - Platform-specific installation links for Docker and Podman
 * - Retry detection functionality
 * - Troubleshooting guide link
 * - Loading state during retry
 * 
 * Automatically detects user's platform (macOS, Windows, Linux) and provides
 * appropriate installation links and instructions.
 * 
 * @param props - Component properties
 * @returns No runtimes message UI
 * 
 * @example
 * ```tsx
 * <NoRuntimesMessage onRetry={handleRetryDetection} />
 * ```
 */
export function NoRuntimesMessage({ onRetry }: NoRuntimesMessageProps) {
  const [platform, setPlatform] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    detectPlatform();
  }, []);

  const detectPlatform = async () => {
    try {
      const os = await invoke<string>('get_platform');
      setPlatform(os);
    } catch (err) {
      console.error('Failed to detect platform:', err);
      setPlatform('unknown');
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    await onRetry();
    setIsRetrying(false);
  };

  const getInstallationLinks = () => {
    const links = {
      docker: {
        macos: 'https://docs.docker.com/desktop/install/mac-install/',
        windows: 'https://docs.docker.com/desktop/install/windows-install/',
        linux: 'https://docs.docker.com/engine/install/',
      },
      podman: {
        macos: 'https://podman.io/docs/installation#macos',
        windows: 'https://podman.io/docs/installation#windows',
        linux: 'https://podman.io/docs/installation#linux',
      },
    };

    const os = platform.toLowerCase();
    if (os.includes('darwin') || os.includes('macos')) {
      return { docker: links.docker.macos, podman: links.podman.macos, osName: 'macOS' };
    } else if (os.includes('windows')) {
      return { docker: links.docker.windows, podman: links.podman.windows, osName: 'Windows' };
    } else {
      return { docker: links.docker.linux, podman: links.podman.linux, osName: 'Linux' };
    }
  };

  const links = getInstallationLinks();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl w-full bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">🐳</div>
          <h2 className="text-2xl font-bold text-white mb-2">No Container Runtimes Detected</h2>
          <p className="text-gray-400">
            HarborMaster couldn't find Docker or Podman installed on your system.
          </p>
        </div>

        <div className="mb-8 text-left">
          <h3 className="text-lg font-semibold text-white mb-4">Get Started:</h3>
          <div className="space-y-4">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">🐳</span>
                <h4 className="text-white font-semibold">Docker Desktop</h4>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                The most popular choice - includes Docker Engine, CLI, and a friendly GUI.
              </p>
              <a
                href={links.docker}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Install Docker for {links.osName}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">🦭</span>
                <h4 className="text-white font-semibold">Podman</h4>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                Daemonless container engine - lightweight and rootless by default.
              </p>
              <a
                href={links.podman}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Install Podman for {links.osName}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            {isRetrying ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Checking for runtimes...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-2"
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
                Retry Detection
              </>
            )}
          </button>
        </div>

        <div className="text-sm text-gray-400">
          <p className="mb-2">Need help?</p>
          <a
            href="https://github.com/yourusername/harbor-master#troubleshooting"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 inline-flex items-center"
          >
            View Troubleshooting Guide
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
