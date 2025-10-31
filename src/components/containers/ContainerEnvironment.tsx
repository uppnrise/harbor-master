import type { ContainerDetails } from '../../types/container';

interface ContainerEnvironmentProps {
  details: ContainerDetails;
}

export default function ContainerEnvironment({
  details,
}: ContainerEnvironmentProps) {
  // Early return if details is not properly loaded
  if (!details || !details.config) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Environment variables not available
        </p>
      </div>
    );
  }

  const envVars = details.config.env || [];

  // Parse environment variables into key-value pairs
  const parsedEnv = envVars.map((env) => {
    const separatorIndex = env.indexOf('=');
    if (separatorIndex === -1) {
      return { key: env, value: '' };
    }
    return {
      key: env.substring(0, separatorIndex),
      value: env.substring(separatorIndex + 1),
    };
  });

  // Sort by key for easier browsing
  const sortedEnv = [...parsedEnv].sort((a, b) => a.key.localeCompare(b.key));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Environment Variables
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {sortedEnv.length} {sortedEnv.length === 1 ? 'variable' : 'variables'}
        </span>
      </div>

      {sortedEnv.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No environment variables defined
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedEnv.map(({ key, value }, index) => (
            <div
              key={index}
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
