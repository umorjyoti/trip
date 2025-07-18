import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserTickets } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { FaEye, FaCalendarAlt, FaClock, FaTicketAlt, FaPlus } from 'react-icons/fa';

function UserTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await getUserTickets();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load tickets. Please try again later.');
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return '🔴';
      case 'in-progress':
        return '🟡';
      case 'resolved':
        return '🟢';
      case 'closed':
        return '⚫';
      default:
        return '⚪';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Header Section - Mobile Responsive */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Support Tickets</h1>
            <p className="mt-1 sm:mt-2 text-sm text-gray-600">
              View and manage your support requests
            </p>
          </div>
          <Link
            to="/my-bookings"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            Create New Ticket
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-12 sm:px-6 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <FaTicketAlt className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No support tickets found</h3>
            <p className="text-sm text-gray-500 mb-6">
              You don't have any support tickets yet. If you need help with a booking, you can create a support ticket from your bookings page.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                to="/my-bookings" 
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
              >
                <FaTicketAlt className="mr-2 h-4 w-4" />
                Go to My Bookings
              </Link>
              <Link 
                to="/dashboard" 
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div 
              key={ticket._id} 
              className="bg-white shadow rounded-lg overflow-hidden border-l-4 border-emerald-400 hover:shadow-md transition-shadow"
            >
              <div className="p-4 sm:p-6">
                {/* Header with Subject and Status */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getStatusIcon(ticket.status)}</span>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                        {ticket.subject}
                      </h3>
                    </div>
                    {ticket.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {ticket.description}
                      </p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>

                {/* Ticket Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <FaCalendarAlt className="mr-2 h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Created</p>
                      <p>{formatDate(ticket.createdAt)} at {formatTime(ticket.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <FaClock className="mr-2 h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Last Updated</p>
                      <p>{formatDate(ticket.updatedAt)} at {formatTime(ticket.updatedAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Ticket Information */}
                {ticket.booking && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Related Booking:</span> {ticket.booking.trek?.name || 'Unknown Trek'}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <Link
                    to={`/tickets/${ticket._id}`}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 flex-1 sm:flex-none"
                  >
                    <FaEye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                  
                  {ticket.status === 'open' && (
                    <Link
                      to={`/tickets/${ticket._id}`}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 flex-1 sm:flex-none"
                    >
                      <FaTicketAlt className="mr-2 h-4 w-4" />
                      Add Response
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {tickets.length > 0 && (
        <div className="mt-8 bg-white shadow rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ticket Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{tickets.length}</div>
              <div className="text-sm text-gray-500">Total Tickets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {tickets.filter(t => t.status === 'open').length}
              </div>
              <div className="text-sm text-gray-500">Open</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {tickets.filter(t => t.status === 'in-progress').length}
              </div>
              <div className="text-sm text-gray-500">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {tickets.filter(t => t.status === 'resolved').length}
              </div>
              <div className="text-sm text-gray-500">Resolved</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserTickets; 