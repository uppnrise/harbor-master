import { describe, it, expect, beforeEach } from 'vitest';
import { useRuntimeStore } from '../../stores/runtimeStore';
import type { Runtime } from '../../types/runtime';

describe('runtimeStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useRuntimeStore.setState({
      runtimes: [],
      selectedRuntime: null,
      isDetecting: false,
      error: null,
    });
  });

  const mockRuntime: Runtime = {
    id: 'docker-1',
    type: 'docker',
    version: { major: 24, minor: 0, patch: 7, full: '24.0.7' },
    status: 'running',
    path: '/usr/local/bin/docker',
    lastChecked: '2025-10-30T12:00:00Z',
    detectedAt: '2025-10-30T11:00:00Z',
  };

  const mockPodmanRuntime: Runtime = {
    id: 'podman-1',
    type: 'podman',
    version: { major: 4, minor: 5, patch: 1, full: '4.5.1' },
    status: 'stopped',
    path: '/usr/local/bin/podman',
    lastChecked: '2025-10-30T12:00:00Z',
    detectedAt: '2025-10-30T11:00:00Z',
    mode: 'rootless',
  };

  describe('setRuntimes', () => {
    it('should set runtimes array', () => {
      const { setRuntimes } = useRuntimeStore.getState();
      
      setRuntimes([mockRuntime, mockPodmanRuntime]);
      
      const state = useRuntimeStore.getState();
      expect(state.runtimes).toHaveLength(2);
      expect(state.runtimes[0]!.id).toBe('docker-1');
      expect(state.runtimes[1]!.id).toBe('podman-1');
    });

    it('should replace existing runtimes', () => {
      useRuntimeStore.setState({ runtimes: [mockRuntime] });
      
      const { setRuntimes } = useRuntimeStore.getState();
      setRuntimes([mockPodmanRuntime]);
      
      const state = useRuntimeStore.getState();
      expect(state.runtimes).toHaveLength(1);
      expect(state.runtimes[0]!.id).toBe('podman-1');
    });
  });

  describe('setSelectedRuntime', () => {
    it('should set selected runtime', () => {
      const { setSelectedRuntime } = useRuntimeStore.getState();
      
      setSelectedRuntime(mockRuntime);
      
      const state = useRuntimeStore.getState();
      expect(state.selectedRuntime).toEqual(mockRuntime);
    });

    it('should clear selected runtime when set to null', () => {
      useRuntimeStore.setState({ selectedRuntime: mockRuntime });
      
      const { setSelectedRuntime } = useRuntimeStore.getState();
      setSelectedRuntime(null);
      
      const state = useRuntimeStore.getState();
      expect(state.selectedRuntime).toBeNull();
    });
  });

  describe('setDetecting', () => {
    it('should set detecting flag to true', () => {
      const { setDetecting } = useRuntimeStore.getState();
      
      setDetecting(true);
      
      expect(useRuntimeStore.getState().isDetecting).toBe(true);
    });

    it('should set detecting flag to false', () => {
      useRuntimeStore.setState({ isDetecting: true });
      
      const { setDetecting } = useRuntimeStore.getState();
      setDetecting(false);
      
      expect(useRuntimeStore.getState().isDetecting).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const { setError } = useRuntimeStore.getState();
      
      setError('Failed to detect runtimes');
      
      expect(useRuntimeStore.getState().error).toBe('Failed to detect runtimes');
    });

    it('should clear error when set to null', () => {
      useRuntimeStore.setState({ error: 'Some error' });
      
      const { setError } = useRuntimeStore.getState();
      setError(null);
      
      expect(useRuntimeStore.getState().error).toBeNull();
    });
  });

  describe('updateRuntimeStatus', () => {
    beforeEach(() => {
      useRuntimeStore.setState({
        runtimes: [mockRuntime, mockPodmanRuntime],
        selectedRuntime: mockRuntime,
      });
    });

    it('should update runtime status', () => {
      const { updateRuntimeStatus } = useRuntimeStore.getState();
      
      updateRuntimeStatus('docker-1', 'stopped', '2025-10-30T13:00:00Z');
      
      const state = useRuntimeStore.getState();
      const updatedRuntime = state.runtimes.find((r) => r.id === 'docker-1');
      expect(updatedRuntime?.status).toBe('stopped');
      expect(updatedRuntime?.lastChecked).toBe('2025-10-30T13:00:00Z');
    });

    it('should update runtime with error message', () => {
      const { updateRuntimeStatus } = useRuntimeStore.getState();
      
      updateRuntimeStatus('docker-1', 'error', '2025-10-30T13:00:00Z', 'Connection failed');
      
      const state = useRuntimeStore.getState();
      const updatedRuntime = state.runtimes.find((r) => r.id === 'docker-1');
      expect(updatedRuntime?.status).toBe('error');
      expect(updatedRuntime?.error).toBe('Connection failed');
    });

    it('should update selected runtime if it matches', () => {
      const { updateRuntimeStatus } = useRuntimeStore.getState();
      
      updateRuntimeStatus('docker-1', 'stopped', '2025-10-30T13:00:00Z');
      
      const state = useRuntimeStore.getState();
      expect(state.selectedRuntime?.status).toBe('stopped');
      expect(state.selectedRuntime?.lastChecked).toBe('2025-10-30T13:00:00Z');
    });

    it('should not affect other runtimes', () => {
      const { updateRuntimeStatus } = useRuntimeStore.getState();
      
      updateRuntimeStatus('docker-1', 'error', '2025-10-30T13:00:00Z');
      
      const state = useRuntimeStore.getState();
      const podmanRuntime = state.runtimes.find((r) => r.id === 'podman-1');
      expect(podmanRuntime?.status).toBe('stopped'); // Unchanged
    });
  });

  describe('addRuntime', () => {
    it('should add new runtime to empty list', () => {
      const { addRuntime } = useRuntimeStore.getState();
      
      addRuntime(mockRuntime);
      
      const state = useRuntimeStore.getState();
      expect(state.runtimes).toHaveLength(1);
      expect(state.runtimes[0]).toEqual(mockRuntime);
    });

    it('should append runtime to existing list', () => {
      useRuntimeStore.setState({ runtimes: [mockRuntime] });
      
      const { addRuntime } = useRuntimeStore.getState();
      addRuntime(mockPodmanRuntime);
      
      const state = useRuntimeStore.getState();
      expect(state.runtimes).toHaveLength(2);
      expect(state.runtimes[1]).toEqual(mockPodmanRuntime);
    });
  });

  describe('removeRuntime', () => {
    beforeEach(() => {
      useRuntimeStore.setState({
        runtimes: [mockRuntime, mockPodmanRuntime],
        selectedRuntime: mockRuntime,
      });
    });

    it('should remove runtime from list', () => {
      const { removeRuntime } = useRuntimeStore.getState();
      
      removeRuntime('docker-1');
      
      const state = useRuntimeStore.getState();
      expect(state.runtimes).toHaveLength(1);
      expect(state.runtimes[0]!.id).toBe('podman-1');
    });

    it('should clear selected runtime if removed', () => {
      const { removeRuntime } = useRuntimeStore.getState();
      
      removeRuntime('docker-1');
      
      const state = useRuntimeStore.getState();
      expect(state.selectedRuntime).toBeNull();
    });

    it('should keep selected runtime if different one removed', () => {
      const { removeRuntime } = useRuntimeStore.getState();
      
      removeRuntime('podman-1');
      
      const state = useRuntimeStore.getState();
      expect(state.selectedRuntime?.id).toBe('docker-1');
    });
  });

  describe('clearRuntimes', () => {
    beforeEach(() => {
      useRuntimeStore.setState({
        runtimes: [mockRuntime, mockPodmanRuntime],
        selectedRuntime: mockRuntime,
      });
    });

    it('should clear all runtimes', () => {
      const { clearRuntimes } = useRuntimeStore.getState();
      
      clearRuntimes();
      
      const state = useRuntimeStore.getState();
      expect(state.runtimes).toHaveLength(0);
    });

    it('should clear selected runtime', () => {
      const { clearRuntimes } = useRuntimeStore.getState();
      
      clearRuntimes();
      
      const state = useRuntimeStore.getState();
      expect(state.selectedRuntime).toBeNull();
    });
  });
});
