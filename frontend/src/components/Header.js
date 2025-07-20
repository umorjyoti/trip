import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import {
  FaHeart,
  FaUser,
  FaSignOutAlt,
  FaCog,
  FaClipboardList,
  FaTicketAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { getRegions } from "../services/api";
import {
  FaHome,
  FaHiking,
  FaMapMarkedAlt,
  FaBlog,
  FaInfoCircle,
  FaPhone,
  FaGlobe,
} from "react-icons/fa";
import { createRegionSlug } from "../services/api";
import logoTransparent from "../assets/logo-transperant.png";

const MobileNavLink = ({ to, icon: Icon, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center px-4 py-2 text-base text-gray-800 rounded-md hover:bg-gray-100 transition-colors"
  >
    {Icon && (
      <Icon className="mr-3 h-5 w-5 text-emerald-500" aria-hidden="true" />
    )}
    {children}
  </Link>
);

function Header() {
  const { currentUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [regions, setRegions] = useState([]);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const data = await getRegions();
        // Only show active regions
        const activeRegions = data.filter((region) => region.isEnabled);
        setRegions(activeRegions);
      } catch (error) {
        console.error("Error fetching regions:", error);
      }
    };

    fetchRegions();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest('[data-testid="mobile-menu-button"]')
      ) {
        setMobileMenuOpen(false);
      }
    }

    if (isDropdownOpen || mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen, mobileMenuOpen]);

  // Focus trap for mobile drawer
  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") setMobileMenuOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      console.log("Logout initiated from Header");
      await logout();

      setMobileMenuOpen(false);
      setIsDropdownOpen(false);

      navigate("/");
    } catch (error) {
      console.error("Logout error in Header:", error);
      toast.error("Failed to log out");
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (isDropdownOpen) setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (mobileMenuOpen) setMobileMenuOpen(false);
  };

  const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.15 } },
  };

  const mobileMenuVariants = {
    closed: { x: "-100%" },
    open: { x: 0 },
  };

  const mobileMenuTransition = {
    type: "tween",
    ease: "easeInOut",
    duration: 0.3,
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              to="/"
              style={{
                marginLeft: window.innerWidth < 640 ? "-1rem" : "0rem",
              }}
              className="flex-shrink-0 flex items-center sm:ml-0 ml-8"
            >
              <img
                src={logoTransparent}
                alt="Bengaluru Trekkers Logo"
                className="h-36 w-auto hover:opacity-80 transition-opacity mr-2 m-2"
                style={{
                  height: window.innerWidth < 640 ? "7rem" : "8rem",
                  marginTop: "0.7rem",
                  marginRight: window.innerWidth < 640 ? "-1rem" : "0rem",
                }}
              />
              <span className="text-lg sm:text-2xl font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                Bengaluru Trekkers
              </span>
            </Link>
            <nav className="hidden sm:ml-8 sm:flex sm:space-x-6">
              <NavLink to="/">Home</NavLink>
              <div className="relative group">
                <button className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors">
                  Treks
                  <svg
                    className="ml-1 h-4 w-4 transition-transform group-hover:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <Link
                      to="/treks?duration=1-1"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      One Day Treks
                    </Link>
                    <Link
                      to="/treks?duration=2-2"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Two Day Treks
                    </Link>
                    <Link
                      to="/treks"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      All Treks
                    </Link>
                  </div>
                </div>
              </div>
              <NavLink to="/weekend-getaways">Weekend Getaways</NavLink>
              {/* <NavLink to="/about">About</NavLink>
              <NavLink to="/contact">Contact</NavLink> */}
              <div className="relative group">
                <button className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors">
                  Regions
                  <svg
                    className="ml-1 h-4 w-4 transition-transform group-hover:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    {/* Scrollable region list - max 5 items visible */}
                    <div
                      className={`max-h-40 ${
                        regions.length > 4
                          ? "regions-dropdown-scroll"
                          : "overflow-y-auto"
                      }`}
                    >
                      {regions.map((region) => (
                        <Link
                          key={region._id}
                          to={`/regions/${createRegionSlug(region.name)}`}
                          state={{ id: region?._id }}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          {region.name}
                        </Link>
                      ))}
                    </div>
                    {/* Always visible "View All Regions" link */}
                    <Link
                      to="/regions"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100 bg-gray-50"
                      role="menuitem"
                    >
                      View All Regions
                    </Link>
                  </div>
                </div>
              </div>
              <NavLink to="/blogs">Blogs</NavLink>
            </nav>
          </div>
          <div className="flex items-center">
            {/* Desktop user menu (profile icon) - only show on desktop */}
            {currentUser ? (
              <div className="relative ml-3 sm:flex hidden" ref={dropdownRef}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleDropdown}
                  type="button"
                  className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  id="user-menu-button"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold ring-2 ring-white">
                    {currentUser.name ? (
                      currentUser.name.charAt(0).toUpperCase()
                    ) : (
                      <FaUser size={16} />
                    )}
                  </div>
                </motion.button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={dropdownVariants}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                      }}
                      className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu-button"
                    >
                      <div className="py-1" role="none">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p
                            className="text-sm font-medium text-gray-900 truncate"
                            role="none"
                          >
                            {currentUser.name || "User"}
                          </p>
                          <p
                            className="text-xs text-gray-500 truncate"
                            role="none"
                          >
                            {currentUser.email}
                          </p>
                        </div>
                        <DropdownLink to="/profile" icon={FaUser}>
                          Profile
                        </DropdownLink>
                        <DropdownLink to="/dashboard" icon={FaCog}>
                          Dashboard
                        </DropdownLink>
                        <DropdownLink to="/my-bookings" icon={FaClipboardList}>
                          My Bookings
                        </DropdownLink>
                        <DropdownLink to="/tickets" icon={FaTicketAlt}>
                          Support Tickets
                        </DropdownLink>
                        {currentUser.isAdmin && (
                          <DropdownLink to="/admin" icon={FaCog}>
                            Admin Dashboard
                          </DropdownLink>
                        )}
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                          role="menuitem"
                        >
                          <FaSignOutAlt className="mr-2" aria-hidden="true" />{" "}
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-3 ml-4">
                <Link
                  to="/login"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile menu trigger - profile avatar if logged in, hamburger if not (mobile only) */}
            <div className="ml-2 flex items-center sm:hidden">
              {currentUser ? (
                <button
                  onClick={toggleMobileMenu}
                  className="inline-flex items-center justify-center p-2 rounded-full bg-emerald-500 text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
                  aria-label="Open user menu"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {currentUser.name ? (
                      currentUser.name.charAt(0).toUpperCase()
                    ) : (
                      <FaUser size={16} />
                    )}
                  </div>
                </button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleMobileMenu}
                  data-testid="mobile-menu-button"
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
                  aria-controls="mobile-menu"
                  aria-expanded={mobileMenuOpen}
                >
                  <span className="sr-only">Open main menu</span>
                  {mobileMenuOpen ? (
                    <FaTimes className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <FaBars className="block h-6 w-6" aria-hidden="true" />
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileMenuVariants}
            transition={mobileMenuTransition}
            className="sm:hidden fixed inset-0 bg-white z-50 overflow-y-auto flex flex-col min-h-screen"
            id="mobile-menu"
            tabIndex={-1}
            onClick={(e) => {
              if (e.target === e.currentTarget) setMobileMenuOpen(false);
            }}
          >
            {/* Close button */}
            <div className="flex justify-between items-center px-4 pt-4 pb-2 border-b border-gray-100 flex-shrink-0">
              <span className="text-xl font-bold text-emerald-600">
                Bengaluru Trekkers
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
                aria-label="Close menu"
              >
                <FaTimes className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* User info or login/register */}
              <div className="px-6 py-4 border-b border-gray-100">
                {currentUser ? (
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold text-xl">
                      {currentUser.name ? (
                        currentUser.name.charAt(0).toUpperCase()
                      ) : (
                        <FaUser size={20} />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-base">
                        {currentUser.name || "User"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {currentUser.email}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-3">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>

              {/* Navigation links */}
              <nav className="flex flex-col space-y-0 px-6 py-4">
                <MobileNavLink
                  to="/"
                  icon={FaHome}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </MobileNavLink>
                <MobileNavLink
                  to="/treks"
                  icon={FaHiking}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Treks
                </MobileNavLink>
                <MobileNavLink
                  to="/weekend-getaways"
                  icon={FaMapMarkedAlt}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Weekend Getaways
                </MobileNavLink>
                <MobileNavLink
                  to="/blogs"
                  icon={FaBlog}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Blogs
                </MobileNavLink>
                <MobileNavLink
                  to="/about"
                  icon={FaInfoCircle}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </MobileNavLink>
                <MobileNavLink
                  to="/contact"
                  icon={FaPhone}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </MobileNavLink>
                <MobileNavLink
                  to="/regions"
                  icon={FaGlobe}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Regions
                </MobileNavLink>
              </nav>

              {/* Divider */}
              {currentUser && <hr className="my-2 border-gray-200" />}

              {/* User actions */}
              {currentUser && (
                <div className="flex flex-col space-y-0 px-6 pb-4">
                  <MobileNavLink
                    to="/profile"
                    icon={FaUser}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </MobileNavLink>
                  <MobileNavLink
                    to="/dashboard"
                    icon={FaCog}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </MobileNavLink>
                  <MobileNavLink
                    to="/my-bookings"
                    icon={FaClipboardList}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Bookings
                  </MobileNavLink>
                  <MobileNavLink
                    to="/tickets"
                    icon={FaTicketAlt}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Support Tickets
                  </MobileNavLink>
                  {currentUser.isAdmin && (
                    <MobileNavLink
                      to="/admin"
                      icon={FaCog}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </MobileNavLink>
                  )}
                </div>
              )}

              {/* Divider and Sign out */}
              {currentUser && (
                <>
                  <hr className="my-2 border-gray-200" />
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center w-full text-left px-6 py-3 text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                  >
                    <FaSignOutAlt className="mr-2" aria-hidden="true" /> Sign
                    out
                  </button>
                </>
              )}
            </div>
            <div className="h-8" /> {/* Spacer for safe area */}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

const NavLink = ({ to, children }) => (
  <Link
    to={to}
    className={({ isActive }) =>
      `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
        isActive
          ? "border-emerald-500 text-gray-900"
          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
      }`
    }
  >
    {children}
  </Link>
);

const DropdownLink = ({ to, icon: Icon, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
    role="menuitem"
  >
    <Icon className="mr-2 h-4 w-4 text-gray-400" aria-hidden="true" />
    {children}
  </Link>
);

export default Header;
