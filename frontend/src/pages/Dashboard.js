import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import {
  getTrekStats,
  getTreks,
  getTrekById,
  getRegions,
  getUserBookings,
  getDashboardStats,
  getAllUsers,
  getAllBookings,
  formatCurrency,
} from "../services/api";
import TrekForm from "../components/TrekForm";
import TrekList from "../components/TrekList";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import RegionManager from "../components/RegionManager";
import TrekStatusModal from "../components/TrekStatusModal";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import TrekSectionManager from "../components/TrekSectionManager";
import {
  FaHiking,
  FaGlobe,
  FaUsers,
  FaCalendarAlt,
  FaTicketAlt,
  FaChartLine,
  FaUserPlus,
  FaUmbrellaBeach,
  FaLayerGroup,
  FaArrowRight,
  FaExclamationTriangle,
  FaInfoCircle,
  FaNewspaper,
  FaHeadset,
  FaChevronRight,
  FaUsersCog,
} from "react-icons/fa";
import { motion } from "framer-motion";
import RichTextEditor from "../components/RichTextEditor";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

// Helper: Stat Card Component
const StatCard = ({
  title,
  value,
  icon: Icon,
  color = "emerald",
  link,
  loading,
}) => {
  const colors = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
    pink: "bg-pink-500",
    indigo: "bg-indigo-500",
    teal: "bg-teal-500",
    orange: "bg-orange-500",
  };

  const cardContent = (
    <>
      <div
        className={`absolute top-3 right-3 sm:top-4 sm:right-4 p-2 sm:p-3 rounded-full ${colors[color]} text-white opacity-80`}
      >
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
      </div>
      <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">{title}</p>
      {loading ? (
        <div className="h-6 sm:h-8 w-16 sm:w-20 bg-gray-200 rounded animate-pulse mt-1"></div>
      ) : (
        <p className="mt-1 text-2xl sm:text-3xl font-semibold text-gray-900">{value}</p>
      )}
    </>
  );

  const motionProps = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  };

  if (link) {
    return (
      <motion.div
        {...motionProps}
        className="relative bg-white pt-4 px-3 pb-4 sm:pt-5 sm:px-4 sm:pb-5 shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow min-h-[120px] sm:min-h-[140px]"
      >
        <Link
          to={link}
          className="absolute inset-0"
          aria-label={`View ${title}`}
        ></Link>
        {cardContent}
      </motion.div>
    );
  }

  return (
    <motion.div
      {...motionProps}
      className="relative bg-white pt-4 px-3 pb-4 sm:pt-5 sm:px-4 sm:pb-5 shadow rounded-lg overflow-hidden min-h-[120px] sm:min-h-[140px]"
    >
      {cardContent}
    </motion.div>
  );
};

// Helper: Quick Action Card
const QuickActionCard = ({
  title,
  description,
  icon: Icon,
  link,
  color = "emerald",
}) => {
  const bgColors = {
    emerald: "bg-emerald-50 hover:bg-emerald-100",
    blue: "bg-blue-50 hover:bg-blue-100",
    purple: "bg-purple-50 hover:bg-purple-100",
    yellow: "bg-yellow-50 hover:bg-yellow-100",
    red: "bg-red-50 hover:bg-red-100",
    indigo: "bg-indigo-50 hover:bg-indigo-100",
    pink: "bg-pink-50 hover:bg-pink-100",
    teal: "bg-teal-50 hover:bg-teal-100",
    orange: "bg-orange-50 hover:bg-orange-100",
  };
  const textColors = {
    emerald: "text-emerald-700",
    blue: "text-blue-700",
    purple: "text-purple-700",
    yellow: "text-yellow-700",
    red: "text-red-700",
    indigo: "text-indigo-700",
    pink: "text-pink-700",
    teal: "text-teal-700",
    orange: "text-orange-700",
  };
  const ringColors = {
    emerald: "focus:ring-emerald-500",
    blue: "focus:ring-blue-500",
    purple: "focus:ring-purple-500",
    yellow: "focus:ring-yellow-500",
    red: "focus:ring-red-500",
    indigo: "focus:ring-indigo-500",
    pink: "focus:ring-pink-500",
    teal: "focus:ring-teal-500",
    orange: "focus:ring-orange-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative group ${bgColors[color]} p-4 sm:p-6 rounded-lg shadow-sm transition-all duration-200 min-h-[140px] sm:min-h-[160px]`}
    >
      <Link
        to={link}
        className={`absolute inset-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${ringColors[color]}`}
        aria-label={title}
      ></Link>
      <div
        className={`inline-block p-2 sm:p-3 rounded-lg ${textColors[color]} bg-white mb-3 sm:mb-4 shadow-sm`}
      >
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
      </div>
      <h3 className={`text-base sm:text-lg font-semibold ${textColors[color]} mb-1`}>
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{description}</p>
      <FaArrowRight
        className={`absolute bottom-3 right-3 sm:bottom-4 sm:right-4 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:${textColors[color]} transition-colors`}
      />
    </motion.div>
  );
};

