import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NoRuntimesMessage } from '../../components/NoRuntimesMessage';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const { invoke } = await import('@tauri-apps/api/core');

describe('NoRuntimesMessage', () => {
  const mockOnRetry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (invoke as ReturnType<typeof vi.fn>).mockResolvedValue('Darwin');
  });

  it('should render no runtimes message', () => {
    render(<NoRuntimesMessage onRetry={mockOnRetry} />);
    
    expect(screen.getByText('No Container Runtimes Detected')).toBeInTheDocument();
    expect(screen.getByText(/HarborMaster couldn't find Docker or Podman/)).toBeInTheDocument();
  });

  it('should show Docker installation option', () => {
    render(<NoRuntimesMessage onRetry={mockOnRetry} />);
    
    expect(screen.getByText('Docker Desktop')).toBeInTheDocument();
    expect(screen.getByText(/The most popular choice/)).toBeInTheDocument();
  });

  it('should show Podman installation option', () => {
    render(<NoRuntimesMessage onRetry={mockOnRetry} />);
    
    expect(screen.getByText('Podman')).toBeInTheDocument();
    expect(screen.getByText(/Daemonless container engine/)).toBeInTheDocument();
  });

  it('should have retry button', () => {
    render(<NoRuntimesMessage onRetry={mockOnRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /Retry Detection/ });
    expect(retryButton).toBeInTheDocument();
  });

  it('should call onRetry when retry button clicked', async () => {
    render(<NoRuntimesMessage onRetry={mockOnRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /Retry Detection/ });
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });
  });

  it('should show loading state when retrying', async () => {
    mockOnRetry.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
    
    render(<NoRuntimesMessage onRetry={mockOnRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /Retry Detection/ });
    fireEvent.click(retryButton);
    
    expect(screen.getByText('Checking for runtimes...')).toBeInTheDocument();
    expect(retryButton).toBeDisabled();
  });

  it('should detect macOS platform and show appropriate links', async () => {
    (invoke as ReturnType<typeof vi.fn>).mockResolvedValue('Darwin');
    
    render(<NoRuntimesMessage onRetry={mockOnRetry} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Install Docker for macOS/)).toBeInTheDocument();
      expect(screen.getByText(/Install Podman for macOS/)).toBeInTheDocument();
    });
  });

  it('should detect Windows platform and show appropriate links', async () => {
    (invoke as ReturnType<typeof vi.fn>).mockResolvedValue('Windows');
    
    render(<NoRuntimesMessage onRetry={mockOnRetry} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Install Docker for Windows/)).toBeInTheDocument();
      expect(screen.getByText(/Install Podman for Windows/)).toBeInTheDocument();
    });
  });

  it('should detect Linux platform and show appropriate links', async () => {
    (invoke as ReturnType<typeof vi.fn>).mockResolvedValue('Linux');
    
    render(<NoRuntimesMessage onRetry={mockOnRetry} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Install Docker for Linux/)).toBeInTheDocument();
      expect(screen.getByText(/Install Podman for Linux/)).toBeInTheDocument();
    });
  });

  it('should have troubleshooting guide link', () => {
    render(<NoRuntimesMessage onRetry={mockOnRetry} />);
    
    const link = screen.getByText('View Troubleshooting Guide');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', expect.stringContaining('troubleshooting'));
  });

  it('should have external links that open in new tab', () => {
    render(<NoRuntimesMessage onRetry={mockOnRetry} />);
    
    const dockerLink = screen.getByText(/Install Docker for/).closest('a');
    expect(dockerLink).toHaveAttribute('target', '_blank');
    expect(dockerLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
