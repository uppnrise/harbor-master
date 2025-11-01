import type { ContainerDetails } from '../../types/container';

interface ContainerLabelsProps {
  details: ContainerDetails;
}

export default function ContainerLabels({ details }: ContainerLabelsProps) {
  // Early return if details is not properly loaded
  if (!details || !details.config) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Labels not available
        </p>
      </div>
    );
  }

  const labels = details.config.labels || {};
  const labelEntries = Object.entries(labels);

  // Sort by key for easier browsing
  const sortedLabels = labelEntries.sort(([keyA], [keyB]) =>
    keyA.localeCompare(keyB)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Labels
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {sortedLabels.length} {sortedLabels.length === 1 ? 'label' : 'labels'}
        </span>
      </div>

      {sortedLabels.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No labels defined
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedLabels.map(([key, value]) => (
            <div
              key={key}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex flex-col gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Key
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-mono break-all">
                    {key}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Value
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-mono break-all">
                    {value || <span className="text-gray-400 italic">(empty)</span>}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
