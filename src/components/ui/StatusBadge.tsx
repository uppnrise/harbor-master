interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'error' | 'default';
}

/**
 * StatusBadge component - displays a colored badge for status
 */
export function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${getVariantClasses()}
      `}
    >
      {status}
    </span>
  );
}