function Dashboard() {
  const { currentUser } = useAuth();
  const permissions = currentUser?.group?.permissions;
  const [stats, setStats] = useState(null);
  const [treks, setTreks] = useState([]);
  const [regions, setRegions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [salesStats, setSalesStats] = useState({
    totalSales: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
  });
  const [ongoingTreks, setOngoingTreks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedTrek, setSelectedTrek] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Check if user is admin
    if (
      !currentUser ||
      (!currentUser.isAdmin && currentUser.role !== "admin")
    ) {
      toast.error("You do not have permission to access the admin dashboard");
      navigate("/");
      return;
    }

    fetchDashboardData();
  }, [currentUser, navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      console.log("Fetching dashboard stats...");
      const data = await getDashboardStats();
      console.log("Dashboard stats received:", data);

      // Check if data has the expected structure
      if (!data || typeof data !== "object") {
        console.error("Invalid dashboard data format:", data);
        throw new Error("Invalid data format received from server");
      }

      setStats(data);

      // Fetch recent treks
      const treksData = await getTreks({ limit: 5, sort: "createdAt-desc" });
      console.log("Treks data received:", treksData);

      // Ensure treksData is an array before using filter
      const treksArray = Array.isArray(treksData)
        ? treksData
        : treksData && Array.isArray(treksData.treks)
        ? treksData.treks
        : [];

      setTreks(treksArray);

      // Fetch regions
      const regionsData = await getRegions();
      setRegions(regionsData);

      // Use the backend dashboard stats for total sales and bookings
      // The backend already calculates these correctly
      setSalesStats({
        totalSales: data.totalSales || 0,
        confirmedBookings: 0, // We'll calculate this separately if needed
        cancelledBookings: 0, // We'll calculate this separately if needed
      });

      // For total bookings count, we'll use the backend data
      // But we still need to fetch all bookings for the array
      const allBookingsData = await getAllBookings();
      const bookingsArray = Array.isArray(allBookingsData)
        ? allBookingsData
        : [];
      
      setAllBookings(bookingsArray);

      // Fetch recent bookings for the current user's view
      const userBookingsData = await getUserBookings();
      setBookings(Array.isArray(userBookingsData) ? userBookingsData : []);

      // Fetch all users
      const usersData = await getAllUsers();
      setUsers(Array.isArray(usersData) ? usersData : []);

      // Calculate ongoing treks - make sure we're working with an array
      const today = new Date();
      const ongoingTreksCount = treksArray.filter((trek) => {
        if (!trek.batches || !Array.isArray(trek.batches)) return false;

        return trek.batches.some((batch) => {
          const startDate = new Date(batch.startDate);
          const endDate = new Date(batch.endDate);
          return startDate <= today && today <= endDate;
        });
      }).length;

      setOngoingTreks(ongoingTreksCount);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const prepareSeasonData = () => {
    if (!stats || !stats.seasons || stats.seasons.length === 0) {
      return {
        labels: ["Spring", "Summer", "Autumn", "Winter"],
        datasets: [
          {
            data: [0, 0, 0, 0],
            backgroundColor: [
              "rgba(255, 99, 132, 0.6)",
              "rgba(255, 206, 86, 0.6)",
              "rgba(54, 162, 235, 0.6)",
              "rgba(75, 192, 192, 0.6)",
            ],
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: stats.seasons.map((item) => item._id || item.season),
      datasets: [
        {
          data: stats.seasons.map((item) => item.count),
          backgroundColor: [
            "rgba(255, 99, 132, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(54, 162, 235, 0.6)",
            "rgba(75, 192, 192, 0.6)",
            "rgba(153, 102, 255, 0.6)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const prepareRegionData = () => {
    if (!stats || !stats.regions || stats.regions.length === 0) {
      return {
        labels: ["No regions yet"],
        datasets: [
          {
            label: "Number of Treks",
            data: [0],
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: stats.regions.map((item) => item._id || item.region),
      datasets: [
        {
          label: "Number of Treks",
          data: stats.regions.map((item) => item.count),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  const handleTrekDeleted = (deletedId) => {
    setTreks((prevTreks) => prevTreks.filter((trek) => trek._id !== deletedId));
    fetchDashboardData(); // Refresh all data to update stats
  };

  const handleTrekUpdated = async (trekId) => {
    try {
      // Refresh the trek data
      const updatedTrek = await getTrekById(trekId);

      // Update the treks list with the updated trek
      setTreks((prevTreks) =>
        prevTreks.map((trek) => (trek._id === trekId ? updatedTrek : trek))
      );

      toast.success("Trek updated successfully");
    } catch (error) {
      console.error("Error updating trek:", error);
      toast.error("Failed to update trek");
    }
  };

  const handleToggleStatus = (trekId, updatedTrek) => {
    // Update the treks list with the updated trek
    setTreks((prevTreks) =>
      prevTreks.map((trek) => (trek._id === trekId ? updatedTrek : trek))
    );

    toast.success(
      `Trek ${updatedTrek.isEnabled ? "enabled" : "disabled"} successfully`
    );
  };

  const openStatusModal = (trek) => {
    setSelectedTrek(trek);
    setStatusModalOpen(true);
  };

  const statsConfig = [
    {
      title: "Total Treks",
      value: stats?.totalTreks || 0,
      icon: FaHiking,
      color: "emerald",
      link: "/admin/treks",
      permissionKey: "treks",
    },
    {
      title: "Total Bookings",
      value: stats?.totalBookings || 0,
      icon: FaCalendarAlt,
      color: "yellow",
      link: "/admin/bookings",
      permissionKey: "bookings",
    },
    {
      title: "Total Regions",
      value: regions?.length || 0,
      icon: FaGlobe,
      color: "purple",
      link: "/admin/regions",
      permissionKey: "region",
    },
    {
      title: "Total Sales",
      value: formatCurrency(
        salesStats.totalSales.toFixed(2).toLocaleString("en-IN")
      ),
      icon: FaChartLine,
      color: "emerald",
      permissionKey: "sales",
    },
    {
      title: "Active Users",
      value: users.length,
      icon: FaUsers,
      color: "purple",
      link: "/admin/users",
      permissionKey: "users",
    },
    {
      title: "Ongoing Treks",
      value: ongoingTreks,
      icon: FaHiking,
      color: "emerald",
      permissionKey: "ongoingTreks",
    },
  ];

  const quickActions = [
    {
      title: "Manage Treks",
      description: "Add, edit or remove treks",
      icon: FaHiking,
      link: "/admin/treks",
      color: "blue",
      permissionKey: "manageTreks",
    },
    {
      title: "Weekend Getaways",
      description: "Manage weekend getaway trips",
      icon: FaUmbrellaBeach,
      link: "/admin/weekend-getaways",
      color: "emerald",
      permissionKey: "manageWeekendGetaways",
    },
    {
      title: "Manage Regions",
      description: "Add or edit trek regions",
      icon: FaGlobe,
      link: "/admin/regions",
      color: "purple",
      permissionKey: "manageRegions",
    },
    {
      title: "Manage Bookings",
      description: "View and manage bookings",
      icon: FaCalendarAlt,
      link: "/admin/bookings",
      color: "yellow",
      permissionKey: "manageBookings",
    },
    {
      title: "Manage Users",
      description: "View and manage user accounts",
      icon: FaUsers,
      link: "/admin/users",
      color: "red",
      permissionKey: "manageUsers",
    },
    {
      title: "Manage Team",
      description: "Manage admin team members",
      icon: FaUsers,
      link: "/admin/team",
      color: "indigo",
      permissionKey: "manageTeam",
    },
    {
      title: "Manage Blogs",
      description: "Create and manage blog posts",
      icon: FaNewspaper,
      link: "/admin/blogs",
      color: "indigo",
      permissionKey: "manageBlogs",
    },
    {
      title: "Support Tickets",
      description: "Respond to customer inquiries",
      icon: FaHeadset,
      link: "/admin/support",
      color: "indigo",
      permissionKey: "supportTickets",
    },
    {
      title: "Sales Dashboard",
      description: "View sales statistics",
      icon: FaChartLine,
      link: "/admin/sales",
      color: "pink",
      permissionKey: "salesDashboard",
    },
    {
      title: "Manage Leads",
      description: "View and manage customer leads",
      icon: FaUserPlus,
      link: "/admin/leads",
      color: "orange",
      permissionKey: "manageLeads",
    },
    {
      title: "Trek Sections",
      description: "Create and manage homepage trek sections",
      icon: FaLayerGroup,
      link: "/admin/trek-sections",
      color: "teal",
      permissionKey: "trekSections",
    },
    {
      title: "Manage Careers",
      description: "Review and manage career applications",
      icon: FaUsersCog,
      link: "/admin/careers",
      color: "cyan",
      permissionKey: "manageCareers",
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Welcome back, {currentUser?.name}!</p>
      </div>

      {/* Quick Stats */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
          Quick Stats
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {statsConfig
            .filter((stat) => permissions.stats[stat.permissionKey])
            .map((stat, idx) => (
              <StatCard
                key={idx}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                link={stat.link}
                loading={loading}
              />
            ))}
        </div>
      </div>

      {/* Admin Links */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {quickActions
            .filter((action) => permissions.actions[action.permissionKey])
            .map((action, index) => (
              <QuickActionCard key={index} {...action} />
            ))}
        </div>
      </div>

      {/* Recent Treks */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 gap-2">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Treks</h2>
          <Link
            to="/admin/treks"
            className="text-emerald-600 hover:text-emerald-700 text-sm sm:text-base font-medium flex items-center gap-1"
          >
            View all
            <FaChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {treks.length > 0 ? (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <ul className="divide-y divide-gray-200">
              {treks.map((trek) => (
                <li key={trek._id}>
                  <Link
                    to={`/admin/treks/edit/${trek._id}`}
                    className="block hover:bg-gray-50 transition-colors"
                  >
                    <div className="px-3 py-3 sm:px-4 sm:py-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm sm:text-base font-medium text-emerald-600 truncate flex-1 mr-2">
                          {trek.name}
                        </p>
                        <div className="flex-shrink-0">
                          <p
                            className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                              trek.isEnabled
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {trek.isEnabled ? "Active" : "Inactive"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0">
                        <div className="flex flex-col sm:flex-row sm:gap-6 gap-1">
                          <p className="flex items-center text-xs sm:text-sm text-gray-500">
                            <svg
                              className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {trek.regionName}
                          </p>
                          <p className="flex items-center text-xs sm:text-sm text-gray-500">
                            <svg
                              className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {trek.duration} days
                          </p>
                        </div>
                        <div className="flex items-center text-xs sm:text-sm text-gray-500">
                          <svg
                            className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <p>
                            Created on{" "}
                            {new Date(trek.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden rounded-lg p-4 sm:p-6 text-center text-gray-500">
            <p className="text-sm sm:text-base">No treks found.{" "}
              <Link
                to="/admin/treks/add"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Add your first trek
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Tab Navigation - Mobile Optimized */}
      <div className="border-b border-gray-200 mb-4 sm:mb-6">
        <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("overview")}
            className={`${
              activeTab === "overview"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-sm sm:text-base transition-colors`}
          >
            Overview
          </button>

          {/* Add other existing tabs here */}

          <button
            onClick={() => setActiveTab("trekSections")}
            className={`${
              activeTab === "trekSections"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-sm sm:text-base transition-colors`}
          >
            Trek Sections
          </button>
        </nav>
      </div>

      {/* Add the TrekSectionManager component to your conditional rendering */}
      {activeTab === "trekSections" && (
        <div className="mt-4 sm:mt-6">
          <TrekSectionManager />
        </div>
      )}
    </div>
  );
}

export default Dashboard;
