import { memo } from 'react';
import { ContainerState, type Container } from '../../types/container';
import { StatusBadge } from '../ui/StatusBadge';

interface ContainerRowProps {
  container: Container;
  isSelected: boolean;
  onSelect: (container: Container) => void;
  onAction?: (action: string, containerId: string) => void;
}

/**
 * ContainerRow component - displays a single container in the list
 * Memoized for performance with large lists
 */
export const ContainerRow = memo(function ContainerRow({
  container,
  isSelected,
  onSelect,
  onAction,
}: ContainerRowProps) {
  const getStateText = (state: ContainerState): string => {
    return state.toString();
  };

  const formatCreated = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  const formatPorts = (ports: Container['ports']): string => {
    if (ports.length === 0) return '-';
    return ports
      .map((p) => `${p.hostPort}:${p.containerPort}/${p.protocol}`)
      .join(', ');
  };

  const truncateName = (name: string, maxLength = 30): string => {
    if (name.length <= maxLength) return name;
    return `${name.slice(0, maxLength - 3)}...`;
  };

  const truncateId = (id: string): string => {
    return id.slice(0, 12);
  };

  const handleClick = () => {
    onSelect(container);
  };

  const handleActionClick = (
    e: React.MouseEvent,
    action: string
  ) => {
    e.stopPropagation();
    if (onAction) {
      onAction(action, container.id);
    }
  };

  return (
    <div
      className={`
        grid grid-cols-[100px_1fr_200px_120px_100px_140px] gap-3 p-3 border-b border-gray-200 dark:border-gray-700
        hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors
        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
      `}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      aria-selected={isSelected}
    >
      {/* Status Indicator */}
      <div className="flex items-center">
        <StatusBadge
          status={getStateText(container.state)}
          variant={
            container.state === ContainerState.Running
              ? 'success'
              : container.state === ContainerState.Paused
                ? 'warning'
                : container.state === ContainerState.Exited
                  ? 'default'
                  : 'error'
          }
        />
      </div>

      {/* Container Name */}
      <div className="min-w-0">
        <div className="font-medium text-gray-900 dark:text-white truncate">
          {truncateName(container.name)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {truncateId(container.id)}
        </div>
      </div>

      {/* Image */}
      <div className="hidden md:block min-w-0">
        <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
          {container.image}
        </div>
      </div>

      {/* Ports */}
      <div className="hidden lg:block">
        <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {formatPorts(container.ports)}
        </div>
      </div>

      {/* Created */}
      <div className="hidden xl:block">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {formatCreated(container.created)}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-1">
        {container.state === ContainerState.Running ? (
          <>
            <button
              onClick={(e) => handleActionClick(e, 'stop')}
              className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
              aria-label={`Stop ${container.name}`}
            >
              Stop
            </button>
            <button
              onClick={(e) => handleActionClick(e, 'pause')}
              className="px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50"
              aria-label={`Pause ${container.name}`}
            >
              Pause
            </button>
          </>
        ) : container.state === ContainerState.Paused ? (
          <button
            onClick={(e) => handleActionClick(e, 'unpause')}
            className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
            aria-label={`Unpause ${container.name}`}
          >
            Unpause
          </button>
        ) : (
          <button
            onClick={(e) => handleActionClick(e, 'start')}
            className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
            aria-label={`Start ${container.name}`}
          >
            Start
          </button>
        )}
      </div>
    </div>
  );
});
