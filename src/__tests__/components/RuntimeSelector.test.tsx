import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RuntimeSelector } from '../../components/RuntimeSelector';
import { useRuntimeStore } from '../../stores/runtimeStore';
import type { Runtime } from '../../types/runtime';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(() => Promise.resolve({})),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

describe('RuntimeSelector', () => {
  const mockDockerRuntime: Runtime = {
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

  beforeEach(() => {
    useRuntimeStore.setState({
      runtimes: [],
      selectedRuntime: null,
      isDetecting: false,
      error: null,
    });
  });

  it('should not render when no runtimes available', () => {
    const { container } = render(<RuntimeSelector />);
    expect(container.firstChild).toBeNull();
  });

  it('should render selected runtime', () => {
    useRuntimeStore.setState({
      runtimes: [mockDockerRuntime, mockPodmanRuntime],
      selectedRuntime: mockDockerRuntime,
    });

    render(<RuntimeSelector />);
    
    expect(screen.getByText(/Docker 24.0.7/)).toBeInTheDocument();
    expect(screen.getByText(/running/i)).toBeInTheDocument();
  });

  it('should show docker icon for docker runtime', () => {
    useRuntimeStore.setState({
      runtimes: [mockDockerRuntime],
      selectedRuntime: mockDockerRuntime,
    });

    render(<RuntimeSelector />);
    expect(screen.getByText('🐳')).toBeInTheDocument();
  });

  it('should show podman icon for podman runtime', () => {
    useRuntimeStore.setState({
      runtimes: [mockPodmanRuntime],
      selectedRuntime: mockPodmanRuntime,
    });

    render(<RuntimeSelector />);
    expect(screen.getByText('🦭')).toBeInTheDocument();
  });

  it('should open dropdown when clicked', () => {
    useRuntimeStore.setState({
      runtimes: [mockDockerRuntime, mockPodmanRuntime],
      selectedRuntime: mockDockerRuntime,
    });

    render(<RuntimeSelector />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Should show both runtimes in dropdown
    const dockerOptions = screen.getAllByText(/Docker 24.0.7/);
    expect(dockerOptions.length).toBeGreaterThan(1); // One in button, one in dropdown
  });

  it('should show runtime mode when available', () => {
    useRuntimeStore.setState({
      runtimes: [mockPodmanRuntime],
      selectedRuntime: mockPodmanRuntime,
    });

    render(<RuntimeSelector />);
    expect(screen.getByText(/rootless/)).toBeInTheDocument();
  });

  it('should display placeholder when no runtime selected', () => {
    useRuntimeStore.setState({
      runtimes: [mockDockerRuntime],
      selectedRuntime: null,
    });

    render(<RuntimeSelector />);
    expect(screen.getByText('Select a runtime')).toBeInTheDocument();
  });

  it('should toggle dropdown visibility', () => {
    useRuntimeStore.setState({
      runtimes: [mockDockerRuntime, mockPodmanRuntime],
      selectedRuntime: mockDockerRuntime,
    });

    render(<RuntimeSelector />);
    
    const button = screen.getByRole('button');
    
    // Open dropdown
    fireEvent.click(button);
    let dockerOptions = screen.getAllByText(/Docker 24.0.7/);
    expect(dockerOptions.length).toBeGreaterThan(1);
    
    // Close dropdown
    fireEvent.click(button);
    dockerOptions = screen.getAllByText(/Docker 24.0.7/);
    expect(dockerOptions.length).toBe(1); // Only in button, not dropdown
  });

  it('should show version warning icon when versionWarning is true', () => {
    const runtimeWithWarning: Runtime = {
      ...mockDockerRuntime,
      versionWarning: true,
    };

    useRuntimeStore.setState({
      runtimes: [runtimeWithWarning],
      selectedRuntime: runtimeWithWarning,
    });

    render(<RuntimeSelector />);
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('should show WSL indicator when isWsl is true', () => {
    const wslRuntime: Runtime = {
      ...mockDockerRuntime,
      isWsl: true,
    };

    useRuntimeStore.setState({
      runtimes: [wslRuntime],
      selectedRuntime: null,
    });

    render(<RuntimeSelector />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText(/WSL2/)).toBeInTheDocument();
  });

  it('should show runtime path in dropdown', () => {
    useRuntimeStore.setState({
      runtimes: [mockDockerRuntime],
      selectedRuntime: null,
    });

    render(<RuntimeSelector />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('/usr/local/bin/docker')).toBeInTheDocument();
  });
});
