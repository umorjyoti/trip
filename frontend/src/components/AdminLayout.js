import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  FaHiking, FaMapMarkedAlt, FaCalendarAlt, FaUsers, 
  FaChartLine, FaHeadset, FaLayerGroup, FaUserFriends,
  FaUmbrellaBeach, FaUsersCog
} from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';

function AdminLayout({ children }) {
  const { pathname } = useLocation();
  const { currentUser } = useAuth();
  const permissions = currentUser?.group?.permissions;


  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const menuPermissionsMap = {
    'Manage Treks': 'manageTreks',
    'Manage Regions': 'manageRegions',
    'Manage Bookings': 'manageBookings',
    'Manage Users': 'manageUsers',
    'Sales Dashboard': 'salesDashboard',
    'Support': 'supportTickets',
    'Trek Sections': 'trekSections',
    'Weekend Getaways': 'manageWeekendGetaways',
    'User Groups': 'manageUserGroups',
    'Manage Leads': 'manageLeads',
    'Dashboard': null
  };

    // Define all possible menu items
    const allMenuItems = [
      {
        name: 'Dashboard',
        path: '/admin/dashboard',
        icon: MdDashboard
      },
      {
        name: 'Manage Treks',
        path: '/admin/treks',
        icon: FaHiking
      },
      {
        name: 'Manage Regions',
        path: '/admin/regions',
        icon: FaMapMarkedAlt
      },
      {
        name: 'Manage Bookings',
        path: '/admin/bookings',
        icon: FaCalendarAlt
      },
      {
        name: 'Manage Users',
        path: '/admin/users',
        icon: FaUsers
      },
      {
        name: 'Sales Dashboard',
        path: '/admin/sales',
        icon: FaChartLine
      },
      {
        name: 'Support',
        path: '/admin/support',
        icon: FaHeadset
      },
      {
        name: 'Trek Sections',
        path: '/admin/trek-sections',
        icon: FaLayerGroup
      },
      {
        name: 'Weekend Getaways',
        path: '/admin/weekend-getaways',
        icon: FaUmbrellaBeach
      },
      {
        name: 'User Groups',
        path: '/admin/user-groups',
        icon: FaUserFriends
      },
      {
        name: 'Manage Leads',
        path: '/admin/leads',
        icon: FaUsersCog
      }
    ];
  

  const allMenuItemsWithPermissions = allMenuItems.map(item => {
    const permissionKey = menuPermissionsMap[item.name];
    const isAllowed = permissionKey ? permissions.actions[permissionKey] : true;
  
    return {
      ...item,
      isAllowed
    };
  });


  const filteredMenuItems = allMenuItemsWithPermissions.filter(item => item.isAllowed);

  // Filter menu items based on user role and permissions
  const menuItems = React.useMemo(() => {
    // Always show dashboard for admin users
    const dashboardItem = filteredMenuItems.find(item => item.name === 'Dashboard');
    const otherItems = filteredMenuItems.filter(item => item.name !== 'Dashboard');

    // Get user permissions from their group
    const userPermissions = currentUser?.group?.permissions;
    if (!userPermissions) return [dashboardItem];

    // Filter other menu items based on permissions
    const allowedItems = otherItems.filter(item => {
      switch (item.name) {
        case 'Manage Treks':
          return userPermissions.actions?.manageTreks;
        case 'Manage Regions':
          return userPermissions.actions?.manageRegions;
        case 'Manage Bookings':
          return userPermissions.actions?.manageBookings;
        case 'Manage Users':
          return userPermissions.actions?.manageUsers;
        case 'Sales Dashboard':
          return userPermissions.actions?.salesDashboard;
        case 'Support':
          return userPermissions.actions?.supportTickets;
        case 'Trek Sections':
          return userPermissions.actions?.trekSections;
        case 'Weekend Getaways':
          return userPermissions.actions?.manageWeekendGetaways;
        case 'User Groups':
          return userPermissions.actions?.manageUserGroups;
        case 'Manage Leads':
          return userPermissions.actions?.manageLeads;
        default:
          return false;
      }
    });

    return [dashboardItem, ...allowedItems];
  }, [currentUser]);

  const sidebarVariants = {
    closed: { x: "-100%" },
    open: { x: 0 }
  };

  const sidebarTransition = { type: "tween", ease: "easeInOut", duration: 0.3 };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Static Sidebar for Desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-full flex-1 bg-emerald-700">
            <div className="flex-1 flex flex-col pt-5 pb-4">
              <div className="flex items-center flex-shrink-0 px-4">
                <Link to="/admin/dashboard" className="text-white text-xl font-bold">
                  TrekBooker Admin
                </Link>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`${
                      pathname === item.path
                        ? 'bg-emerald-800 text-white'
                        : 'text-emerald-100 hover:bg-emerald-600'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${
                        pathname === item.path ? 'text-emerald-100' : 'text-emerald-300'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <motion.div
        className="md:hidden fixed inset-0 z-40 flex"
        initial="closed"
        animate={isSidebarOpen ? "open" : "closed"}
        variants={sidebarVariants}
        transition={sidebarTransition}
      >
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-emerald-700">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <svg
                className="h-6 w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <Link to="/admin/dashboard" className="text-white text-xl font-bold">
                TrekBooker Admin
              </Link>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${
                    pathname === item.path
                      ? 'bg-emerald-800 text-white'
                      : 'text-emerald-100 hover:bg-emerald-600'
                  } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon
                    className={`${
                      pathname === item.path ? 'text-emerald-100' : 'text-emerald-300'
                    } mr-3 flex-shrink-0 h-6 w-6`}
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <main className="flex-1 relative z-0 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout; 