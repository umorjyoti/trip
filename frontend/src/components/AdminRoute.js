import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

function AdminRoute({ children }) {
  const { currentUser, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // If user is not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  // Check if user has admin role for dashboard access
  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2 text-gray-600">Only administrators can access the dashboard.</p>
        </div>
      </div>
    );
  }

  // If user is admin, grant access to dashboard
  return children;
}

export default AdminRoute; 