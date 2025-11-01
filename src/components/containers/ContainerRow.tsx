import { memo, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [currentOperation, setCurrentOperation] = useState<'starting' | 'stopping' | 'pausing' | 'unpausing' | 'removing' | null>(null);
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
  
  const [removeDialog, setRemoveDialog] = useState<{
    isOpen: boolean;
    force: boolean;
    volumes: boolean;
  }>({
    isOpen: false,
    force: false,
    volumes: false,
  });

  const { showToast } = useToast();
  const {
    startContainer,
    stopContainer,
    pauseContainer,
    unpauseContainer,
    removeContainer,
    isOperationInProgress,
    toggleContainerSelection,
    isContainerSelected,
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
      setCurrentOperation('starting');
      await startContainer(container.id);
      showToast(`Container ${container.name} started successfully`, 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start container';
      showToast(message, 'error');
    } finally {
      setCurrentOperation(null);
    }
  };

  const handleStopContainer = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Stop Container',
      message: `Are you sure you want to stop "${container.name}"?`,
      action: async () => {
        // Close dialog immediately
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        
        try {
          setCurrentOperation('stopping');
          await stopContainer(container.id);
          showToast(`Container ${container.name} stopped successfully`, 'success');
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to stop container';
          showToast(message, 'error');
        } finally {
          setCurrentOperation(null);
        }
      },
    });
  };

  const handlePauseContainer = async () => {
    try {
      setCurrentOperation('pausing');
      await pauseContainer(container.id);
      showToast(`Container ${container.name} paused successfully`, 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pause container';
      showToast(message, 'error');
    } finally {
      setCurrentOperation(null);
    }
  };

  const handleUnpauseContainer = async () => {
    try {
      setCurrentOperation('unpausing');
      await unpauseContainer(container.id);
      showToast(`Container ${container.name} unpaused successfully`, 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unpause container';
      showToast(message, 'error');
    } finally {
      setCurrentOperation(null);
    }
  };

  const handleRemoveContainer = async () => {
    try {
      setCurrentOperation('removing');
      await removeContainer(container.id, {
        force: removeDialog.force,
        volumes: removeDialog.volumes,
      });
      showToast(
        `Container ${container.name} removed successfully${removeDialog.volumes ? ' with volumes' : ''}`,
        'success'
      );
      setRemoveDialog({ isOpen: false, force: false, volumes: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove container';
      showToast(message, 'error');
    } finally {
      setCurrentOperation(null);
    }
  };

  return (
    <>
      <div
        className={`
        grid grid-cols-[48px_100px_1fr_200px_120px_100px_140px] gap-3 p-3 border-b border-gray-200 dark:border-gray-700
        hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
      `}
      >
        {/* Selection Checkbox */}
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isContainerSelected(container.id)}
            onChange={() => toggleContainerSelection(container.id)}
            className="h-5 w-5 text-blue-600 focus:ring-blue-500 focus:ring-2 border-gray-300 rounded cursor-pointer"
            title="Select container"
          />
        </div>
        
        {/* Status Indicator */}
        <div 
          className="flex items-center cursor-pointer"
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
        <div className="min-w-0 cursor-pointer" onClick={handleClick}>
          <div className="font-medium text-gray-900 dark:text-white truncate">
            {truncateName(container.name)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {truncateId(container.id)}
          </div>
        </div>

        {/* Image */}
        <div className="hidden md:block min-w-0 cursor-pointer" onClick={handleClick}>
          <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
            {container.image}
          </div>
        </div>

        {/* Ports */}
        <div className="hidden lg:block cursor-pointer" onClick={handleClick}>
          <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {formatPorts(container.ports)}
          </div>
        </div>

        {/* Created */}
        <div className="hidden xl:block cursor-pointer" onClick={handleClick}>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {formatCreated(container.created)}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
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
              <span>
                {currentOperation === 'starting' && 'Starting...'}
                {currentOperation === 'stopping' && 'Stopping...'}
                {currentOperation === 'pausing' && 'Pausing...'}
                {currentOperation === 'unpausing' && 'Unpausing...'}
                {currentOperation === 'removing' && 'Removing...'}
                {!currentOperation && 'Loading...'}
              </span>
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
          
          {/* Remove button - always visible for stopped/exited containers */}
          {(container.state === ContainerState.Exited || container.state === ContainerState.Created) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRemoveDialog({ isOpen: true, force: false, volumes: false });
              }}
              className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Remove ${container.name}`}
              disabled={isLoading}
            >
              Remove
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
      
      {/* Remove Confirmation Dialog with Options - Rendered via Portal */}
      {removeDialog.isOpen && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setRemoveDialog({ isOpen: false, force: false, volumes: false })}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Remove Container
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Are you sure you want to remove <strong>{container.name}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            
            {/* Remove Options */}
            <div className="space-y-3 mb-6">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={removeDialog.force}
                  onChange={(e) => setRemoveDialog(prev => ({ ...prev, force: e.target.checked }))}
                  className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Force remove
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Remove even if the container is running
                  </div>
                </div>
              </label>
              
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={removeDialog.volumes}
                  onChange={(e) => setRemoveDialog(prev => ({ ...prev, volumes: e.target.checked }))}
                  className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Remove volumes
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Also remove anonymous volumes associated with the container
                  </div>
                </div>
              </label>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRemoveDialog({ isOpen: false, force: false, volumes: false })}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveContainer}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading && (
                  <svg
                    className="animate-spin h-4 w-4"
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
                )}
                Remove Container
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
});
