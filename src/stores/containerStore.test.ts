import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useContainerStore } from './containerStore';
import * as containerService from '../services/containerService';
import * as runtimeStore from './runtimeStore';
import type { Runtime } from '../types/runtime';
import { ContainerState, type Container, type ContainerDetails, type PruneResult } from '../types/container';

// Mock the services
vi.mock('../services/containerService');
vi.mock('./runtimeStore', () => ({
  useRuntimeStore: Object.assign(
    vi.fn(),
    {
      getState: vi.fn(),
      setState: vi.fn(),
      subscribe: vi.fn(),
    }
  ),
}));

const mockRuntime: Runtime = {
  id: 'docker',
  type: 'docker',
  path: '/usr/bin/docker',
  version: { major: 24, minor: 0, patch: 0, full: '24.0.0' },
  status: 'running',
  lastChecked: new Date().toISOString(),
  detectedAt: new Date().toISOString(),
};

const mockContainer: Container = {
  id: 'abc123',
  name: 'test-container',
  image: 'nginx:latest',
  imageId: 'sha256:def456',
  command: 'nginx -g daemon off;',
  created: 1234567890,
  state: ContainerState.Running,
  status: 'Up 2 hours',
  ports: [],
  labels: {},
  sizeRw: undefined,
  sizeRootFs: undefined,
  networks: [],
  mounts: [],
};

const mockContainerDetails: ContainerDetails = {
  id: 'abc123',
  created: '2024-01-01T00:00:00Z',
  path: '/usr/sbin/nginx',
  args: ['-g', 'daemon off;'],
  state: {
    status: 'running',
    running: true,
    paused: false,
    restarting: false,
    oomKilled: false,
    dead: false,
    pid: 12345,
    exitCode: 0,
    error: '',
    startedAt: '2024-01-01T00:00:00Z',
    finishedAt: '0001-01-01T00:00:00Z',
  },
  image: 'sha256:def456',
  name: '/test-container',
  restartCount: 0,
  driver: 'overlay2',
  platform: 'linux',
  mountLabel: '',
  processLabel: '',
  appArmorProfile: '',
  config: {
    hostname: 'abc123',
    domainname: '',
    user: '',
    attachStdin: false,
    attachStdout: false,
    attachStderr: false,
    tty: false,
    openStdin: false,
    stdinOnce: false,
    env: [],
    cmd: ['nginx', '-g', 'daemon off;'],
    image: 'nginx:latest',
    labels: {},
    workingDir: '/',
  },
  networkSettings: {
    bridge: '',
    sandboxId: '',
    hairpinMode: false,
    linkLocalIpv6Address: '',
    linkLocalIpv6PrefixLen: 0,
    ports: {},
    sandboxKey: '',
    gateway: '',
    ipAddress: '',
    ipPrefixLen: 0,
    ipv6Gateway: '',
    macAddress: '',
    networks: {},
  },
  mounts: [],
};

