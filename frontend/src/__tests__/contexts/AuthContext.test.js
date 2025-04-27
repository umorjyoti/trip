import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import * as api from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  getCurrentUser: jest.fn()
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { currentUser, login, logout, register, loading } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="user">{JSON.stringify(currentUser)}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => register('Test User', 'test@example.com', 'password')}>Register</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('provides the auth context to children', async () => {
    api.getCurrentUser.mockResolvedValue(null);
    
    let wrapper;
    await act(async () => {
      wrapper = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });
    
    const { getByTestId } = wrapper;
    
    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('false');
      expect(getByTestId('user').textContent).toBe('null');
    });
  });
  
  test('login updates the current user', async () => {
    const mockUser = { _id: 'user123', name: 'Test User', email: 'test@example.com' };
    api.getCurrentUser.mockResolvedValue(null);
    api.login.mockResolvedValue({ user: mockUser });
    
    let wrapper;
    await act(async () => {
      wrapper = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });
    
    const { getByTestId, getByText } = wrapper;
    
    // Click login button
    await act(async () => {
      getByText('Login').click();
    });
    
    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith('test@example.com', 'password');
      expect(getByTestId('user').textContent).toBe(JSON.stringify(mockUser));
    });
  });
  
  test('logout clears the current user', async () => {
    const mockUser = { _id: 'user123', name: 'Test User', email: 'test@example.com' };
    api.getCurrentUser.mockResolvedValue(mockUser);
    api.logout.mockResolvedValue({});
    
    let wrapper;
    await act(async () => {
      wrapper = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });
    
    const { getByTestId, getByText } = wrapper;
    
    await waitFor(() => {
      expect(getByTestId('user').textContent).toBe(JSON.stringify(mockUser));
    });
    
    // Click logout button
    await act(async () => {
      getByText('Logout').click();
    });
    
    await waitFor(() => {
      expect(api.logout).toHaveBeenCalled();
      expect(getByTestId('user').textContent).toBe('null');
    });
  });
}); 