import { useContext } from 'react';
import { ToastContext, type ToastType } from '../contexts/ToastContext';

export type { ToastType };

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
