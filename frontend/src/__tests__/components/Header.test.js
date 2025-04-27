import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import Header from '../../components/Header';

// Mock the auth context
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => ({
    currentUser: null,
    logout: jest.fn(),
    loading: false
  })
}));

describe('Header Component', () => {
  test('renders logo and navigation links', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Header />
        </AuthProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/TrekBooker/i)).toBeInTheDocument();
    expect(screen.getByText(/Treks/i)).toBeInTheDocument();
    expect(screen.getByText(/About/i)).toBeInTheDocument();
    expect(screen.getByText(/Contact/i)).toBeInTheDocument();
    expect(screen.getByText(/Regions/i)).toBeInTheDocument();
  });

  test('shows login and register links when user is not logged in', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Header />
        </AuthProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Log in/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign up/i)).toBeInTheDocument();
  });

  test('mobile menu toggle works', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Header />
        </AuthProvider>
      </BrowserRouter>
    );
    
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    fireEvent.click(menuButton);
    
    // Check if mobile menu is visible
    expect(screen.getByRole('button', { name: /close main menu/i })).toBeInTheDocument();
  });
}); 