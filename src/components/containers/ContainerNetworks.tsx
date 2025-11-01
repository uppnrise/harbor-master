import type { ContainerDetails } from '../../types/container';

interface ContainerNetworksProps {
  details: ContainerDetails;
}

export default function ContainerNetworks({ details }: ContainerNetworksProps) {
  // Early return if details is not properly loaded
  if (!details || !details.networkSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Network information not available
        </p>
      </div>
    );
  }

  const networks = details.networkSettings.networks || {};
  const networkEntries = Object.entries(networks);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Networks
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {networkEntries.length}{' '}
          {networkEntries.length === 1 ? 'network' : 'networks'}
        </span>
      </div>

      {/* Global Network Settings */}
      <section className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">
          Global Settings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {details.networkSettings.ipAddress && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                IP Address
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                {details.networkSettings.ipAddress}
              </p>
            </div>
          )}
          {details.networkSettings.gateway && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Gateway
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                {details.networkSettings.gateway}
              </p>
            </div>
          )}
          {details.networkSettings.macAddress && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                MAC Address
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                {details.networkSettings.macAddress}
              </p>
            </div>
          )}
          {details.networkSettings.bridge && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Bridge
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                {details.networkSettings.bridge}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Individual Networks */}
      {networkEntries.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Not connected to any networks
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Connected Networks
          </h4>
          {networkEntries.map(([networkName, networkInfo]) => {
            // Type guard - we know it's an object with network properties
            const network = networkInfo as Record<string, string>;
            
            return (
              <div
                key={networkName}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="space-y-3">
                  {/* Network Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Network Name
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-mono font-semibold">
                      {networkName}
                    </p>
                  </div>

                  {/* Network Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {network['IPAddress'] && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          IP Address
                        </label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                          {network['IPAddress']}
                        </p>
                      </div>
                    )}
                    {network['Gateway'] && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Gateway
                        </label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                          {network['Gateway']}
                        </p>
                      </div>
                    )}
                    {network['MacAddress'] && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          MAC Address
                        </label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                          {network['MacAddress']}
                        </p>
                      </div>
                    )}
                    {network['NetworkID'] && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Network ID
                        </label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-mono break-all">
                          {network['NetworkID']}
                        </p>
                      </div>
                    )}
                    {network['EndpointID'] && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Endpoint ID
                        </label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-mono break-all">
                          {network['EndpointID']}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
