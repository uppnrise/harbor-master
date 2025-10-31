import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast } from '../../components/Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render success toast', () => {
    const onClose = vi.fn();
    const { container } = render(<Toast message="Success message" type="success" onClose={onClose} />);
    
    expect(screen.getByText('Success message')).toBeTruthy();
    const toastDiv = container.firstChild as HTMLElement;
    expect(toastDiv.className).toContain('bg-green-600');
  });

  it('should render error toast', () => {
    const onClose = vi.fn();
    const { container } = render(<Toast message="Error message" type="error" onClose={onClose} />);
    
    expect(screen.getByText('Error message')).toBeTruthy();
    const toastDiv = container.firstChild as HTMLElement;
    expect(toastDiv.className).toContain('bg-red-600');
  });

  it('should render info toast', () => {
    const onClose = vi.fn();
    const { container } = render(<Toast message="Info message" type="info" onClose={onClose} />);
    
    expect(screen.getByText('Info message')).toBeTruthy();
    const toastDiv = container.firstChild as HTMLElement;
    expect(toastDiv.className).toContain('bg-blue-600');
  });

  it('should call onClose when close button is clicked', async () => {
    vi.useRealTimers(); // Use real timers for user interaction
    const onClose = vi.fn();
    render(<Toast message="Test message" type="success" onClose={onClose} />);
    
    const closeButton = screen.getByRole('button');
    await userEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
    vi.useFakeTimers(); // Restore fake timers
  });

  it('should auto-dismiss after default duration', () => {
    const onClose = vi.fn();
    render(<Toast message="Auto dismiss" type="success" onClose={onClose} />);
    
    expect(onClose).not.toHaveBeenCalled();
    
    // Fast-forward 3 seconds (default duration)
    vi.advanceTimersByTime(3000);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should auto-dismiss after custom duration', () => {
    const onClose = vi.fn();
    render(<Toast message="Custom duration" type="success" onClose={onClose} duration={5000} />);
    
    // Fast-forward 3 seconds (should not dismiss yet)
    vi.advanceTimersByTime(3000);
    expect(onClose).not.toHaveBeenCalled();
    
    // Fast-forward another 2 seconds (total 5 seconds)
    vi.advanceTimersByTime(2000);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should clear timeout on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = render(<Toast message="Test" type="success" onClose={onClose} />);
    
    unmount();
    vi.advanceTimersByTime(3000);
    
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should have slide-in animation class', () => {
    const onClose = vi.fn();
    const { container } = render(<Toast message="Animated" type="success" onClose={onClose} />);
    
    const toastDiv = container.firstChild as HTMLElement;
    expect(toastDiv.className).toContain('animate-slide-in');
  });

  it('should display message text', () => {
    const onClose = vi.fn();
    render(<Toast message="Test notification message" type="info" onClose={onClose} />);
    
    expect(screen.getByText('Test notification message')).toBeTruthy();
  });
});
