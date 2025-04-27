import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function UserDebug() {
  const { currentUser } = useAuth();
  
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px', 
      background: '#f0f0f0', 
      padding: '10px', 
      borderRadius: '5px',
      zIndex: 9999,
      maxWidth: '300px',
      fontSize: '12px'
    }}>
      <h4>Debug: Current User</h4>
      <pre>{JSON.stringify(currentUser, null, 2)}</pre>
    </div>
  );
}

export default UserDebug; 