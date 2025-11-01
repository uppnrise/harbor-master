/**
 * BatchActionsBar component
 * 
 * Displays batch action buttons when containers are selected
 */
import { memo, useState } from 'react';
import { useContainerStore } from '../../stores/containerStore';
import { useToast } from '../../hooks/useToast';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export const BatchActionsBar = memo(function BatchActionsBar() {
  const {
    selectedContainerIds,
    batchOperationInProgress,
    clearSelection,
    batchStartContainers,
    batchStopContainers,
    batchRestartContainers,
    batchPauseContainers,
    batchUnpauseContainers,
    batchRemoveContainers,
    containers,
  } = useContainerStore();
  
  const { showToast } = useToast();
  const [removeDialog, setRemoveDialog] = useState({
    isOpen: false,
    force: false,
    volumes: false,
  });
  
  const selectedCount = selectedContainerIds.size;
  
  if (selectedCount === 0) {
    return null;
  }
  
  const selectedIds = Array.from(selectedContainerIds);
  const selectedContainers = containers.filter(c => selectedContainerIds.has(c.id));
  
  // Determine which actions are available based on selected container states
  const hasRunning = selectedContainers.some(c => c.state === 'running');
  const hasStopped = selectedContainers.some(c => c.state === 'exited' || c.state === 'created');
  const hasPaused = selectedContainers.some(c => c.state === 'paused');
  
  const handleBatchStart = async () => {
    try {
      showToast(`Starting ${selectedCount} container${selectedCount !== 1 ? 's' : ''}...`, 'info');
      const results = await batchStartContainers(selectedIds);
      const succeeded = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      if (failed === 0) {
        showToast(`✓ Started ${succeeded} container${succeeded !== 1 ? 's' : ''}`, 'success');
      } else {
        showToast(`⚠ Started ${succeeded}, failed ${failed} container${failed !== 1 ? 's' : ''}`, 'error');
      }
      clearSelection();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to start containers', 'error');
    }
  };
  
  const handleBatchStop = async () => {
    try {
      showToast(`Stopping ${selectedCount} container${selectedCount !== 1 ? 's' : ''}...`, 'info');
      const results = await batchStopContainers(selectedIds);
      const succeeded = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      if (failed === 0) {
        showToast(`✓ Stopped ${succeeded} container${succeeded !== 1 ? 's' : ''}`, 'success');
      } else {
        showToast(`⚠ Stopped ${succeeded}, failed ${failed} container${failed !== 1 ? 's' : ''}`, 'error');
      }
      clearSelection();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to stop containers', 'error');
    }
  };
  
  const handleBatchRestart = async () => {
    try {
      showToast(`Restarting ${selectedCount} container${selectedCount !== 1 ? 's' : ''}...`, 'info');
      const results = await batchRestartContainers(selectedIds);
      const succeeded = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      if (failed === 0) {
        showToast(`✓ Restarted ${succeeded} container${succeeded !== 1 ? 's' : ''}`, 'success');
      } else {
        showToast(`⚠ Restarted ${succeeded}, failed ${failed} container${failed !== 1 ? 's' : ''}`, 'error');
      }
      clearSelection();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to restart containers', 'error');
    }
  };
  
  const handleBatchPause = async () => {
    try {
      showToast(`Pausing ${selectedCount} container${selectedCount !== 1 ? 's' : ''}...`, 'info');
      const results = await batchPauseContainers(selectedIds);
      const succeeded = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      if (failed === 0) {
        showToast(`✓ Paused ${succeeded} container${succeeded !== 1 ? 's' : ''}`, 'success');
      } else {
        showToast(`⚠ Paused ${succeeded}, failed ${failed} container${failed !== 1 ? 's' : ''}`, 'error');
      }
      clearSelection();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to pause containers', 'error');
    }
  };
  
  const handleBatchUnpause = async () => {
    try {
      showToast(`Unpausing ${selectedCount} container${selectedCount !== 1 ? 's' : ''}...`, 'info');
      const results = await batchUnpauseContainers(selectedIds);
      const succeeded = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      if (failed === 0) {
        showToast(`✓ Unpaused ${succeeded} container${succeeded !== 1 ? 's' : ''}`, 'success');
      } else {
        showToast(`⚠ Unpaused ${succeeded}, failed ${failed} container${failed !== 1 ? 's' : ''}`, 'error');
      }
      clearSelection();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to unpause containers', 'error');
    }
  };
  
  const handleBatchRemove = async () => {
    try {
      showToast(`Removing ${selectedCount} container${selectedCount !== 1 ? 's' : ''}...`, 'info');
      const results = await batchRemoveContainers(selectedIds, { 
        force: removeDialog.force, 
        volumes: removeDialog.volumes 
      });
      const succeeded = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      if (failed === 0) {
        showToast(`✓ Removed ${succeeded} container${succeeded !== 1 ? 's' : ''}`, 'success');
      } else {
        showToast(`⚠ Removed ${succeeded}, failed ${failed} container${failed !== 1 ? 's' : ''}`, 'error');
      }
      setRemoveDialog({ isOpen: false, force: false, volumes: false });
      clearSelection();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to remove containers', 'error');
    }
  };
  
  return (
    <div className="sticky top-0 z-10 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {selectedCount} container{selectedCount !== 1 ? 's' : ''} selected
          </span>
          
          <div className="flex gap-2">
            {hasStopped && (
              <button
                onClick={handleBatchStart}
                disabled={batchOperationInProgress}
                className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Start selected containers"
              >
                Start All
              </button>
            )}
            
            {hasRunning && (
              <>
                <button
                  onClick={handleBatchStop}
                  disabled={batchOperationInProgress}
                  className="px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-100 rounded hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Stop selected containers"
                >
                  Stop All
                </button>
                
                <button
                  onClick={handleBatchRestart}
                  disabled={batchOperationInProgress}
                  className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Restart selected containers"
                >
                  {batchOperationInProgress && (
                    <svg
                      className="animate-spin h-3 w-3"
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
                  Restart All
                </button>
                
                <button
                  onClick={handleBatchPause}
                  disabled={batchOperationInProgress}
                  className="px-3 py-1.5 text-sm font-medium text-yellow-700 bg-yellow-100 rounded hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Pause selected containers"
                >
                  Pause All
                </button>
              </>
            )}
            
            {hasPaused && (
              <button
                onClick={handleBatchUnpause}
                disabled={batchOperationInProgress}
                className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Unpause selected containers"
              >
                Unpause All
              </button>
            )}
            
            <button
              onClick={() => setRemoveDialog({ isOpen: true, force: false, volumes: false })}
              disabled={batchOperationInProgress}
              className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove selected containers"
            >
              Remove All
            </button>
          </div>
        </div>
        
        <button
          onClick={clearSelection}
          disabled={batchOperationInProgress}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear Selection
        </button>
      </div>
      
      {batchOperationInProgress && (
        <div className="mt-2 flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
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
          <span>Processing batch operation...</span>
        </div>
      )}
      
      {/* Batch Remove Confirmation Dialog */}
      <ConfirmDialog
        isOpen={removeDialog.isOpen}
        title="Remove Containers"
        message={`Are you sure you want to remove ${selectedCount} selected container${selectedCount !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Remove"
        variant="danger"
        isLoading={batchOperationInProgress}
        onConfirm={handleBatchRemove}
        onCancel={() => setRemoveDialog({ isOpen: false, force: false, volumes: false })}
      >
        {/* Remove Options */}
        <div className="space-y-3 mt-4">
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <input
              type="checkbox"
              checked={removeDialog.force}
              onChange={(e) => setRemoveDialog(prev => ({ ...prev, force: e.target.checked }))}
              className="mt-0.5 h-5 w-5 text-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 border-gray-300 dark:border-gray-600 rounded cursor-pointer"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Force remove
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Remove even if containers are running
              </div>
            </div>
          </label>
          
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <input
              type="checkbox"
              checked={removeDialog.volumes}
              onChange={(e) => setRemoveDialog(prev => ({ ...prev, volumes: e.target.checked }))}
              className="mt-0.5 h-5 w-5 text-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 border-gray-300 dark:border-gray-600 rounded cursor-pointer"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Remove volumes
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Also remove anonymous volumes associated with the containers
              </div>
            </div>
          </label>
        </div>
      </ConfirmDialog>
    </div>
  );
});
