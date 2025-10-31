import { useState } from 'react';
import type { Runtime } from '../types/runtime';

/**
 * Props for the RuntimeError component
 */
interface RuntimeErrorProps {
  /** The runtime that encountered an error */
  runtime: Runtime;
  /** Callback invoked when user clicks retry */
  onRetry: () => void;
  /** Optional callback to switch to alternative runtime */
  onSwitchRuntime?: () => void;
  /** Whether alternative runtimes are available */
  hasAlternatives: boolean;
}

/**
 * Error display component for runtime connection failures
 * 
 * Features:
 * - Context-aware error messages based on error type
 * - Actionable troubleshooting suggestions
 * - Retry functionality with loading state
 * - Option to switch to alternative runtime
 * - Links to official troubleshooting documentation
 * 
 * Error types handled:
 * - Permission denied
 * - Executable not found
 * - Connection timeout
 * - Generic daemon errors
 * 
 * @param props - Component properties
 * @returns Runtime error UI with suggestions and actions
 * 
 * @example
 * ```tsx
 * <RuntimeError 
 *   runtime={failedRuntime} 
 *   onRetry={handleRetry}
 *   onSwitchRuntime={handleSwitch}
 *   hasAlternatives={true}
 * />
 * ```
 */
export function RuntimeError({ runtime, onRetry, onSwitchRuntime, hasAlternatives }: RuntimeErrorProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await onRetry();
    setIsRetrying(false);
  };

  const getErrorDetails = () => {
    const runtimeName = runtime.type === 'docker' ? 'Docker' : 'Podman';
    
    // Default error message and troubleshooting
    const details = {
      title: `${runtimeName} Connection Error`,
      message: `Unable to connect to ${runtimeName}. The daemon may not be running.`,
      suggestions: [
        `Start the ${runtimeName} daemon`,
        `Check if ${runtimeName} Desktop is running (if using Desktop version)`,
        `Verify ${runtimeName} is properly installed`,
        `Check system permissions`,
      ],
      docsLink: runtime.type === 'docker' 
        ? 'https://docs.docker.com/config/daemon/'
        : 'https://podman.io/getting-started/troubleshooting',
    };

    // Customize based on runtime error field if available
    if (runtime.error) {
      const error = runtime.error.toLowerCase();
      
      if (error.includes('permission denied')) {
        details.title = 'Permission Denied';
        details.message = `You don't have permission to access ${runtimeName}.`;
        details.suggestions = [
          `Add your user to the ${runtime.type} group: sudo usermod -aG ${runtime.type} $USER`,
          'Log out and log back in for group changes to take effect',
          `Run with sudo (not recommended for regular use)`,
          'Check file permissions on the socket',
        ];
      } else if (error.includes('not found') || error.includes('cannot find')) {
        details.title = `${runtimeName} Not Found`;
        details.message = `${runtimeName} executable was not found or has been moved.`;
        details.suggestions = [
          `Reinstall ${runtimeName}`,
          `Verify ${runtimeName} is in your PATH`,
          'Check if the installation directory has changed',
          'Restart your system after installation',
        ];
      } else if (error.includes('timeout')) {
        details.title = 'Connection Timeout';
        details.message = `Connection to ${runtimeName} timed out.`;
        details.suggestions = [
          `Start the ${runtimeName} daemon`,
          'Check if the daemon is responsive',
          'Restart the daemon if it appears stuck',
          'Check system resource availability (CPU, memory)',
        ];
      }
    }

    return details;
  };

  const details = getErrorDetails();

  return (
    <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-red-400">{details.title}</h3>
          <p className="mt-2 text-sm text-red-200">{details.message}</p>

          <div className="mt-4">
            <p className="text-sm font-medium text-red-300 mb-2">Try these steps:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-200">
              {details.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex items-center space-x-3">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
            >
              {isRetrying ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Retrying...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Retry Connection
                </>
              )}
            </button>

            {hasAlternatives && onSwitchRuntime && (
              <button
                onClick={onSwitchRuntime}
                className="inline-flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-md transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
                Try Alternative Runtime
              </button>
            )}

            <a
              href={details.docsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 text-red-300 hover:text-red-200 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Troubleshooting Guide
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
