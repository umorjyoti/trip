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
      const reason = params.get('reason');

      console.log('LoginSuccess params:', { encodedData, error, reason });

      if (error) {
        const errorMessages = {
          'google_auth_failed': {
            'no_user': 'Failed to get user information from Google',
            'no_email': 'No email address provided by Google',
            'validation_error': 'Invalid user data received',
            'invalid_id': 'Invalid user ID format',
            'duplicate_email': 'Email already exists with a different account',
            'unknown': 'Failed to authenticate with Google'
          },
          'user_not_found': 'User account not found',
          'default': 'Authentication failed'
        };

        const errorMessage = errorMessages[error]?.[reason] || errorMessages[error] || errorMessages.default;
        console.error('Authentication error:', errorMessage);
        window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: errorMessage }, '*');
        window.close();
        return;
      }

      if (!encodedData) {
        throw new Error('No authentication data received');
      }

      let data;
      try {
        data = JSON.parse(decodeURIComponent(encodedData));
        console.log('Decoded auth data:', data);
      } catch (parseError) {
        console.error('Failed to parse auth data:', parseError);
        throw new Error('Invalid authentication data format');
      }

      if (!data.token || !data.user) {
        console.error('Missing required auth data:', data);
        throw new Error('Invalid authentication data structure');
      }

      // Store the token
      localStorage.setItem('token', data.token);
      
      // Update auth context with complete user data
      setCurrentUser(data.user);

      // Send success message to parent window
      window.opener.postMessage({ 
        type: 'GOOGLE_AUTH_SUCCESS',
        data: data,
        isNewUser: data.isNewUser || false
      }, '*');

      // Close the popup window
      window.close();
    } catch (error) {
      console.error('Login success error:', error);
      window.opener.postMessage({ 
        type: 'GOOGLE_AUTH_ERROR',
        error: error.message || 'Failed to process authentication response'
      }, '*');
      window.close();
    }
  }, [location, setCurrentUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Processing authentication...</h2>
        <p className="mt-2 text-gray-600">Please wait while we complete your sign in.</p>
      </div>
    </div>
  );
}

export default LoginSuccess; 