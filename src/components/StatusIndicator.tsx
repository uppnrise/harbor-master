/**
 * Props for the StatusIndicator component
 */
interface StatusIndicatorProps {
  /** Current status of the runtime */
  status: 'running' | 'stopped' | 'error' | 'unknown' | 'detecting';
  /** Size variant of the indicator */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Visual status indicator component
 * 
 * Displays a colored dot representing the current state of a container runtime.
 * Includes animation for detecting state.
 * 
 * Color scheme:
 * - Green: Running
 * - Gray: Stopped
 * - Red: Error
 * - Yellow: Unknown
 * - Blue (pulsing): Detecting
 * 
 * @param props - Component properties
 * @returns Status indicator dot
 * 
 * @example
 * ```tsx
 * <StatusIndicator status="running" size="md" />
 * ```
 */
export function StatusIndicator({ status, size = 'md' }: StatusIndicatorProps) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const colorClasses = {
    running: 'bg-green-500',
    stopped: 'bg-gray-500',
    error: 'bg-red-500',
    unknown: 'bg-yellow-500',
    detecting: 'bg-blue-500 animate-pulse',
  };

  return (
    <div
      className={`rounded-full ${sizeClasses[size]} ${colorClasses[status]}`}
      title={status.charAt(0).toUpperCase() + status.slice(1)}
      aria-label={`Status: ${status}`}
    />
  );
}
