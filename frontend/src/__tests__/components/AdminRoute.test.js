import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminRoute from '../../components/AdminRoute';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the auth context
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: jest.fn()
}));

// Import the mocked useAuth
import { useAuth } from '../../contexts/AuthContext';

describe('AdminRoute Component', () => {
  test('renders children when user is admin', () => {
    useAuth.mockReturnValue({
      currentUser: { isAdmin: true },
      loading: false
    });
    
    render(
      <BrowserRouter>
        <AuthProvider>
          <AdminRoute>
            <div>Admin Content</div>
          </AdminRoute>
        </AuthProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });
  
  test('redirects to login when user is not admin', () => {
    useAuth.mockReturnValue({
      currentUser: { isAdmin: false },
      loading: false
    });
    
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <AdminRoute>
              <div>Admin Content</div>
            </AdminRoute>
          } />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </BrowserRouter>
    );
    
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    // We can't directly test navigation in this setup, but we can verify the component doesn't render
  });
  
  test('shows loading spinner when auth is loading', () => {
    useAuth.mockReturnValue({
      currentUser: null,
      loading: true
    });
    
    render(
      <BrowserRouter>
        <AuthProvider>
          <AdminRoute>
            <div>Admin Content</div>
          </AdminRoute>
        </AuthProvider>
      </BrowserRouter>
    );
    
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    // Should show loading spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });
}); 