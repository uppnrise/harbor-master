/**
 * Pull Image Dialog Component
 * Allows users to pull images from registries with optional authentication
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PullProgress } from '../../types/image';

export interface PullImageDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Current pull progress */
  pullProgress: PullProgress | null;
  /** Whether pull is in progress */
  isPulling: boolean;
  /** Callback when user submits the form */
  onPull: (imageName: string, tag: string, auth?: string) => void;
  /** Callback when user closes the dialog */
  onClose: () => void;
}

export function PullImageDialog({
  isOpen,
  pullProgress,
  isPulling,
  onPull,
  onClose,
}: PullImageDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [imageName, setImageName] = useState('');
  const [tag, setTag] = useState('latest');
  const [showAuth, setShowAuth] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Manage dialog open/close state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Handle close (use useCallback to avoid useEffect warning)
  const handleClose = useCallback(() => {
    if (!isPulling) {
      setImageName('');
      setTag('latest');
      setUsername('');
      setPassword('');
      setShowAuth(false);
      onClose();
    }
  }, [isPulling, onClose]);

  // Close on pull complete
  useEffect(() => {
    if (pullProgress?.complete) {
      // Wait a bit to show completion, then close
      setTimeout(() => {
        handleClose();
      }, 1500);
    }
  }, [pullProgress?.complete, handleClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageName.trim()) {
      return;
    }

    const auth = showAuth && username && password
      ? `${username}:${password}`
      : undefined;

    onPull(imageName.trim(), tag.trim(), auth);
  };

  const handleCancel = () => {
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    }
    handleClose();
  };

  // Calculate overall progress
  const overallProgress = pullProgress?.layers.length
    ? pullProgress.layers.filter(l => l.status.includes('complete')).length / pullProgress.layers.length * 100
    : 0;

  return (
    <dialog
      ref={dialogRef}
      className="rounded-lg shadow-xl backdrop:bg-black/50 p-0 max-w-2xl w-full"
      onClose={handleClose}
    >
      <div className="bg-white dark:bg-gray-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Pull Image from Registry
          </h2>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Image Name */}
          <div>
            <label htmlFor="imageName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Image Name *
            </label>
            <input
              id="imageName"
              type="text"
              placeholder="e.g., nginx, docker.io/library/ubuntu"
              value={imageName}
              onChange={(e) => setImageName(e.target.value)}
              disabled={isPulling}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            />
          </div>

          {/* Tag */}
          <div>
            <label htmlFor="tag" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tag
            </label>
            <input
              id="tag"
              type="text"
              placeholder="latest"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              disabled={isPulling}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            />
          </div>

          {/* Authentication Toggle */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showAuth}
                onChange={(e) => setShowAuth(e.target.checked)}
                disabled={isPulling}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Use authentication (private registry)
              </span>
            </label>
          </div>

          {/* Authentication Fields */}
          {showAuth && (
            <div className="space-y-3 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isPulling}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPulling}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {/* Pull Progress */}
          {isPulling && pullProgress && (
            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  Pulling {pullProgress.image}
                </span>
                <span className="text-blue-700 dark:text-blue-300">
                  {Math.round(overallProgress)}%
                </span>
              </div>
              
              {/* Overall Progress Bar */}
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>

              {/* Layer Status (show last 5) */}
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {pullProgress.layers.slice(-5).map((layer) => (
                  <div key={layer.id} className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span className="font-mono text-gray-500 dark:text-gray-400">
                      {layer.id.substring(0, 12)}
                    </span>
                    <span className="flex-1">{layer.status}</span>
                    {layer.current && layer.total && (
                      <span className="text-gray-500 dark:text-gray-400">
                        {Math.round((layer.current / layer.total) * 100)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {pullProgress.complete && (
                <div className="text-sm font-medium text-green-700 dark:text-green-300">
                  ✓ Pull complete!
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPulling}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPulling ? 'Pulling...' : 'Cancel'}
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isPulling || !imageName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPulling ? 'Pulling...' : 'Pull Image'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
