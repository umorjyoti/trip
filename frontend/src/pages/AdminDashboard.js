import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FaMountain, FaCalendarAlt, FaMapMarkedAlt, FaChartLine, FaUsers, FaHiking, FaLayerGroup } from 'react-icons/fa';
import { MdSupportAgent, MdDashboard, MdManageAccounts, MdGroup } from 'react-icons/md';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({});
  const { user } = useAuth();

  // Define available stats and their required permissions
  const availableStats = [
    { key: 'totalTreks', title: 'Total Treks', permission: 'treks', icon: FaMountain },
    { key: 'totalBookings', title: 'Total Bookings', permission: 'bookings', icon: FaCalendarAlt },
    { key: 'totalRegions', title: 'Regions', permission: 'region', icon: FaMapMarkedAlt },
    { key: 'totalSales', title: 'Total Sales', permission: 'sales', icon: FaChartLine, format: (value) => `₹${value || 0}` },
    { key: 'totalUsers', title: 'Total Users', permission: 'users', icon: FaUsers },
    { key: 'ongoingTreks', title: 'Ongoing Treks', permission: 'ongoingTreks', icon: FaHiking }
  ];

  // Define available actions and their required permissions
  const availableActions = [
    { title: 'Manage Treks', permission: 'manageTreks', icon: FaMountain, link: '/admin/treks' },
    { title: 'Manage Weekend Getaways', permission: 'manageWeekendGetaways', icon: FaHiking, link: '/admin/weekend-getaways' },
    { title: 'Manage Regions', permission: 'manageRegions', icon: FaMapMarkedAlt, link: '/admin/regions' },
    { title: 'Manage Bookings', permission: 'manageBookings', icon: FaCalendarAlt, link: '/admin/bookings' },
    { title: 'Manage Users', permission: 'manageUsers', icon: FaUsers, link: '/admin/users' },
    { title: 'Manage Team', permission: 'manageTeam', icon: FaUsers, link: '/admin/team' },
    { title: 'Support Tickets', permission: 'supportTickets', icon: MdSupportAgent, link: '/admin/support' },
    { title: 'Sales Dashboard', permission: 'salesDashboard', icon: MdDashboard, link: '/admin/sales' },
    { title: 'Manage Leads', permission: 'manageLeads', icon: MdManageAccounts, link: '/admin/leads' },
    { title: 'Trek Sections', permission: 'trekSections', icon: FaLayerGroup, link: '/admin/trek-sections' },
    { title: 'Manage User Groups', permission: 'manageUserGroups', icon: MdGroup, link: '/admin/user-groups' }
  ];

  // Get user's permissions
  const getUserPermissions = () => {
    const statsPermissions = user?.group?.permissions?.stats || {};
    const actionPermissions = user?.group?.permissions?.actions || {};
    return { statsPermissions, actionPermissions };
  };

  // Filter stats based on permissions
  const getPermittedStats = () => {
    const { statsPermissions } = getUserPermissions();
    return availableStats.filter(stat => statsPermissions[stat.permission]);
  };

  // Filter actions based on permissions
  const getPermittedActions = () => {
    const { actionPermissions } = getUserPermissions();
    return availableActions.filter(action => actionPermissions[action.permission]);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const permittedStats = getPermittedStats();
        
        // Only make API call if user has permissions for at least one stat
        if (permittedStats.length > 0) {
          const data = await getDashboardStats();
          setDashboardData(data);
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

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

  const renderStatsCard = (stat) => {
    const value = stat.format ? 
      stat.format(dashboardData[stat.key]) : 
      dashboardData[stat.key] || 0;
    
    return (
      <div key={stat.key} className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
            <stat.icon className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{stat.title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderActionCard = (action) => {
    return (
      <a
        key={action.permission}
        href={action.link}
        className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow duration-200"
      >
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
            <action.icon className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-900">{action.title}</p>
          </div>
        </div>
      </a>
    );
  };

      const permittedStats = getPermittedStats();
    const permittedActions = getPermittedActions();

  return (
    <div className="p-6">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
          <button 
            className="mt-2 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      {permittedStats.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {permittedStats.map(renderStatsCard)}
          </div>
        </div>
      )}

      {permittedActions.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {permittedActions.map(renderActionCard)}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 