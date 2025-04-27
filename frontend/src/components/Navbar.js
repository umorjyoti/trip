import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  return (
    <nav className="bg-emerald-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="text-white font-bold text-xl">
                TrekBooker
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  to="/"
                  className="text-white hover:bg-emerald-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Home
                </Link>
                <Link
                  to="/treks"
                  className="text-white hover:bg-emerald-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Treks
                </Link>
                <Link
                  to="/about"
                  className="text-white hover:bg-emerald-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  className="text-white hover:bg-emerald-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Contact
                </Link>
                {currentUser && currentUser.isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    className="text-white hover:bg-emerald-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {currentUser ? (
                <div className="ml-3 relative">
                  <div>
                    <button
                      onClick={toggleProfileMenu}
                      className="max-w-xs bg-emerald-600 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-emerald-600 focus:ring-white"
                      id="user-menu-button"
                      aria-expanded="false"
                      aria-haspopup="true"
                    >
                      <span className="sr-only">Open user menu</span>
                      <span className="h-8 w-8 rounded-full bg-emerald-700 flex items-center justify-center text-white">
                        {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </button>
                  </div>
                  {isProfileMenuOpen && (
                    <div
                      className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu-button"
                      tabIndex="-1"
                    >
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        <div className="font-medium">{currentUser.name}</div>
                        <div className="text-gray-500">{currentUser.email}</div>
                      </div>
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                        tabIndex="-1"
                        id="user-menu-item-0"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                        tabIndex="-1"
                        id="user-menu-item-1"
                      >
                        Your Profile
                      </Link>
                      {currentUser.isAdmin && (
                        <Link
                          to="/admin/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          tabIndex="-1"
                          id="user-menu-item-2"
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                        tabIndex="-1"
                        id="user-menu-item-3"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex space-x-4">
                  <Link
                    to="/login"
                    className="text-white hover:bg-emerald-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-white text-emerald-600 hover:bg-emerald-50 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={toggleMenu}
              type="button"
              className="bg-emerald-600 inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-emerald-600 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="text-white hover:bg-emerald-500 block px-3 py-2 rounded-md text-base font-medium"
            >
              Home
            </Link>
            <Link
              to="/treks"
              className="text-white hover:bg-emerald-500 block px-3 py-2 rounded-md text-base font-medium"
            >
              Treks
            </Link>
            <Link
              to="/about"
              className="text-white hover:bg-emerald-500 block px-3 py-2 rounded-md text-base font-medium"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-white hover:bg-emerald-500 block px-3 py-2 rounded-md text-base font-medium"
            >
              Contact
            </Link>
            {currentUser && currentUser.isAdmin && (
              <Link
                to="/admin/dashboard"
                className="text-white hover:bg-emerald-500 block px-3 py-2 rounded-md text-base font-medium"
              >
                Dashboard
              </Link>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-emerald-700">
            {currentUser ? (
              <>
                <div className="flex items-center px-5">
                  <div className="flex-shrink-0">
                    <span className="h-10 w-10 rounded-full bg-emerald-700 flex items-center justify-center text-white text-xl">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium leading-none text-white">
                      {currentUser.name}
                    </div>
                    <div className="text-sm font-medium leading-none text-emerald-200">
                      {currentUser.email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 px-2 space-y-1">
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-emerald-500"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-emerald-500"
                  >
                    Your Profile
                  </Link>
                  {currentUser.isAdmin && (
                    <Link
                      to="/admin/dashboard"
                      className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-emerald-500"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-emerald-500"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="px-2 space-y-1">
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-emerald-500"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-emerald-500"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar; 