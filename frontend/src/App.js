import React, { useEffect, Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AnimatePresence, motion } from "framer-motion";

// Context
import { useAuth } from "./contexts/AuthContext";

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

// Lazy loaded Pages
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const TrekDetail = lazy(() => import("./pages/TrekDetail"));
const TrekList = lazy(() => import("./pages/TrekList"));
const Profile = lazy(() => import("./pages/Profile"));
const Booking = lazy(() => import("./pages/Booking"));
const BookingConfirmation = lazy(() => import("./pages/BookingConfirmation"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const BookingDetail = lazy(() => import("./pages/BookingDetail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminTrekList = lazy(() => import("./pages/AdminTrekList"));
const TrekForm = lazy(() => import("./pages/TrekForm"));
const RegionManager = lazy(() => import("./pages/RegionManager"));
const AdminBookings = lazy(() => import("./pages/AdminBookings"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminTeam = lazy(() => import("./pages/AdminTeam"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminSupport = lazy(() => import("./pages/AdminSupport"));
const TicketDetail = lazy(() => import("./pages/TicketDetail"));
const UserTickets = lazy(() => import("./pages/UserTickets"));
const UserTicketDetail = lazy(() => import("./pages/UserTicketDetail"));
const SalesDashboard = lazy(() => import("./pages/SalesDashboard"));
const AdminLeads = lazy(() => import("./pages/AdminLeads"));
const TrekSectionsPage = lazy(() => import("./pages/TrekSectionsPage"));
const RegionDetail = lazy(() => import("./pages/RegionDetail"));
const RegionList = lazy(() => import("./pages/RegionList"));
const WeekendGetaways = lazy(() => import("./pages/WeekendGetaways"));
const WeekendGetawayDetail = lazy(() => import("./pages/WeekendGetawayDetail"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const BookingPage = lazy(() => import("./pages/BookingPage"));
const BatchPerformance = lazy(() => import("./pages/BatchPerformance"));
const TrekPerformance = lazy(() => import("./pages/TrekPerformance"));
const RegionFormPage = lazy(() => import("./pages/RegionFormPage"));
const BookingEditPage = lazy(() => import("./pages/BookingEditPage"));
const BookingDetailsPage = lazy(() => import("./pages/BookingDetailsPage"));
const UserGroups = lazy(() => import("./pages/UserGroups"));
const LeadDetails = lazy(() => import("./pages/LeadDetails"));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const BlogList = lazy(() => import('./pages/BlogList'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const BlogRegionPage = lazy(() => import('./pages/BlogRegionPage'));
const BlogManagement = lazy(() => import('./pages/admin/BlogManagement'));
const LoginSuccess = lazy(() => import('./pages/LoginSuccess'));
const ParticipantDetailsPage = lazy(() => import("./pages/ParticipantDetailsPage"));
const BlogEditor = lazy(() => import('./pages/admin/BlogEditor'));
const BlogRegionListPage = lazy(() => import('./pages/admin/BlogRegionListPage'));
const BlogRegionFormPage = lazy(() => import('./pages/admin/BlogRegionFormPage'));
const BookingPreviewPage = lazy(() => import('./pages/BookingPreviewPage'));
const Career = lazy(() => import('./pages/Career'));
const AdminCareers = lazy(() => import('./pages/AdminCareers'));
const CustomTrekDetail = lazy(() => import('./pages/CustomTrekDetail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsConditions = lazy(() => import('./pages/TermsConditions'));
const ComingSoon = lazy(() => import('./pages/ComingSoon'));
const SocialMediaLeads = lazy(() => import('./pages/SocialMediaLeads'));
const CustomDropdownDemo = lazy(() => import('./components/CustomDropdownDemo'));
const LeadsManagement = lazy(() => import("./pages/admin/LeadsManagement"));
const WeekendGetawayManager = lazy(() => import("./components/admin/WeekendGetawayManager"));
const UnauthorizedPage = lazy(() => import("./pages/UnauthorizedPage"));
const FailedBookings = lazy(() => import("./pages/admin/FailedBookings"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));



function App() {
  const { currentUser, loading, refreshUser } = useAuth();
  const permissions = currentUser?.group?.permissions;
  const location = useLocation();

  // Remove this useEffect as AuthContext already handles user refresh on mount
  // useEffect(() => {
  //   // Refresh user data when app loads
  //   refreshUser();
  // }, [refreshUser]);

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
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
              </div>
            }>
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
                <Route
                  path="/forgot-password"
                  element={currentUser ? <Navigate to="/" /> : <ForgotPassword />}
                />
                <Route
                  path="/reset-password/:token"
                  element={currentUser ? <Navigate to="/" /> : <ResetPassword />}
                />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsConditions />} />
                <Route path="/coming-soon" element={<ComingSoon />} />
                <Route path="/social-media-leads" element={<SocialMediaLeads />} />
                <Route path="/dropdown-demo" element={<CustomDropdownDemo />} />
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

                {/* Admin Routes */}
                <Route
                  path="/admin/*"
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <Suspense fallback={
                          <div className="flex items-center justify-center min-h-screen">
                            <LoadingSpinner />
                          </div>
                        }>
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
                              path="failed-bookings"
                              element={
                                <ProtectedRoutes
                                  permissionKey="manageBookings"
                                  permissions={permissions}
                                >
                                  <FailedBookings />
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
                              path="team"
                              element={
                                <ProtectedRoutes
                                  permissionKey="manageTeam"
                                  permissions={permissions}
                                >
                                  <AdminTeam />
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

                            {/* Settings Route */}
                            <Route
                              path="settings"
                              element={<AdminSettings />}
                            />


                          </Routes>
                        </Suspense>
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

                {/* Region Detail Routes */}
                <Route path="/regions/:slug" element={<RegionDetail />} />

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
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      {!isAdminRoute && <Footer />}
      <ToastContainer 
        position="top-right" 
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

export default App;
