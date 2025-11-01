import React, { useEffect, useRef } from 'react';

/**
 * Props for the ConfirmDialog component
 */
export interface ConfirmDialogProps {
  /**
   * Whether the dialog is open
   */
  isOpen: boolean;

  /**
   * Dialog title
   */
  title: string;

  /**
   * Dialog message
   */
  message: string;

  /**
   * Confirm button text (default: "Confirm")
   */
  confirmText?: string;

  /**
   * Cancel button text (default: "Cancel")
   */
  cancelText?: string;

  /**
   * Confirm button variant (default: "danger")
   */
  variant?: 'danger' | 'warning' | 'primary';

  /**
   * Whether the operation is in progress
   */
  isLoading?: boolean;

  /**
   * Callback when confirmed
   */
  onConfirm: () => void;

  /**
   * Callback when cancelled
   */
  onCancel: () => void;
}

/**
 * ConfirmDialog component for destructive action confirmations
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Manage dialog open/close state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      // Fallback for environments without showModal (like some test environments)
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
        (dialog as HTMLDialogElement & { open: boolean }).open = true;
      }
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Handle ESC key and backdrop click
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      if (!isLoading) {
        onCancel();
      }
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
    };
  }, [isLoading, onCancel]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      onConfirm();
    }
  };

  // Variant styles for confirm button
  const confirmButtonStyles = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 m-0 rounded-lg shadow-xl backdrop:bg-black/50 p-0 border border-gray-700 bg-gray-800"
      onKeyDown={handleKeyDown}
      aria-labelledby="dialog-title"
      aria-describedby="dialog-message"
    >
      <div className="w-full max-w-md p-6">
        {/* Header */}
        <div className="mb-4">
          <h2
            id="dialog-title"
            className="text-xl font-semibold text-white"
          >
            {title}
          </h2>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p
            id="dialog-message"
            className="text-gray-300"
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-2.5 rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 min-w-[100px]"
            aria-label={cancelText}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-6 py-2.5 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 min-w-[100px] ${confirmButtonStyles[variant]}`}
            aria-label={confirmText}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
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
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
}
