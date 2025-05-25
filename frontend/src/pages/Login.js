import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { FcGoogle } from 'react-icons/fc';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, setCurrentUser } = useAuth();

  // Get the redirect path from location state
  const from = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      await login(email, password);
      navigate(from);
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    try {
      // Calculate popup window dimensions
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2.5;

      // Open Google OAuth URL in a popup window
      const baseUrl = process.env.REACT_APP_API_URL ;
      const googleAuthUrl = baseUrl.endsWith('/api') 
        ? `${baseUrl.slice(0, -4)}/api/auth/google`  // Remove trailing /api if it exists
        : `${baseUrl}/api/auth/google`;
      
      console.log('Base URL:', baseUrl);
      console.log('Final Google Auth URL:', googleAuthUrl);
      
      const popup = window.open(
        googleAuthUrl,
        'Google Sign In',
        `toolbar=no, menubar=no, width=${width}, height=${height}, left=${left}, top=${top}`
      );

      if (!popup) {
        toast.error('Popup was blocked. Please allow popups for this site.');
        return;
      }

      // Handle popup window events
      const checkPopup = setInterval(() => {
        try {
          if (!popup || popup.closed) {
            clearInterval(checkPopup);
            return;
          }
        } catch (error) {
          // Ignore cross-origin frame access errors
          if (!error.message.includes('cross-origin')) {
            console.error('Popup error:', error);
            clearInterval(checkPopup);
            toast.error('Failed to sign in with Google');
            if (popup) popup.close();
          }
        }
      }, 1000);

      // Listen for messages from the popup
      const handleMessage = (event) => {
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          const { data } = event.data;
          // Store the token
          localStorage.setItem('token', data.token);
          // Update auth context with user data
          setCurrentUser(data.user);
          // Show success message
          toast.success('Successfully signed in with Google');
          // Navigate to the redirect path
          navigate(from);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          toast.error(event.data.error || 'Failed to sign in with Google');
        }
      };

      // Add message listener
      window.addEventListener('message', handleMessage);

      // Cleanup
      return () => {
        clearInterval(checkPopup);
        window.removeEventListener('message', handleMessage);
      };
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Failed to sign in with Google. Please try again or use email/password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-emerald-600 hover:text-emerald-500">
              create a new account
            </Link>
          </p>
        </div>

        {/* Google Sign-In Button */}
        <div>
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <FcGoogle className="w-5 h-5 mr-2" />
            Sign in with Google
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-emerald-400"
            >
              {loading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <LoadingSpinner />
                </span>
              ) : (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg
                    className="h-5 w-5 text-emerald-500 group-hover:text-emerald-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login; 