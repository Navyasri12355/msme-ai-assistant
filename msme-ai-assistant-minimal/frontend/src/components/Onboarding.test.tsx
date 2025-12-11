import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Onboarding } from './Onboarding';

describe('Onboarding Component', () => {
  it('should render the first onboarding step', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(<Onboarding onComplete={onComplete} onSkip={onSkip} />);

    expect(screen.getByText('Welcome to MSME AI Assistant')).toBeInTheDocument();
    expect(screen.getByText(/Your personal business advisor/)).toBeInTheDocument();
  });

  it('should navigate to next step when Next button is clicked', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(<Onboarding onComplete={onComplete} onSkip={onSkip} />);

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(screen.getByText('Your Business Dashboard')).toBeInTheDocument();
  });

  it('should call onSkip when Skip Tour is clicked', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(<Onboarding onComplete={onComplete} onSkip={onSkip} />);

    const skipButton = screen.getByText('Skip Tour');
    fireEvent.click(skipButton);

    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('should call onComplete when Get Started is clicked on last step', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(<Onboarding onComplete={onComplete} onSkip={onSkip} />);

    // Navigate to last step
    const nextButton = screen.getByText('Next');
    for (let i = 0; i < 5; i++) {
      fireEvent.click(nextButton);
    }

    const getStartedButton = screen.getByText('Get Started');
    fireEvent.click(getStartedButton);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('should show progress through steps', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(<Onboarding onComplete={onComplete} onSkip={onSkip} />);

    expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
  });

  it('should navigate backwards when Previous button is clicked', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(<Onboarding onComplete={onComplete} onSkip={onSkip} />);

    // Go to step 2
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    expect(screen.getByText('Your Business Dashboard')).toBeInTheDocument();

    // Go back to step 1
    const previousButton = screen.getByText('Previous');
    fireEvent.click(previousButton);
    expect(screen.getByText('Welcome to MSME AI Assistant')).toBeInTheDocument();
  });
});
