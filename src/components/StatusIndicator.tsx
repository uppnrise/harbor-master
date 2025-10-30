interface StatusIndicatorProps {
  status: 'running' | 'stopped' | 'error' | 'unknown' | 'detecting';
  size?: 'sm' | 'md' | 'lg';
}

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
