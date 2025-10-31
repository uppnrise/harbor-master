import { memo, useState } from 'react';
import { ContainerState, type Container } from '../../types/container';
import { StatusBadge } from '../ui/StatusBadge';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useContainerStore } from '../../stores/containerStore';
import { useToast } from '../../hooks/useToast';

interface ContainerRowProps {
  container: Container;
  isSelected: boolean;
  onSelect: (container: Container) => void;
}

/**
 * ContainerRow component - displays a single container in the list
 * Memoized for performance with large lists
 */
export const ContainerRow = memo(function ContainerRow({
  container,
  isSelected,
  onSelect,
}: ContainerRowProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
  });

  const { showToast } = useToast();
  const {
    startContainer,
    stopContainer,
    pauseContainer,
    unpauseContainer,
    isOperationInProgress,
  } = useContainerStore();

  const isLoading = isOperationInProgress(container.id);
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

  const handleStartContainer = async () => {
    try {
      await startContainer(container.id);
      showToast(`Container ${container.name} started successfully`, 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start container';
      showToast(message, 'error');
    }
  };

  const handleStopContainer = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Stop Container',
      message: `Are you sure you want to stop "${container.name}"?`,
      action: async () => {
        try {
          await stopContainer(container.id);
          showToast(`Container ${container.name} stopped successfully`, 'success');
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to stop container';
          showToast(message, 'error');
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handlePauseContainer = async () => {
    try {
      await pauseContainer(container.id);
      showToast(`Container ${container.name} paused successfully`, 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pause container';
      showToast(message, 'error');
    }
  };

  const handleUnpauseContainer = async () => {
    try {
      await unpauseContainer(container.id);
      showToast(`Container ${container.name} unpaused successfully`, 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unpause container';
      showToast(message, 'error');
    }
  };

  return (
    <>
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
          {isLoading ? (
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500">
              <svg
                className="animate-spin h-3 w-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
              <span>Loading...</span>
            </div>
          ) : container.state === ContainerState.Running ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStopContainer();
                }}
                className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Stop ${container.name}`}
                disabled={isLoading}
              >
                Stop
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePauseContainer();
                }}
                className="px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Pause ${container.name}`}
                disabled={isLoading}
              >
                Pause
              </button>
            </>
          ) : container.state === ContainerState.Paused ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUnpauseContainer();
              }}
              className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Unpause ${container.name}`}
              disabled={isLoading}
            >
              Unpause
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStartContainer();
              }}
              className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Start ${container.name}`}
              disabled={isLoading}
            >
              Start
            </button>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Stop"
        variant="warning"
        isLoading={isLoading}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
});
