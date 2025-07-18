import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaMountain, FaMapMarkedAlt, FaCalendarAlt, FaUsers, FaTicketAlt, FaChartLine, FaLayerGroup, FaUserFriends, FaBlog, FaGlobe } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from '../components/NotificationBell';

function AdminLayout({ children }) {
  const location = useLocation();
  const { user } = useAuth();

  // Check if user has admin role
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2 text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const renderNavItem = (to, icon, label, permission) => {
    // If no permission is required or user has the permission, render the nav item
    if (!permission || user?.group?.permissions?.actions?.[permission]) {
      return (
        <Link
          to={to}
          className={`${
            location.pathname === to
              ? 'bg-emerald-900 text-white'
              : 'text-emerald-100 hover:bg-emerald-700'
          } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
        >
          {icon}
          {label}
        </Link>
      );
    }
    return null;
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-emerald-800">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <span className="text-white text-xl font-bold">Trek Admin</span>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {renderNavItem('/admin', <FaHome className="mr-3 h-5 w-5 text-emerald-300" />, 'Dashboard')}
                {renderNavItem('/admin/treks', <FaMountain className="mr-3 h-5 w-5 text-emerald-300" />, 'Treks', 'manageTreks')}
                {renderNavItem('/admin/regions', <FaMapMarkedAlt className="mr-3 h-5 w-5 text-emerald-300" />, 'Regions', 'manageRegions')}
                {renderNavItem('/admin/bookings', <FaCalendarAlt className="mr-3 h-5 w-5 text-emerald-300" />, 'Bookings', 'manageBookings')}
                {renderNavItem('/admin/users', <FaUsers className="mr-3 h-5 w-5 text-emerald-300" />, 'Users', 'manageUsers')}
                {renderNavItem('/admin/team', <FaUsers className="mr-3 h-5 w-5 text-emerald-300" />, 'Team', 'manageTeam')}
                {renderNavItem('/admin/support', <FaTicketAlt className="mr-3 h-5 w-5 text-emerald-300" />, 'Support', 'supportTickets')}
                {renderNavItem('/admin/sales', <FaChartLine className="mr-3 h-5 w-5 text-emerald-300" />, 'Sales', 'salesDashboard')}
                {renderNavItem('/admin/trek-sections', <FaLayerGroup className="mr-3 h-5 w-5 text-emerald-300" />, 'Trek Sections', 'trekSections')}
                {renderNavItem('/admin/user-groups', <FaUserFriends className="mr-3 h-5 w-5 text-emerald-300" />, 'User Groups', 'manageUserGroups')}
                {renderNavItem('/admin/blogs', <FaBlog className="mr-3 h-5 w-5 text-emerald-300" />, 'Blogs', 'manageBlogs')}
              </nav>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header with notification bell */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-end">
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout; 