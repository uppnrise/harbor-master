import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContainerRow } from '../../../components/containers/ContainerRow';
import { ContainerState, type Container } from '../../../types/container';
import { ToastProvider } from '../../../contexts/ToastContext';

const mockContainer: Container = {
  id: 'abc123456789',
  name: 'test-container',
  image: 'nginx:latest',
  imageId: 'sha256:def456',
  command: 'nginx -g daemon off;',
  created: Date.now() / 1000 - 3600, // 1 hour ago
  state: ContainerState.Running,
  status: 'Up 1 hour',
  ports: [
    {
      containerPort: 80,
      hostPort: 8080,
      protocol: 'tcp',
      hostIp: '0.0.0.0',
    },
  ],
  labels: {},
  networks: [],
  mounts: [],
};

// Helper to wrap component with providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

describe('ContainerRow', () => {
  it('should render container information', () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <ContainerRow
        container={mockContainer}
        isSelected={false}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText('test-container')).toBeInTheDocument();
    expect(screen.getByText('abc123456789'.slice(0, 12))).toBeInTheDocument();
    expect(screen.getByText('nginx:latest')).toBeInTheDocument();
  });

  it('should display running status with green badge', () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <ContainerRow
        container={mockContainer}
        isSelected={false}
        onSelect={onSelect}
      />
    );

    const badge = screen.getByText('running');
    expect(badge).toBeInTheDocument();
  });

  it('should show stop and pause buttons for running container', () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <ContainerRow
        container={mockContainer}
        isSelected={false}
        onSelect={onSelect}
      />
    );

    expect(screen.getByLabelText(/stop test-container/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pause test-container/i)).toBeInTheDocument();
  });

  it('should show start button for stopped container', () => {
    const stoppedContainer = {
      ...mockContainer,
      state: ContainerState.Exited,
    };
    const onSelect = vi.fn();
    renderWithProviders(
      <ContainerRow
        container={stoppedContainer}
        isSelected={false}
        onSelect={onSelect}
      />
    );

    expect(screen.getByLabelText(/start test-container/i)).toBeInTheDocument();
  });

  it('should show unpause button for paused container', () => {
    const pausedContainer = {
      ...mockContainer,
      state: ContainerState.Paused,
    };
    const onSelect = vi.fn();
    renderWithProviders(
      <ContainerRow
        container={pausedContainer}
        isSelected={false}
        onSelect={onSelect}
      />
    );

    expect(screen.getByLabelText(/unpause test-container/i)).toBeInTheDocument();
  });

  it('should call onSelect when row clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = renderWithProviders(
      <ContainerRow
        container={mockContainer}
        isSelected={false}
        onSelect={onSelect}
      />
    );

    const row = container.querySelector('[role="button"][tabindex="0"]') as HTMLElement;
    await user.click(row);

    expect(onSelect).toHaveBeenCalledWith(mockContainer);
  });

  it('should highlight when selected', () => {
    const onSelect = vi.fn();
    const { container } = renderWithProviders(
      <ContainerRow
        container={mockContainer}
        isSelected={true}
        onSelect={onSelect}
      />
    );

    const row = container.querySelector('.grid') as HTMLElement;
    expect(row).toHaveClass('bg-blue-50');
  });

  it('should display ports correctly', () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <ContainerRow
        container={mockContainer}
        isSelected={false}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText('8080:80/tcp')).toBeInTheDocument();
  });

  it('should show dash when no ports', () => {
    const containerNoPorts = {
      ...mockContainer,
      ports: [],
    };
    const onSelect = vi.fn();
    renderWithProviders(
      <ContainerRow
        container={containerNoPorts}
        isSelected={false}
        onSelect={onSelect}
      />
    );

    // The dash for "no ports" is in the hidden lg:block section
    const portsSection = screen.getByText('-');
    expect(portsSection).toBeInTheDocument();
  });

  it('should format created time as relative', () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <ContainerRow
        container={mockContainer}
        isSelected={false}
        onSelect={onSelect}
      />
    );

    // Should show "1h ago" for container created 1 hour ago
    expect(screen.getByText(/1h ago/i)).toBeInTheDocument();
  });

  it('should truncate long container names', () => {
    const longNameContainer = {
      ...mockContainer,
      name: 'very-long-container-name-that-should-be-truncated-to-fit',
    };
    const onSelect = vi.fn();
    renderWithProviders(
      <ContainerRow
        container={longNameContainer}
        isSelected={false}
        onSelect={onSelect}
      />
    );

    const displayedName = screen.getByText(/very-long-container-name/);
    expect(displayedName.textContent).toMatch(/\.\.\./);
  });

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = renderWithProviders(
      <ContainerRow
        container={mockContainer}
        isSelected={false}
        onSelect={onSelect}
      />
    );

    const row = container.querySelector('[role="button"][tabindex="0"]') as HTMLElement;
    row.focus();
    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith(mockContainer);
  });
});
