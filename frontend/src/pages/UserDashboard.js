import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserBookings, getUserTickets } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { FaCalendarAlt, FaTicketAlt, FaStar, FaHistory, FaUser } from 'react-icons/fa';

function UserDashboard() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsData, ticketsData] = await Promise.all([
        getUserBookings(),
        getUserTickets()
      ]);
      console.log('Bookings data:', bookingsData); // Debug log
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const upcomingBookings = bookings.filter(booking => {
    const startDate = new Date(booking.startDate || booking.batch?.startDate);
    return startDate > new Date() && booking.status === 'confirmed';
  });

  const pastBookings = bookings.filter(booking => {
    const startDate = new Date(booking.startDate || booking.batch?.startDate);
    return startDate < new Date() || booking.status === 'completed';
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-12">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="mt-1 sm:mt-2 text-sm text-gray-600">
          Manage your bookings, support tickets, and reviews
        </p>
      </div>

      {/* Navigation Tabs - Mobile Optimized */}
      <div className="border-b border-gray-200 mb-6 sm:mb-8">
        <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`${
              activeTab === 'upcoming'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-sm flex items-center transition-colors touch-target`}
          >
            <FaCalendarAlt className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Upcoming Bookings</span>
            <span className="sm:hidden">Upcoming</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`${
              activeTab === 'history'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-sm flex items-center transition-colors touch-target`}
          >
            <FaHistory className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Booking History</span>
            <span className="sm:hidden">History</span>
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`${
              activeTab === 'tickets'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-sm flex items-center transition-colors touch-target`}
          >
            <FaTicketAlt className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Support Tickets</span>
            <span className="sm:hidden">Tickets</span>
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`${
              activeTab === 'reviews'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-sm flex items-center transition-colors touch-target`}
          >
            <FaStar className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">My Reviews</span>
            <span className="sm:hidden">Reviews</span>
          </button>
        </nav>
      </div>

      {/* Content Sections */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        {activeTab === 'upcoming' && (
          <div className="px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Upcoming Bookings</h2>
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-4 sm:py-6">
                <p className="text-gray-500 text-sm sm:text-base">You don't have any upcoming bookings.</p>
                <Link
                  to="/treks"
                  className="mt-3 sm:mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 touch-target"
                >
                  Browse Treks
                </Link>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {upcomingBookings.map(booking => (
                  <div key={booking._id} className="border rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                          {booking.trek?.name || 'Unknown Trek'}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {formatDate(booking.startDate || booking.batch?.startDate)} - {formatDate(booking.endDate || booking.batch?.endDate)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getStatusBadgeClass(booking.status)} self-start sm:self-auto`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                      <div className="text-xs sm:text-sm text-gray-500">
                        {booking.participants || 1} participants • ₹{booking.totalPrice || 0}
                      </div>
                      <div className="flex space-x-3 sm:space-x-4">
                        <Link
                          to={`/booking-detail/${booking._id}`}
                          className="text-emerald-600 hover:text-emerald-900 text-xs sm:text-sm font-medium touch-target"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => {/* TODO: Implement cancel booking */}}
                          className="text-red-600 hover:text-red-900 text-xs sm:text-sm font-medium touch-target"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Booking History</h2>
            {pastBookings.length === 0 ? (
              <div className="text-center py-4 sm:py-6">
                <p className="text-gray-500 text-sm sm:text-base">You don't have any past bookings.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {pastBookings.map(booking => (
                  <div key={booking._id} className="border rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                          {booking.trek?.name || 'Unknown Trek'}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {formatDate(booking.startDate || booking.batch?.startDate)} - {formatDate(booking.endDate || booking.batch?.endDate)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getStatusBadgeClass(booking.status)} self-start sm:self-auto`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                      <div className="text-xs sm:text-sm text-gray-500">
                        {booking.participants || 1} participants • ₹{booking.totalPrice || 0}
                      </div>
                      <div className="flex space-x-3 sm:space-x-4">
                        <Link
                          to={`/booking-detail/${booking._id}`}
                          className="text-emerald-600 hover:text-emerald-900 text-xs sm:text-sm font-medium touch-target"
                        >
                          View Details
                        </Link>
                        {booking.status === 'completed' && !booking.review && (
                          <button
                            onClick={() => {/* TODO: Implement review modal */}}
                            className="text-emerald-600 hover:text-emerald-900 text-xs sm:text-sm font-medium touch-target"
                          >
                            Write Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Support Tickets</h2>
            {tickets.length === 0 ? (
              <div className="text-center py-4 sm:py-6">
                <p className="text-gray-500 text-sm sm:text-base">You don't have any support tickets.</p>
                <p className="mt-2 text-xs sm:text-sm text-gray-500">
                  If you need help with a booking, you can create a support ticket from your bookings page.
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {tickets.map(ticket => (
                  <div key={ticket._id} className="border rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                          {ticket.subject}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          Created on {formatDate(ticket.createdAt)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                        ticket.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      } self-start sm:self-auto`}>
                        {ticket.status}
                      </span>
                    </div>
                    <div className="mt-3 sm:mt-4">
                      <p className="text-xs sm:text-sm text-gray-600">{ticket.description}</p>
                    </div>
                    <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                      <div className="text-xs sm:text-sm text-gray-500">
                        Related to: {ticket.booking?.trek?.name || 'Unknown Trek'}
                      </div>
                      <Link
                        to={`/ticket-detail/${ticket._id}`}
                        className="text-emerald-600 hover:text-emerald-900 text-xs sm:text-sm font-medium touch-target"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">My Reviews</h2>
            <div className="text-center py-4 sm:py-6">
              <p className="text-gray-500 text-sm sm:text-base">You haven't written any reviews yet.</p>
              <p className="mt-2 text-xs sm:text-sm text-gray-500">
                Reviews will appear here after you complete a trek and write a review.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDashboard; 