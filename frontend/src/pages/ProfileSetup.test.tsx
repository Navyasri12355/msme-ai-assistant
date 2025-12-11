import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProfileSetup } from './ProfileSetup';
import { AuthProvider } from '../contexts/AuthContext';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => 'fake-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

const renderProfileSetup = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ProfileSetup />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ProfileSetup', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  it('renders profile setup form', () => {
    renderProfileSetup();
    expect(screen.getByText(/Set up your business profile/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Business Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Business Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Industry/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Audience/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Number of Employees/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Established Date/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderProfileSetup();
    const businessNameInput = screen.getByLabelText(/Business Name/i);

    // Try to blur without entering value
    fireEvent.blur(businessNameInput);
    await waitFor(() => {
      expect(screen.getByText(/Business name is required/i)).toBeInTheDocument();
    });
  });

  it('validates employee count is positive', async () => {
    renderProfileSetup();
    const employeeCountInput = screen.getByLabelText(/Number of Employees/i);

    // Enter negative number
    fireEvent.change(employeeCountInput, { target: { value: '-1' } });
    fireEvent.blur(employeeCountInput);
    await waitFor(() => {
      expect(screen.getByText(/Employee count must be a positive number/i)).toBeInTheDocument();
    });
  });

  it('validates established date is in the past', async () => {
    renderProfileSetup();
    const establishedDateInput = screen.getByLabelText(/Established Date/i);

    // Enter future date
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateString = futureDate.toISOString().split('T')[0];

    fireEvent.change(establishedDateInput, { target: { value: futureDateString } });
    fireEvent.blur(establishedDateInput);
    await waitFor(() => {
      expect(screen.getByText(/Established date must be in the past/i)).toBeInTheDocument();
    });
  });

  it('shows all business type options', () => {
    renderProfileSetup();
    const businessTypeSelect = screen.getByLabelText(/Business Type/i);
    
    expect(businessTypeSelect).toBeInTheDocument();
    // Check that select has options (including the placeholder)
    const options = businessTypeSelect.querySelectorAll('option');
    expect(options.length).toBeGreaterThan(1);
  });

  it('shows all industry options', () => {
    renderProfileSetup();
    const industrySelect = screen.getByLabelText(/Industry/i);
    
    expect(industrySelect).toBeInTheDocument();
    // Check that select has options (including the placeholder)
    const options = industrySelect.querySelectorAll('option');
    expect(options.length).toBeGreaterThan(1);
  });
});
