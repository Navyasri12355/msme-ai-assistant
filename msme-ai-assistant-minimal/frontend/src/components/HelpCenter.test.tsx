import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HelpCenter } from './HelpCenter';

describe('HelpCenter Component', () => {
  it('should render help center with search functionality', () => {
    const onClose = vi.fn();

    render(<HelpCenter onClose={onClose} />);

    expect(screen.getByText('Help Center')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search for help...')).toBeInTheDocument();
  });

  it('should filter articles by search query', () => {
    const onClose = vi.fn();

    render(<HelpCenter onClose={onClose} />);

    const searchInput = screen.getByPlaceholderText('Search for help...');
    fireEvent.change(searchInput, { target: { value: 'transaction' } });

    expect(screen.getByText('How do I add transactions?')).toBeInTheDocument();
  });

  it('should filter articles by category', () => {
    const onClose = vi.fn();

    render(<HelpCenter onClose={onClose} />);

    const marketingButton = screen.getByRole('button', { name: 'Marketing' });
    fireEvent.click(marketingButton);

    expect(screen.getByText('How do I get marketing advice?')).toBeInTheDocument();
  });

  it('should show no results message when search has no matches', () => {
    const onClose = vi.fn();

    render(<HelpCenter onClose={onClose} />);

    const searchInput = screen.getByPlaceholderText('Search for help...');
    fireEvent.change(searchInput, { target: { value: 'nonexistentquery12345' } });

    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('should call onClose when Close button is clicked', () => {
    const onClose = vi.fn();

    render(<HelpCenter onClose={onClose} />);

    const closeButtons = screen.getAllByText('Close');
    fireEvent.click(closeButtons[0]);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should display all categories', () => {
    const onClose = vi.fn();

    render(<HelpCenter onClose={onClose} />);

    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Getting Started' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Transactions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finance' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Marketing' })).toBeInTheDocument();
  });
});
