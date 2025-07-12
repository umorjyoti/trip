import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AnimatePresence, motion } from "framer-motion";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import LoadingSpinner from "./components/LoadingSpinner";
import AdminLayout from "./components/AdminLayout";
import ProtectedRoutes from "./routes/ProtectedRoutes";
import OTPVerification from "./components/OTPVerification";
import ScrollToTop from "./components/ScrollToTop";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import Contact from "./pages/Contact";
import TrekDetail from "./pages/TrekDetail";
import TrekList from "./pages/TrekList";
import Profile from "./pages/Profile";
import Booking from "./pages/Booking";
import BookingConfirmation from "./pages/BookingConfirmation";
import MyBookings from "./pages/MyBookings";
import BookingDetail from "./pages/BookingDetail";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTrekList from "./pages/AdminTrekList";
import TrekForm from "./pages/TrekForm";
import RegionManager from "./pages/RegionManager";
import AdminBookings from "./pages/AdminBookings";
import AdminUsers from "./pages/AdminUsers";
import NotFound from "./pages/NotFound";
import AdminSupport from "./pages/AdminSupport";
import TicketDetail from "./pages/TicketDetail";
import UserTickets from "./pages/UserTickets";
import UserTicketDetail from "./pages/UserTicketDetail";
import SalesDashboard from "./pages/SalesDashboard";
import AdminLeads from "./pages/AdminLeads";
import Wishlist from "./pages/Wishlist";
import TrekSectionsPage from "./pages/TrekSectionsPage";
import RegionDetail from "./pages/RegionDetail";
import RegionList from "./pages/RegionList";
import WeekendGetaways from "./pages/WeekendGetaways";
import WeekendGetawayDetail from "./pages/WeekendGetawayDetail";
import SearchResults from "./pages/SearchResults";
import BookingPage from "./pages/BookingPage";
import BatchPerformance from "./pages/BatchPerformance";
import TrekPerformance from "./pages/TrekPerformance";
import RegionFormPage from "./pages/RegionFormPage";
import BookingEditPage from "./pages/BookingEditPage";
import BookingDetailsPage from "./pages/BookingDetailsPage";
import UserGroups from "./pages/UserGroups";
import LeadDetails from "./pages/LeadDetails";
import UserDashboard from './pages/UserDashboard';
import PaymentPage from './pages/PaymentPage';
import BlogList from './pages/BlogList';
import BlogDetail from './pages/BlogDetail';
import BlogRegionPage from './pages/BlogRegionPage';
import BlogManagement from './pages/admin/BlogManagement';
import LoginSuccess from './pages/LoginSuccess';
import ParticipantDetailsPage from "./pages/ParticipantDetailsPage";
import BlogEditor from './pages/admin/BlogEditor';
import BlogRegionListPage from './pages/admin/BlogRegionListPage';
import BlogRegionFormPage from './pages/admin/BlogRegionFormPage';
import BookingPreviewPage from './pages/BookingPreviewPage';
import Career from './pages/Career';
import AdminCareers from './pages/AdminCareers';
import CustomTrekDetail from './pages/CustomTrekDetail';

// Context
import { useAuth } from "./contexts/AuthContext";
import LeadsManagement from "./pages/admin/LeadsManagement";
import WeekendGetawayManager from "./components/admin/WeekendGetawayManager";
import UnauthorizedPage from "./pages/UnauthorizedPage";

