import type { ContainerDetails } from '../../types/container';
import { StatusBadge } from '../ui/StatusBadge';

interface ContainerOverviewProps {
  details: ContainerDetails;
}

export default function ContainerOverview({ details }: ContainerOverviewProps) {
  // Early return if details is not properly loaded
  if (!details || !details.state) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Container details not available
        </p>
      </div>
    );
  }

  // Format created timestamp
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Format uptime from started timestamp
  const formatUptime = (startedAt: string): string => {
    try {
      const start = new Date(startedAt);
      const now = new Date();
      const diff = now.getTime() - start.getTime();

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) return `${days}d ${hours}h ${minutes}m`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    } catch {
      return 'N/A';
    }
  };

  // Format ports for display
  const formatPorts = (
    ports: Record<string, Array<{ hostIp: string; hostPort: string }> | null>
  ): string => {
    const portEntries = Object.entries(ports);
    if (portEntries.length === 0) return 'None';

    const formatted = portEntries
      .filter((entry): entry is [string, Array<{ hostIp: string; hostPort: string }>] => {
        const [_, bindings] = entry;
        return bindings !== null && bindings.length > 0;
      })
      .map(([containerPort, bindings]) => {
        const binding = bindings[0];
        if (!binding) return '';
        return `${binding.hostPort}:${containerPort}`;
      })
      .filter((port) => port !== '');

    return formatted.length > 0 ? formatted.join(', ') : 'None';
  };

  // Get display state
  const getDisplayState = (): string => {
    if (!details?.state) return 'unknown';
    if (details.state.running) return 'running';
    if (details.state.paused) return 'paused';
    if (details.state.restarting) return 'restarting';
    return details.state.status || 'unknown';
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Container Name
            </label>
            <p className="text-sm text-gray-900 dark:text-gray-100 font-mono break-all">
              {details.name}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Container ID
            </label>
            <p className="text-sm text-gray-900 dark:text-gray-100 font-mono break-all">
              {details.id}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              State
            </label>
            <div className="flex items-center gap-2">
              <StatusBadge
                status={getDisplayState()}
                variant={details.state.running ? 'success' : 'default'}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {details.state.status}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Created
            </label>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {formatDate(details.created)}
            </p>
          </div>
        </div>
      </section>

      {/* Image Information */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
          Image
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Image
            </label>
            <p className="text-sm text-gray-900 dark:text-gray-100 font-mono break-all">
              {details.image}
            </p>
          </div>
        </div>
      </section>

      {/* Runtime Information */}
      {details.state.running && details.state.startedAt && (
        <section>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
            Runtime
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Started At
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {formatDate(details.state.startedAt)}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Uptime
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {formatUptime(details.state.startedAt)}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Network Information */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
          Network
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Ports
            </label>
            <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">
              {details.networkSettings?.ports 
                ? formatPorts(details.networkSettings.ports)
                : 'None'}
            </p>
          </div>
        </div>
      </section>

      {/* Restart Information */}
      {details.restartCount !== undefined && details.restartCount > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
            Restarts
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Restart Count
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {details.restartCount}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
