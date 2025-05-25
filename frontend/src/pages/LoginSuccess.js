import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

function LoginSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentUser } = useAuth();

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const encodedData = params.get('data');
      const error = params.get('error');

      if (error) {
        const errorMessages = {
          'google_auth_failed': 'Failed to authenticate with Google',
          'user_not_found': 'User account not found',
          'default': 'Authentication failed'
        };
        const errorMessage = errorMessages[error] || errorMessages.default;
        window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: errorMessage }, '*');
        window.close();
        return;
      }

      if (encodedData) {
        const data = JSON.parse(decodeURIComponent(encodedData));
        if (data.token && data.user) {
          // Store the token
          localStorage.setItem('token', data.token);
          
          // Update auth context with complete user data
          setCurrentUser(data.user);

          // Send success message to parent window
          window.opener.postMessage({ 
            type: 'GOOGLE_AUTH_SUCCESS',
            data: data
          }, '*');

          // Close the popup window
          window.close();
        } else {
          throw new Error('Invalid authentication data received');
        }
      } else {
        throw new Error('No authentication data received');
      }
    } catch (error) {
      console.error('Login success error:', error);
      window.opener.postMessage({ 
        type: 'GOOGLE_AUTH_ERROR',
        error: 'Failed to process authentication response'
      }, '*');
      window.close();
    }
  }, [location, setCurrentUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-emerald-500"></div>
    </div>
  );
}

export default LoginSuccess; 