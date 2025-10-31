import type { ContainerDetails } from '../../types/container';

interface ContainerMountsProps {
  details: ContainerDetails;
}

export default function ContainerMounts({ details }: ContainerMountsProps) {
  // Early return if details is not properly loaded
  if (!details) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Mounts not available
        </p>
      </div>
    );
  }

  const mounts = details.mounts || [];

  // Get mount type badge color
  const getMountTypeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'volume':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'bind':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'tmpfs':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Mounts
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {mounts.length} {mounts.length === 1 ? 'mount' : 'mounts'}
        </span>
      </div>

      {mounts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No mounts defined
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {mounts.map((mount, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="space-y-3">
                {/* Mount Type */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMountTypeColor(
                      mount.mountType
                    )}`}
                  >
                    {mount.mountType}
                  </span>
                  {mount.rw ? (
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Read/Write
                    </span>
                  ) : (
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      Read Only
                    </span>
                  )}
                </div>

                {/* Source */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Source
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-mono break-all">
                    {mount.source || <span className="text-gray-400 italic">(none)</span>}
                  </p>
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Destination
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-mono break-all">
                    {mount.destination}
                  </p>
                </div>

                {/* Mode and Propagation */}
                <div className="grid grid-cols-2 gap-3">
                  {mount.mode && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Mode
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                        {mount.mode}
                      </p>
                    </div>
                  )}
                  {mount.propagation && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Propagation
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                        {mount.propagation}
                      </p>
                    </div>
                  )}
                </div>

                {/* Volume Name (if applicable) */}
                {mount.name && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Volume Name
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-mono break-all">
                      {mount.name}
                    </p>
                  </div>
                )}

                {/* Driver (if applicable) */}
                {mount.driver && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Driver
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                      {mount.driver}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
