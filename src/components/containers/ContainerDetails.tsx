import { useEffect } from 'react';
import { DetailPanel } from '../layout/DetailPanel';
import { TabPanel } from '../layout/TabPanel';
import ContainerOverview from './ContainerOverview';
import ContainerEnvironment from './ContainerEnvironment';
import ContainerLabels from './ContainerLabels';
import ContainerMounts from './ContainerMounts';
import ContainerNetworks from './ContainerNetworks';
import { useContainerStore } from '../../stores/containerStore';

interface ContainerDetailsProps {
  containerId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ContainerDetails({
  containerId,
  isOpen,
  onClose,
}: ContainerDetailsProps) {
  const { containerDetails, fetchContainerDetails, loading, error } =
    useContainerStore();

  // Fetch container details when panel opens
  useEffect(() => {
    if (isOpen && containerId) {
      fetchContainerDetails(containerId);
    }
  }, [isOpen, containerId, fetchContainerDetails]);

  // Show loading state
  if (loading && !containerDetails) {
    return (
      <DetailPanel
        isOpen={isOpen}
        onClose={onClose}
        title="Container Details"
        width={800}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Loading container details...
            </p>
          </div>
        </div>
      </DetailPanel>
    );
  }

  // Show error state
  if (error) {
    return (
      <DetailPanel
        isOpen={isOpen}
        onClose={onClose}
        title="Container Details"
        width={800}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 mb-2">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
              Failed to load container details
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {error}
            </p>
            <button
              onClick={() => fetchContainerDetails(containerId)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </DetailPanel>
    );
  }

  // Show details with tabs
  if (!containerDetails || !isOpen) {
    return null;
  }

  // Safely create tabs array with null checks
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: <ContainerOverview details={containerDetails} />,
    },
    {
      id: 'environment',
      label: 'Environment',
      content: <ContainerEnvironment details={containerDetails} />,
      badge: containerDetails.config?.env?.length || 0,
    },
    {
      id: 'labels',
      label: 'Labels',
      content: <ContainerLabels details={containerDetails} />,
      badge: Object.keys(containerDetails.config?.labels || {}).length,
    },
    {
      id: 'mounts',
      label: 'Mounts',
      content: <ContainerMounts details={containerDetails} />,
      badge: containerDetails.mounts?.length || 0,
    },
    {
      id: 'networks',
      label: 'Networks',
      content: <ContainerNetworks details={containerDetails} />,
      badge: Object.keys(containerDetails.networkSettings?.networks || {}).length,
    },
  ];

  return (
    <DetailPanel
      isOpen={isOpen}
      onClose={onClose}
      title={containerDetails.name}
      width={800}
    >
      <TabPanel tabs={tabs} defaultTab="overview" />
    </DetailPanel>
  );
}
