import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookingForm from '../../components/BookingForm';
import { AuthProvider } from '../../contexts/AuthContext';
import * as api from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  createBooking: jest.fn()
}));

// Mock the auth context
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => ({
    currentUser: { _id: 'user123', name: 'Test User', email: 'test@example.com' }
  })
}));

describe('BookingForm Component', () => {
  const mockTrek = {
    _id: 'trek123',
    name: 'Test Trek',
    region: 'Himalayas'
  };
  
  const mockBatch = {
    _id: 'batch123',
    startDate: '2023-10-15',
    endDate: '2023-10-20',
    price: 1500,
    maxParticipants: 10,
    currentParticipants: 5
  };
  
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders form with trek and batch details', () => {
    render(
      <AuthProvider>
        <BookingForm 
          trek={mockTrek} 
          batch={mockBatch} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      </AuthProvider>
    );
    
    expect(screen.getByText(/Book Your Trek/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Trek/i)).toBeInTheDocument();
    expect(screen.getByText(/Oct 15, 2023/i)).toBeInTheDocument();
    expect(screen.getByText(/₹1,500/i)).toBeInTheDocument();
  });
  
  test('updates total price when participants change', () => {
    render(
      <AuthProvider>
        <BookingForm 
          trek={mockTrek} 
          batch={mockBatch} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      </AuthProvider>
    );
    
    const participantsInput = screen.getByLabelText(/Number of Participants/i);
    fireEvent.change(participantsInput, { target: { value: '3' } });
    
    expect(screen.getByText(/₹4,500/i)).toBeInTheDocument();
  });
  
  test('validates form before submission', async () => {
    render(
      <AuthProvider>
        <BookingForm 
          trek={mockTrek} 
          batch={mockBatch} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      </AuthProvider>
    );
    
    // Submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /Confirm Booking/i });
    fireEvent.click(submitButton);
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/Phone number is required/i)).toBeInTheDocument();
    });
    
    // API should not be called
    expect(api.createBooking).not.toHaveBeenCalled();
  });
  
  test('submits form with valid data', async () => {
    api.createBooking.mockResolvedValue({ _id: 'booking123' });
    
    render(
      <AuthProvider>
        <BookingForm 
          trek={mockTrek} 
          batch={mockBatch} 
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      </AuthProvider>
    );
    
    // Fill form fields
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { 
      target: { value: '1234567890' } 
    });
    
    // Fill emergency contact
    fireEvent.change(screen.getByLabelText(/Emergency Contact Name/i), { 
      target: { value: 'Emergency Contact' } 
    });
    fireEvent.change(screen.getByLabelText(/Relationship/i), { 
      target: { value: 'Parent' } 
    });
    fireEvent.change(screen.getByLabelText(/Emergency Contact Phone/i), { 
      target: { value: '9876543210' } 
    });
    
    // Fill participant details
    fireEvent.change(screen.getByLabelText(/Participant 1 Name/i), { 
      target: { value: 'Participant Name' } 
    });
    fireEvent.change(screen.getByLabelText(/Age/i), { 
      target: { value: '30' } 
    });
    const genderSelect = screen.getByLabelText(/Gender/i);
    fireEvent.change(genderSelect, { target: { value: 'Male' } });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Confirm Booking/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(api.createBooking).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
}); 