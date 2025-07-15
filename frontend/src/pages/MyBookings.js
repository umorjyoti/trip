import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserBookings, cancelBooking, downloadInvoice } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { FaDownload } from 'react-icons/fa';

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await getUserBookings();
        setBookings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load your bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'payment_completed':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'trek_completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResumeAction = (booking) => {
    switch (booking.status) {
      case 'pending_payment':
        return {
          text: 'Complete Payment',
          link: `/payment/${booking._id}`,
          color: 'bg-yellow-600 hover:bg-yellow-700',
          icon: '💳'
        };
      case 'payment_completed':
        return {
          text: 'Fill Participant Details',
          link: `/booking/${booking._id}/participant-details`,
          color: 'bg-blue-600 hover:bg-blue-700',
          icon: '👥'
        };
      default:
        return null;
    }
  };

  const isIncompleteBooking = (status) => {
    return ['pending_payment', 'payment_completed'].includes(status);
  };

  const getBookingProgress = (status) => {
    switch (status) {
      case 'pending_payment':
        return { step: 1, total: 3, label: 'Payment Pending' };
      case 'payment_completed':
        return { step: 2, total: 3, label: 'Payment Complete' };
      case 'confirmed':
        return { step: 3, total: 3, label: 'Booking Confirmed' };
      case 'trek_completed':
        return { step: 4, total: 4, label: 'Trek Completed' };
      default:
        return { step: 0, total: 3, label: 'Unknown' };
    }
  };

  const ProgressIndicator = ({ booking }) => {
    const progress = getBookingProgress(booking.status);
    const isIncomplete = isIncompleteBooking(booking.status);
    
    if (!isIncomplete) return null;
    
    return (
      <div className="mt-2">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Step {progress.step} of {progress.total}</span>
          <span>{progress.label}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(progress.step / progress.total) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const incompleteBookings = bookings.filter(booking => isIncompleteBooking(booking.status));
  const filteredBookings = showIncompleteOnly 
    ? bookings.filter(booking => isIncompleteBooking(booking.status))
    : bookings;

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId, { reason: 'User cancelled from My Bookings' });
      toast.success('Booking cancelled successfully');
      // Refresh bookings
      const data = await getUserBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const handleDownloadInvoice = async (bookingId) => {
    try {
      setDownloadingInvoiceId(bookingId);
      await downloadInvoice(bookingId);
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice. Please try again.');
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Incomplete Bookings Notification Banner */}
      {incompleteBookings.length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 border-l-4 border-yellow-600 p-4 rounded-md shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Action Required: Complete Your Booking{incompleteBookings.length > 1 ? 's' : ''}
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You have {incompleteBookings.length} incomplete booking{incompleteBookings.length > 1 ? 's' : ''} that need{incompleteBookings.length > 1 ? '' : 's'} your attention. 
                    {incompleteBookings.some(b => b.status === 'pending_payment') && ' Some require payment.'}
                    {incompleteBookings.some(b => b.status === 'payment_completed') && ' Some need participant details.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => setShowIncompleteOnly(true)}
                className="bg-yellow-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                View Incomplete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions for Incomplete Bookings */}
      {incompleteBookings.length > 0 && (
        <div className="mb-6 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incompleteBookings.slice(0, 3).map((booking) => {
              const resumeAction = getResumeAction(booking);
              if (!resumeAction) return null;
              
              return (
                <div key={booking._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 truncate">
                      {booking.trek?.name || 'Unknown Trek'}
                    </h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {resumeAction.text} to continue your booking
                  </p>
                  <Link
                    to={resumeAction.link}
                    className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white ${resumeAction.color} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
                  >
                    <span className="mr-1">{resumeAction.icon}</span>
                    {resumeAction.text}
                  </Link>
                </div>
              );
            })}
          </div>
          {incompleteBookings.length > 3 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowIncompleteOnly(true)}
                className="text-emerald-600 hover:text-emerald-800 font-medium"
              >
                View all {incompleteBookings.length} incomplete bookings →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Success Message for Complete Bookings */}
      {bookings.length > 0 && incompleteBookings.length === 0 && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                All your bookings are complete! 🎉
              </p>
              <p className="text-sm text-green-700 mt-1">
                You're all set for your upcoming adventures.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <Link
          to="/tickets"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
        >
          <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          View Support Tickets
        </Link>
      </div>

      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <p className="mt-2 text-sm text-gray-700">
            View and manage all your trek bookings.
          </p>
          {incompleteBookings.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-yellow-800 font-medium">
                    ⏳ You have {incompleteBookings.length} incomplete booking{incompleteBookings.length > 1 ? 's' : ''} that need attention
                  </span>
                </div>
                <button
                  onClick={() => setShowIncompleteOnly(!showIncompleteOnly)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    showIncompleteOnly 
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  }`}
                >
                  {showIncompleteOnly ? 'Show All' : 'Show Incomplete Only'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
          <p className="text-gray-500 mb-4">You don't have any bookings yet.</p>
          <Link
            to="/treks"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            Browse Treks
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Trek
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Booking Date
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Participants
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Total Amount (INR)
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Next Action
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Created At
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredBookings.map((booking) => {
                      const resumeAction = getResumeAction(booking);
                      const isIncomplete = isIncompleteBooking(booking.status);
                      
                      return (
                        <tr key={booking._id} className={isIncomplete ? 'bg-yellow-50' : ''}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            <div className="flex items-center">
                              {booking.trek ? booking.trek.name : 'N/A'}
                              {isIncomplete && (
                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  ⏳ Incomplete
                                </span>
                              )}
                            </div>
                            <ProgressIndicator booking={booking} />
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {booking.batch && booking.batch.startDate ? formatDate(booking.batch.startDate) : 'N/A'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {booking.participants || 0}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            ₹{booking.totalPrice ? booking.totalPrice.toFixed(2) : '0.00'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {resumeAction ? resumeAction.text : 'N/A'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatDate(booking.createdAt)}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex items-center justify-end space-x-2">
                              {resumeAction && (
                                <Link
                                  to={resumeAction.link}
                                  className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white ${resumeAction.color} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
                                >
                                  <span className="mr-1">{resumeAction.icon}</span>
                                  {resumeAction.text}
                                </Link>
                              )}
                              <Link
                                to={`/booking-detail/${booking._id}`}
                                className="text-emerald-600 hover:text-emerald-900"
                              >
                                View
                              </Link>
                              {/* Download Invoice Button - Available for all booking statuses */}
                              <button
                                onClick={() => handleDownloadInvoice(booking._id)}
                                disabled={downloadingInvoiceId === booking._id}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                                title="Download Invoice"
                              >
                                {downloadingInvoiceId === booking._id ? (
                                  <svg className="animate-spin h-3 w-3 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <FaDownload className="h-3 w-3" />
                                )}
                              </button>
                              {(booking.status === 'confirmed' || booking.status === 'pending_payment') && (
                                <button
                                  onClick={() => handleCancelBooking(booking._id)}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                  disabled={cancellingId === booking._id}
                                >
                                  {cancellingId === booking._id ? 'Cancelling...' : 'Cancel'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyBookings; 