import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StatusIndicator } from '../../components/StatusIndicator';

describe('StatusIndicator', () => {
  it('should render with default medium size', () => {
    const { container } = render(<StatusIndicator status="running" />);
    const indicator = container.querySelector('.h-3.w-3');
    expect(indicator).toBeInTheDocument();
  });

  it('should render small size', () => {
    const { container } = render(<StatusIndicator status="running" size="sm" />);
    const indicator = container.querySelector('.h-2.w-2');
    expect(indicator).toBeInTheDocument();
  });

  it('should render large size', () => {
    const { container } = render(<StatusIndicator status="running" size="lg" />);
    const indicator = container.querySelector('.h-4.w-4');
    expect(indicator).toBeInTheDocument();
  });

  it('should show green color for running status', () => {
    const { container } = render(<StatusIndicator status="running" />);
    const indicator = container.querySelector('.bg-green-500');
    expect(indicator).toBeInTheDocument();
  });

  it('should show gray color for stopped status', () => {
    const { container } = render(<StatusIndicator status="stopped" />);
    const indicator = container.querySelector('.bg-gray-500');
    expect(indicator).toBeInTheDocument();
  });

  it('should show red color for error status', () => {
    const { container } = render(<StatusIndicator status="error" />);
    const indicator = container.querySelector('.bg-red-500');
    expect(indicator).toBeInTheDocument();
  });

  it('should show yellow color for unknown status', () => {
    const { container } = render(<StatusIndicator status="unknown" />);
    const indicator = container.querySelector('.bg-yellow-500');
    expect(indicator).toBeInTheDocument();
  });

  it('should show blue pulsing color for detecting status', () => {
    const { container } = render(<StatusIndicator status="detecting" />);
    const indicator = container.querySelector('.bg-blue-500.animate-pulse');
    expect(indicator).toBeInTheDocument();
  });

  it('should have rounded-full class', () => {
    const { container } = render(<StatusIndicator status="running" />);
    const indicator = container.querySelector('.rounded-full');
    expect(indicator).toBeInTheDocument();
  });

  it('should have aria-label for accessibility', () => {
    const { getByLabelText } = render(<StatusIndicator status="running" />);
    expect(getByLabelText('Status: running')).toBeInTheDocument();
  });

  it('should have capitalized title attribute', () => {
    const { container } = render(<StatusIndicator status="error" />);
    const indicator = container.querySelector('[title="Error"]');
    expect(indicator).toBeInTheDocument();
  });
});
