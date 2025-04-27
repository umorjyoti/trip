import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { getCurrentUser, login as apiLogin, logout as apiLogout, register as apiRegister } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUser();
      setCurrentUser(userData);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const data = await apiLogin({ email, password });
      
      if (data.user) {
        setCurrentUser(data.user);
        toast.success('Logged in successfully!');
        return data.user;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Failed to login';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      if (!userData.username) {
        throw new Error('Username is required');
      }
      
      if (!userData.phone) {
        throw new Error('Phone number is required');
      }
      
      const response = await apiRegister(userData);
      return response.data;
    } catch (error) {
      console.error('Registration error in AuthContext:', error);
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || 'Registration failed');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await apiLogout();
      setCurrentUser(null);
      toast.success('Logged out successfully!');
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (category, permission) => {
    if (!currentUser) return false;
    return currentUser.group?.permissions?.[category]?.[permission] || false;
  };

  const isAdmin = () => {
    return currentUser?.role === 'admin';
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    refreshUser,
    hasPermission,
    isAdmin
  };

  console.log("current",currentUser)

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 