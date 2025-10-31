import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WelcomeScreen } from '../../components/WelcomeScreen';

describe('WelcomeScreen', () => {
  it('should render logo and title', () => {
    render(<WelcomeScreen isDetecting={false} />);
    
    expect(screen.getByText('⚓')).toBeInTheDocument();
    expect(screen.getByText('HarborMaster')).toBeInTheDocument();
    expect(screen.getByText('Master Your Containers')).toBeInTheDocument();
  });

  it('should show loading indicator when detecting', () => {
    render(<WelcomeScreen isDetecting={true} />);
    
    expect(screen.getByText('Detecting container runtimes...')).toBeInTheDocument();
    
    // Check for spinner (has border-b-2 class)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should hide loading indicator when not detecting', () => {
    render(<WelcomeScreen isDetecting={false} />);
    
    expect(screen.queryByText('Detecting container runtimes...')).not.toBeInTheDocument();
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).not.toBeInTheDocument();
  });

  it('should show help text when not detecting', () => {
    render(<WelcomeScreen isDetecting={false} />);
    
    expect(screen.getByText(/Supports Docker and Podman/)).toBeInTheDocument();
  });

  it('should hide help text when detecting', () => {
    render(<WelcomeScreen isDetecting={true} />);
    
    expect(screen.queryByText(/Supports Docker and Podman/)).not.toBeInTheDocument();
  });
});
