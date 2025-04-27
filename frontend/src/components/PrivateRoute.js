import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default PrivateRoute; 