function App() {
  const { currentUser, loading, refreshUser } = useAuth();
  const permissions = currentUser?.group?.permissions;
  const location = useLocation();

  useEffect(() => {
    // Refresh user data when app loads
    refreshUser();
  }, [refreshUser]);

  // Check if current path is an admin route
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.4,
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <ScrollToTop />
      <Header />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <Routes location={location}>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route
                path="/login"
                element={currentUser ? <Navigate to="/" /> : <Login />}
              />
              <Route
                path="/register"
                element={currentUser ? <Navigate to="/" /> : <Register />}
              />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/treks" element={<SearchResults />} />
              <Route path="/treks/:name" element={<TrekDetail />} />
              <Route path="/treks/:name/book" element={<BookingPage />} />

              {/* Protected Routes */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route
                path="/booking/:trekId/:batchId"
                element={
                  <PrivateRoute>
                    <Booking />
                  </PrivateRoute>
                }
              />
              <Route
                path="/booking-confirmation/:bookingId"
                element={
                  <PrivateRoute>
                    <BookingConfirmation />
                  </PrivateRoute>
                }
              />
              <Route
                path="/payment/:bookingId"
                element={
                  <PrivateRoute>
                    <PaymentPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <PrivateRoute>
                    <MyBookings />
                  </PrivateRoute>
                }
              />
              <Route
                path="/booking-detail/:id"
                element={
                  <PrivateRoute>
                    <BookingDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/booking-detail/:id/participants"
                element={<ParticipantDetailsPage />}
              />
              <Route
                path="/booking/:bookingId/participant-details"
                element={<ParticipantDetailsPage />}
              />
              <Route
                path="/booking/:bookingId/preview"
                element={<BookingPreviewPage />}
              />
              <Route
                path="/wishlist"
                element={
                  <PrivateRoute>
                    <Wishlist />
                  </PrivateRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <AdminLayout>
                      <Routes>
                        <Route
                          path="/"
                          element={<Navigate to="dashboard" replace />}
                        />
                        <Route path="dashboard" element={<Dashboard />} />

                        <Route
                          path="treks"
                          element={
                            <ProtectedRoutes
                              permissionKey="manageTreks"
                              permissions={permissions}
                            >
                              <AdminTrekList />
                            </ProtectedRoutes>
                          }
                        />
                        <Route
                          path="treks/new"
                          element={
                            <ProtectedRoutes
                              permissionKey="manageTreks"
                              permissions={permissions}
                            >
                              <TrekForm />
                            </ProtectedRoutes>
                          }
                        />
                        <Route
                          path="treks/edit/:id"
                          element={
                            <ProtectedRoutes
                              permissionKey="manageTreks"
                              permissions={permissions}
                            >
                              <TrekForm />
                            </ProtectedRoutes>
                          }
                        />
                        <Route
                          path="treks/:trekId/performance"
                          element={
                            <ProtectedRoutes
                              permissionKey="manageTreks"
                              permissions={permissions}
                            >
                              <TrekPerformance />
                            </ProtectedRoutes>
                          }
                        />
                        <Route
                          path="treks/:trekId/batches/:batchId/performance"
                          element={
                            <ProtectedRoutes
                              permissionKey="manageTreks"
                              permissions={permissions}
                            >
                              <BatchPerformance />
                            </ProtectedRoutes>
                          }
                        />

                        <Route
                          path="regions"
                          element={
                            <ProtectedRoutes
                              permissionKey="manageRegions"
                              permissions={permissions}
                            >
                              <RegionManager />
                            </ProtectedRoutes>
                          }
                        />
                        <Route
                          path="regions/new"
                          element={
                            <ProtectedRoutes
                              permissionKey="manageRegions"
                              permissions={permissions}
                            >
                              <RegionFormPage />
                            </ProtectedRoutes>
                          }
                        />
                        <Route
                          path="regions/:id/edit"
                          element={
                            <ProtectedRoutes
                              permissionKey="manageRegions"
                              permissions={permissions}
                            >
                              <RegionFormPage />
                            </ProtectedRoutes>
                          }
                        />

                        <Route
                          path="bookings"
                          element={
                            <ProtectedRoutes
                              permissionKey="manageBookings"
                              permissions={permissions}
                            >
                              <AdminBookings />
                            </ProtectedRoutes>
                          }
                        />
                        <Route
                          path="bookings/:id"
                          element={
                            <ProtectedRoutes
                              permissionKey="manageBookings"
                              permissions={permissions}
                            >
                              <BookingDetailsPage />
                            </ProtectedRoutes>
                          }
                        />
                        <Route
                          path="bookings/:id/edit"
                          element={
                            <ProtectedRoutes
                              permissionKey="manageBookings"
                              permissions={permissions}
                            >
                              <BookingEditPage />
                            </ProtectedRoutes>
                          }
                        />

                        <Route
                          path="users"
                          element={
                            <ProtectedRoutes
                              permissionKey="manageUsers"
                              permissions={permissions}
                            >
                              <AdminUsers />
                            </ProtectedRoutes>
                          }
                        />

                        <Route
                          path="support"
                          element={
                            <ProtectedRoutes
                              permissionKey="supportTickets"
                              permissions={permissions}
                            >
                              <AdminSupport />
                            </ProtectedRoutes>
                          }
                        />
                        <Route
                          path="support/:id"
                          element={
                            <ProtectedRoutes
                              permissionKey="supportTickets"
                              permissions={permissions}
                            >
                              <TicketDetail />
                            </ProtectedRoutes>
                          }
                        />

                        <Route
                          path="sales"
                          element={
                            <ProtectedRoutes
                              permissionKey="salesDashboard"
                              permissions={permissions}
                            >
                              <SalesDashboard />
                            </ProtectedRoutes>
                          }
                        />

                        <Route
                          path="leads"
                          element={
                            <ProtectedRoutes
                              permissionKey="manageLeads"
                              permissions={permissions}
                            >
                              <AdminLeads />
                            </ProtectedRoutes>
                          }
                        />
                        <Route
                          path="leads/:id"
                          element={
                            <ProtectedRoutes
                              permissionKey="manageLeads"
                              permissions={permissions}
                            >
                              <LeadDetails />
                            </ProtectedRoutes>
                          }
                        />

                        <Route
                          path="trek-sections"
                          element={
                            <ProtectedRoutes
                              permissionKey="trekSections"
                              permissions={permissions}
                            >
                              <TrekSectionsPage />
                            </ProtectedRoutes>
                          }
                        />

                        <Route
                          path="weekend-getaways"
                          element={
                            <ProtectedRoutes
                              permissionKey="manageWeekendGetaways"
                              permissions={permissions}
                            >
                              <WeekendGetawayManager />
                            </ProtectedRoutes>
                          }
                        />

                        <Route
                          path="user-groups"
                          element={
                            <ProtectedRoutes
                              permissionKey="manageUserGroups"
                              permissions={permissions}
                            >
                              <UserGroups />
                            </ProtectedRoutes>
                          }
                        />
                        <Route
                          path="user-groups/new"
                          element={
                            <ProtectedRoutes
                              permissionKey="manageUserGroups"
                              permissions={permissions}
                            >
                              <UserGroups />
                            </ProtectedRoutes>
                          }
                        />
                        <Route
                          path="user-groups/:id/edit"
                          element={
                            <ProtectedRoutes
                              permissionKey="manageUserGroups"
                              permissions={permissions}
                            >
                              <UserGroups />
                            </ProtectedRoutes>
                          }
                        />
                        <Route path="unauthorized" element={<UnauthorizedPage />} />

                        <Route
                          path="blogs"
                          element={
                            <ProtectedRoutes permissionKey="manageBlogs" permissions={permissions}>
                              <BlogManagement />
                            </ProtectedRoutes>
                          }
                        />
                        <Route
                          path="blogs/new"
                          element={
                            <ProtectedRoutes permissionKey="manageBlogs" permissions={permissions}>
                              <BlogEditor />
                            </ProtectedRoutes>
                          }
                        />
                        <Route
                          path="blogs/:id"
                          element={
                            <ProtectedRoutes permissionKey="manageBlogs" permissions={permissions}>
                              <BlogEditor />
                            </ProtectedRoutes>
                          }
                        />

                        {/* Blog Region Management Routes */}
                        <Route
                          path="blog-regions"
                          element={
                            <ProtectedRoutes permissionKey="manageBlogs" permissions={permissions}>
                              <BlogRegionListPage />
                            </ProtectedRoutes>
                          }
                        />
                        <Route
                          path="blog-regions/new"
                          element={
                            <ProtectedRoutes permissionKey="manageBlogs" permissions={permissions}>
                            <BlogRegionFormPage />
                          </ProtectedRoutes>
                          }
                        />
                        <Route
                          path="blog-regions/edit/:id"
                          element={
                            <ProtectedRoutes permissionKey="manageBlogs" permissions={permissions}>
                              <BlogRegionFormPage />
                            </ProtectedRoutes>
                          }
                        />
                      </Routes>
                    </AdminLayout>
                  </AdminRoute>
                }
              />

              {/* User Ticket Routes */}
              <Route
                path="/tickets"
                element={
                  <PrivateRoute>
                    <UserTickets />
                  </PrivateRoute>
                }
              />
              <Route
                path="/tickets/:id"
                element={
                  <PrivateRoute>
                    <UserTicketDetail />
                  </PrivateRoute>
                }
              />

              {/* Region Detail Route */}
              <Route path="/regions/:id" element={<RegionDetail />} />

              {/* Region List Route */}
              <Route path="/regions" element={<RegionList />} />

              {/* Weekend Getaways Route */}
              <Route path="/weekend-getaways" element={<WeekendGetaways />} />
              <Route
                path="/weekend-getaways/:id"
                element={<WeekendGetawayDetail />}
              />

              {/* Blog Routes */}
              <Route path="/blogs" element={<BlogList />} />
              <Route path="/blogs/region/:slug" element={<BlogRegionPage />} />
              <Route path="/blogs/:slug" element={<BlogDetail />} />

              {/* Login Success Route */}
              <Route path="/login/success" element={<LoginSuccess />} />

              {/* OTP Verification Route */}
              <Route path="/verify-otp" element={<OTPVerification />} />

              {/* Career Routes */}
              <Route path="/career" element={<Career />} />

              {/* Admin Career Routes */}
              <Route
                path="/admin/careers"
                element={
                  <ProtectedRoutes permissionKey="manageCareers" permissions={permissions}>
                    <AdminCareers />
                  </ProtectedRoutes>
                }
              />

              {/* Custom Trek Detail Route */}
              <Route path="/custom-trek/:id" element={<CustomTrekDetail />} />

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      {!isAdminRoute && <Footer />}
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}

export default App;
