import { render, screen } from '@testing-library/react';
import App from './App';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

describe('App', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  it('renders without crashing', () => {
    render(<App />);
    // App should render with routing
    expect(document.body).toBeTruthy();
  });

  it('redirects to login when not authenticated', () => {
    localStorageMock.getItem.mockReturnValue(null);
    render(<App />);
    // Should show login page elements
    const signInText = screen.getByText(/Sign in to your account/i);
    expect(signInText).toBeInTheDocument();
  });
});
