import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RuntimeError } from '../../components/RuntimeError';
import type { Runtime } from '../../types/runtime';

describe('RuntimeError', () => {
  const mockOnRetry = vi.fn();
  const mockOnSwitchRuntime = vi.fn();

  const mockDockerRuntime: Runtime = {
    id: 'docker-1',
    type: 'docker',
    version: { major: 24, minor: 0, patch: 7, full: '24.0.7' },
    status: 'error',
    path: '/usr/local/bin/docker',
    lastChecked: '2025-10-30T12:00:00Z',
    detectedAt: '2025-10-30T11:00:00Z',
    error: 'Connection failed',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render error message', () => {
    render(
      <RuntimeError
        runtime={mockDockerRuntime}
        onRetry={mockOnRetry}
        hasAlternatives={false}
      />
    );
    
    expect(screen.getByText('Docker Connection Error')).toBeInTheDocument();
    expect(screen.getByText(/Unable to connect to Docker/)).toBeInTheDocument();
  });

  it('should show retry button', () => {
    render(
      <RuntimeError
        runtime={mockDockerRuntime}
        onRetry={mockOnRetry}
        hasAlternatives={false}
      />
    );
    
    const retryButton = screen.getByRole('button', { name: /Retry Connection/ });
    expect(retryButton).toBeInTheDocument();
  });

  it('should call onRetry when retry button clicked', async () => {
    render(
      <RuntimeError
        runtime={mockDockerRuntime}
        onRetry={mockOnRetry}
        hasAlternatives={false}
      />
    );
    
    const retryButton = screen.getByRole('button', { name: /Retry Connection/ });
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });
  });

  it('should show loading state when retrying', async () => {
    mockOnRetry.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
    
    render(
      <RuntimeError
        runtime={mockDockerRuntime}
        onRetry={mockOnRetry}
        hasAlternatives={false}
      />
    );
    
    const retryButton = screen.getByRole('button', { name: /Retry Connection/ });
    fireEvent.click(retryButton);
    
    expect(screen.getByText('Retrying...')).toBeInTheDocument();
    expect(retryButton).toBeDisabled();
  });

  it('should show switch runtime button when alternatives available', () => {
    render(
      <RuntimeError
        runtime={mockDockerRuntime}
        onRetry={mockOnRetry}
        onSwitchRuntime={mockOnSwitchRuntime}
        hasAlternatives={true}
      />
    );
    
    expect(screen.getByText('Try Alternative Runtime')).toBeInTheDocument();
  });

  it('should not show switch runtime button when no alternatives', () => {
    render(
      <RuntimeError
        runtime={mockDockerRuntime}
        onRetry={mockOnRetry}
        hasAlternatives={false}
      />
    );
    
    expect(screen.queryByText('Try Alternative Runtime')).not.toBeInTheDocument();
  });

  it('should call onSwitchRuntime when switch button clicked', () => {
    render(
      <RuntimeError
        runtime={mockDockerRuntime}
        onRetry={mockOnRetry}
        onSwitchRuntime={mockOnSwitchRuntime}
        hasAlternatives={true}
      />
    );
    
    const switchButton = screen.getByText('Try Alternative Runtime');
    fireEvent.click(switchButton);
    
    expect(mockOnSwitchRuntime).toHaveBeenCalledTimes(1);
  });

  it('should show permission denied error details', () => {
    const permissionRuntime: Runtime = {
      ...mockDockerRuntime,
      error: 'permission denied',
    };
    
    render(
      <RuntimeError
        runtime={permissionRuntime}
        onRetry={mockOnRetry}
        hasAlternatives={false}
      />
    );
    
    expect(screen.getByText('Permission Denied')).toBeInTheDocument();
    expect(screen.getByText(/don't have permission/)).toBeInTheDocument();
  });

  it('should show not found error details', () => {
    const notFoundRuntime: Runtime = {
      ...mockDockerRuntime,
      error: 'not found',
    };
    
    render(
      <RuntimeError
        runtime={notFoundRuntime}
        onRetry={mockOnRetry}
        hasAlternatives={false}
      />
    );
    
    expect(screen.getByText('Docker Not Found')).toBeInTheDocument();
    expect(screen.getByText(/executable was not found/)).toBeInTheDocument();
  });

  it('should show timeout error details', () => {
    const timeoutRuntime: Runtime = {
      ...mockDockerRuntime,
      error: 'timeout',
    };
    
    render(
      <RuntimeError
        runtime={timeoutRuntime}
        onRetry={mockOnRetry}
        hasAlternatives={false}
      />
    );
    
    expect(screen.getByText('Connection Timeout')).toBeInTheDocument();
    expect(screen.getByText(/Connection to Docker timed out/)).toBeInTheDocument();
  });

  it('should show troubleshooting suggestions', () => {
    render(
      <RuntimeError
        runtime={mockDockerRuntime}
        onRetry={mockOnRetry}
        hasAlternatives={false}
      />
    );
    
    expect(screen.getByText(/Try these steps:/)).toBeInTheDocument();
    expect(screen.getByText(/Start the Docker daemon/)).toBeInTheDocument();
  });

  it('should have troubleshooting guide link', () => {
    render(
      <RuntimeError
        runtime={mockDockerRuntime}
        onRetry={mockOnRetry}
        hasAlternatives={false}
      />
    );
    
    const link = screen.getByText('Troubleshooting Guide');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', expect.stringContaining('docker'));
  });

  it('should link to Podman docs for Podman runtime', () => {
    const podmanRuntime: Runtime = {
      ...mockDockerRuntime,
      type: 'podman',
    };
    
    render(
      <RuntimeError
        runtime={podmanRuntime}
        onRetry={mockOnRetry}
        hasAlternatives={false}
      />
    );
    
    const link = screen.getByText('Troubleshooting Guide').closest('a');
    expect(link).toHaveAttribute('href', expect.stringContaining('podman'));
  });

  it('should render Podman error title correctly', () => {
    const podmanRuntime: Runtime = {
      ...mockDockerRuntime,
      type: 'podman',
    };
    
    render(
      <RuntimeError
        runtime={podmanRuntime}
        onRetry={mockOnRetry}
        hasAlternatives={false}
      />
    );
    
    expect(screen.getByText('Podman Connection Error')).toBeInTheDocument();
  });
});
