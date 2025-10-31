import { StatusIndicator } from './StatusIndicator';

/**
 * Props for the WelcomeScreen component
 */
interface WelcomeScreenProps {
  /** Whether runtime detection is currently in progress */
  isDetecting: boolean;
}

/**
 * Welcome screen component displayed before runtime detection completes
 * 
 * Shows the HarborMaster logo, tagline, and detection progress indicator.
 * Provides visual feedback during initial runtime detection.
 * 
 * @param props - Component properties
 * @returns Welcome screen UI
 * 
 * @example
 * ```tsx
 * <WelcomeScreen isDetecting={true} />
 * ```
 */
export function WelcomeScreen({ isDetecting }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="text-center space-y-8 max-w-2xl px-8">
        {/* Logo */}
        <div className="flex items-center justify-center">
          <span className="text-8xl">⚓</span>
        </div>

        {/* Title and tagline */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-blue-500">HarborMaster</h1>
          <p className="text-xl text-gray-400">Master Your Containers</p>
        </div>

        {/* Loading indicator */}
        {isDetecting && (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <StatusIndicator status="detecting" />
            </div>
            <p className="text-gray-500">Detecting container runtimes...</p>
          </div>
        )}

        {/* Help text */}
        {!isDetecting && (
          <div className="text-sm text-gray-600 space-y-2">
            <p>Supports Docker and Podman on Windows, macOS, and Linux</p>
          </div>
        )}
      </div>
    </div>
  );
}
