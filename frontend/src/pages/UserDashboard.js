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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your bookings, support tickets, and reviews
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`${
              activeTab === 'upcoming'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FaCalendarAlt className="mr-2" />
            Upcoming Bookings
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`${
              activeTab === 'history'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FaHistory className="mr-2" />
            Booking History
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`${
              activeTab === 'tickets'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FaTicketAlt className="mr-2" />
            Support Tickets
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`${
              activeTab === 'reviews'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FaStar className="mr-2" />
            My Reviews
          </button>
        </nav>
      </div>

      {/* Content Sections */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {activeTab === 'upcoming' && (
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Bookings</h2>
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">You don't have any upcoming bookings.</p>
                <Link
                  to="/treks"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  Browse Treks
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map(booking => (
                  <div key={booking._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {booking.trek?.name || 'Unknown Trek'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(booking.startDate || booking.batch?.startDate)} - {formatDate(booking.endDate || booking.batch?.endDate)}
                        </p>
                      </div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        {booking.participants || 1} participants • ₹{booking.totalPrice || 0}
                      </div>
                      <div className="flex space-x-4">
                        <Link
                          to={`/booking-detail/${booking._id}`}
                          className="text-emerald-600 hover:text-emerald-900 text-sm font-medium"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => {/* TODO: Implement cancel booking */}}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
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
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Booking History</h2>
            {pastBookings.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">You don't have any past bookings.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastBookings.map(booking => (
                  <div key={booking._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {booking.trek?.name || 'Unknown Trek'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(booking.startDate || booking.batch?.startDate)} - {formatDate(booking.endDate || booking.batch?.endDate)}
                        </p>
                      </div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        {booking.participants || 1} participants • ₹{booking.totalPrice || 0}
                      </div>
                      <div className="flex space-x-4">
                        <Link
                          to={`/booking-detail/${booking._id}`}
                          className="text-emerald-600 hover:text-emerald-900 text-sm font-medium"
                        >
                          View Details
                        </Link>
                        {booking.status === 'completed' && !booking.review && (
                          <button
                            onClick={() => {/* TODO: Implement review modal */}}
                            className="text-emerald-600 hover:text-emerald-900 text-sm font-medium"
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
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Support Tickets</h2>
            {tickets.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">You don't have any support tickets.</p>
                <p className="mt-2 text-sm text-gray-500">
                  If you need help with a booking, you can create a support ticket from your bookings page.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map(ticket => (
                  <div key={ticket._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {ticket.subject}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Created on {formatDate(ticket.createdAt)}
                        </p>
                      </div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ticket.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">{ticket.description}</p>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Related to: {ticket.booking?.trek?.name || 'Unknown Trek'}
                      </div>
                      <Link
                        to={`/ticket-detail/${ticket._id}`}
                        className="text-emerald-600 hover:text-emerald-900 text-sm font-medium"
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
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">My Reviews</h2>
            <div className="text-center py-4">
              <p className="text-gray-500">You haven't written any reviews yet.</p>
              <p className="mt-2 text-sm text-gray-500">
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