describe('containerStore', () => {
  beforeEach(() => {
    // Reset store state
    useContainerStore.setState({
      containers: [],
      selectedContainer: null,
      containerDetails: null,
      loading: false,
      error: null,
      refreshInterval: null,
      operationInProgress: new Set<string>(),
    });

    // Clear service mocks but not module mocks
    vi.clearAllTimers();
    
    // Reset runtime store mock to return mockRuntime
    vi.mocked(runtimeStore.useRuntimeStore).mockReturnValue({
      selectedRuntime: mockRuntime,
      getState: () => ({ selectedRuntime: mockRuntime } as unknown as ReturnType<typeof runtimeStore.useRuntimeStore.getState>),
    } as unknown as ReturnType<typeof runtimeStore.useRuntimeStore>);
    
    vi.mocked(runtimeStore.useRuntimeStore.getState).mockReturnValue({
      selectedRuntime: mockRuntime,
    } as unknown as ReturnType<typeof runtimeStore.useRuntimeStore.getState>);
  });

  describe('fetchContainers', () => {
    it('should fetch containers successfully', async () => {
      vi.mocked(containerService.listContainers).mockResolvedValue([mockContainer]);

      const { fetchContainers } = useContainerStore.getState();
      await fetchContainers();

      const state = useContainerStore.getState();
      expect(state.containers).toEqual([mockContainer]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle fetch errors', async () => {
      const errorMessage = 'Failed to list containers';
      vi.mocked(containerService.listContainers).mockRejectedValue(
        new Error(errorMessage)
      );

      const { fetchContainers } = useContainerStore.getState();
      await expect(fetchContainers()).rejects.toThrow(errorMessage);

      const state = useContainerStore.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.loading).toBe(false);
    });

    it('should throw error when no runtime selected', async () => {
      vi.mocked(runtimeStore.useRuntimeStore.getState).mockReturnValue({
        selectedRuntime: null,
      } as any);

      const { fetchContainers } = useContainerStore.getState();
      await expect(fetchContainers()).rejects.toThrow('No runtime selected');
    });
  });

  describe('selectContainer', () => {
    it('should select a container', () => {
      const { selectContainer } = useContainerStore.getState();
      selectContainer(mockContainer);

      const state = useContainerStore.getState();
      expect(state.selectedContainer).toEqual(mockContainer);
      expect(state.containerDetails).toBeNull();
    });

    it('should clear selection', () => {
      useContainerStore.setState({ selectedContainer: mockContainer });

      const { selectContainer } = useContainerStore.getState();
      selectContainer(null);

      const state = useContainerStore.getState();
      expect(state.selectedContainer).toBeNull();
    });
  });

  describe('fetchContainerDetails', () => {
    it('should fetch container details', async () => {
      vi.mocked(containerService.inspectContainer).mockResolvedValue(
        mockContainerDetails
      );

      const { fetchContainerDetails } = useContainerStore.getState();
      await fetchContainerDetails('abc123');

      const state = useContainerStore.getState();
      expect(state.containerDetails).toEqual(mockContainerDetails);
      expect(state.loading).toBe(false);
    });
  });

  describe('lifecycle operations', () => {
    beforeEach(() => {
      vi.mocked(containerService.listContainers).mockResolvedValue([mockContainer]);
    });

    it('should start a container', async () => {
      vi.mocked(containerService.startContainer).mockResolvedValue();

      const { startContainer } = useContainerStore.getState();
      await startContainer('abc123');

      expect(containerService.startContainer).toHaveBeenCalledWith(
        mockRuntime,
        'abc123'
      );
      expect(containerService.listContainers).toHaveBeenCalled();
    });

    it('should stop a container', async () => {
      vi.mocked(containerService.stopContainer).mockResolvedValue();

      const { stopContainer } = useContainerStore.getState();
      await stopContainer('abc123', 10);

      expect(containerService.stopContainer).toHaveBeenCalledWith(
        mockRuntime,
        'abc123',
        10
      );
    });

    it('should restart a container', async () => {
      vi.mocked(containerService.restartContainer).mockResolvedValue();

      const { restartContainer } = useContainerStore.getState();
      await restartContainer('abc123', 10);

      expect(containerService.restartContainer).toHaveBeenCalledWith(
        mockRuntime,
        'abc123',
        10
      );
    });

    it('should pause a container', async () => {
      vi.mocked(containerService.pauseContainer).mockResolvedValue();

      const { pauseContainer } = useContainerStore.getState();
      await pauseContainer('abc123');

      expect(containerService.pauseContainer).toHaveBeenCalledWith(
        mockRuntime,
        'abc123'
      );
    });

    it('should unpause a container', async () => {
      vi.mocked(containerService.unpauseContainer).mockResolvedValue();

      const { unpauseContainer } = useContainerStore.getState();
      await unpauseContainer('abc123');

      expect(containerService.unpauseContainer).toHaveBeenCalledWith(
        mockRuntime,
        'abc123'
      );
    });
  });

  describe('removeContainer', () => {
    it('should remove a container', async () => {
      vi.mocked(containerService.removeContainer).mockResolvedValue();
      vi.mocked(containerService.listContainers).mockResolvedValue([]);

      const { removeContainer } = useContainerStore.getState();
      await removeContainer('abc123', { force: true, volumes: true });

      expect(containerService.removeContainer).toHaveBeenCalledWith(
        mockRuntime,
        'abc123',
        true,
        true
      );
    });

    it('should clear selected container if removed', async () => {
      useContainerStore.setState({ selectedContainer: mockContainer });
      vi.mocked(containerService.removeContainer).mockResolvedValue();
      vi.mocked(containerService.listContainers).mockResolvedValue([]);

      const { removeContainer } = useContainerStore.getState();
      await removeContainer('abc123');

      const state = useContainerStore.getState();
      expect(state.selectedContainer).toBeNull();
      expect(state.containerDetails).toBeNull();
    });
  });

  describe('removeContainers', () => {
    it('should remove multiple containers', async () => {
      vi.mocked(containerService.removeContainers).mockResolvedValue(['abc123', 'def456']);
      vi.mocked(containerService.listContainers).mockResolvedValue([]);

      const { removeContainers } = useContainerStore.getState();
      await removeContainers(['abc123', 'def456'], { force: true, volumes: false });

      expect(containerService.removeContainers).toHaveBeenCalledWith(
        mockRuntime,
        ['abc123', 'def456'],
        true,
        false
      );
    });
  });

  describe('pruneContainers', () => {
    it('should prune stopped containers', async () => {
      const pruneResult: PruneResult = {
        containersDeleted: ['abc123'],
        spaceReclaimed: 1024,
      };
      vi.mocked(containerService.pruneContainers).mockResolvedValue(pruneResult);
      vi.mocked(containerService.listContainers).mockResolvedValue([]);

      const { pruneContainers } = useContainerStore.getState();
      const result = await pruneContainers();

      expect(result).toEqual(pruneResult);
      expect(containerService.pruneContainers).toHaveBeenCalledWith(mockRuntime);
    });
  });

  describe('error handling', () => {
    it('should set error message', () => {
      const { setError } = useContainerStore.getState();
      setError('Test error');

      expect(useContainerStore.getState().error).toBe('Test error');
    });

    it('should clear error message', () => {
      useContainerStore.setState({ error: 'Test error' });

      const { clearError } = useContainerStore.getState();
      clearError();

      expect(useContainerStore.getState().error).toBeNull();
    });
  });

  describe('auto-refresh', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should start auto-refresh', () => {
      vi.mocked(containerService.listContainers).mockResolvedValue([mockContainer]);

      const { startAutoRefresh } = useContainerStore.getState();
      startAutoRefresh(1000);

      const state = useContainerStore.getState();
      expect(state.refreshInterval).not.toBeNull();
    });

    it('should stop auto-refresh', () => {
      useContainerStore.setState({ refreshInterval: 123 as any });

      const { stopAutoRefresh } = useContainerStore.getState();
      stopAutoRefresh();

      const state = useContainerStore.getState();
      expect(state.refreshInterval).toBeNull();
    });
  });
});
