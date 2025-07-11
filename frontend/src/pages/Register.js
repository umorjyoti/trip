import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { FcGoogle } from 'react-icons/fc';
import LoadingSpinner from '../components/LoadingSpinner';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, currentUser, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect path from URL query params or default to home
  const redirectPath = new URLSearchParams(location.search).get('redirect') || '/';

  const handleGoogleSignIn = () => {
    try {
      setLoading(true);
      // Calculate popup window dimensions
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2.5;

      // Open Google OAuth URL in a popup window
      const baseUrl = process.env.REACT_APP_API_URL;
      console.log('baseUrl', baseUrl);
      const googleAuthUrl = `${baseUrl}/auth/google`;
      
      console.log('Opening Google auth URL:', googleAuthUrl);
      
      const popup = window.open(
        googleAuthUrl,
        'Google Sign In',
        `toolbar=no, menubar=no, width=${width}, height=${height}, left=${left}, top=${top}`
      );

      if (!popup) {
        toast.error('Popup was blocked. Please allow popups for this site.');
        setLoading(false);
        return;
      }

      // Handle popup window events
      const checkPopup = setInterval(() => {
        try {
          if (!popup || popup.closed) {
            clearInterval(checkPopup);
            setLoading(false);
            return;
          }
        } catch (error) {
          if (!error.message.includes('cross-origin')) {
            console.error('Popup error:', error);
            clearInterval(checkPopup);
            toast.error('Failed to sign in with Google');
            setLoading(false);
            if (popup) popup.close();
          }
        }
      }, 1000);

      // Listen for messages from the popup
      const handleMessage = (event) => {
        // Only process messages from our popup
        if (event.source !== popup) return;

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          const { data, isNewUser } = event.data;
          // Store the token
          localStorage.setItem('token', data.token);
          // Update auth context with user data
          setCurrentUser(data.user);
          // Show success message
          toast.success(isNewUser ? 'Registration successful! Welcome to our community!' : 'Successfully signed in with Google');
          // Navigate to the redirect path
          navigate(redirectPath);
          setLoading(false);
          // Close popup and cleanup
          popup.close();
          window.removeEventListener('message', handleMessage);
          clearInterval(checkPopup);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          const errorMessage = event.data.error || 'Failed to sign in with Google';
          toast.error(errorMessage);
          setLoading(false);
          // Close popup and cleanup
          popup.close();
          window.removeEventListener('message', handleMessage);
          clearInterval(checkPopup);
        }
      };

      // Add message listener
      window.addEventListener('message', handleMessage);

      // Cleanup function
      const cleanup = () => {
        window.removeEventListener('message', handleMessage);
        clearInterval(checkPopup);
        setLoading(false);
      };

      // Add cleanup on component unmount
      return cleanup;
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Failed to sign in with Google. Please try again or use email/password.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword || !username || !phone) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const response = await register({ name, email, password, username, phone });
      
      // Show success message and redirect to OTP verification
      toast.success('Registration initiated! Please check your email for OTP.');
      
      // Navigate to OTP verification page
      navigate('/verify-otp', {
        state: {
          email,
          type: 'register',
          redirectPath
        }
      });
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
              sign in to your account
            </Link>
          </p>
        </div>

        {/* Google Sign-In Button */}
        <div>
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                <FcGoogle className="w-5 h-5 mr-2" />
                Sign up with Google
              </>
            )}
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

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                placeholder="Full Name"
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                placeholder="Username"
              />
            </div>
            <div>
              <label htmlFor="phone" className="sr-only">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                placeholder="Phone Number"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <LoadingSpinner />
              ) : (
                'Sign up'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register; 