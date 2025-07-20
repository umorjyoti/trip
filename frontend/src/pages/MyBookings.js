import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserBookings, downloadInvoice } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { FaDownload, FaEye, FaCalendarAlt, FaUsers, FaRupeeSign, FaTicketAlt } from 'react-icons/fa';

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
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
      case 'payment_confirmed_partial':
        return 'bg-orange-100 text-orange-800';
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
      case 'payment_confirmed_partial':
        return {
          text: 'Pay Remaining Balance',
          link: `/payment/${booking._id}`,
          color: 'bg-orange-600 hover:bg-orange-700',
          icon: '💰'
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
    return ['pending_payment', 'payment_confirmed_partial', 'payment_completed'].includes(status);
  };

  const getBookingProgress = (status) => {
    switch (status) {
      case 'pending_payment':
        return { step: 1, total: 3, label: 'Payment Pending' };
      case 'payment_confirmed_partial':
        return { step: 1, total: 3, label: 'Partial Payment Complete' };
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
      <div className="mt-3">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Incomplete Bookings Notification Banner */}
      {incompleteBookings.length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 border-l-4 border-yellow-600 p-4 rounded-md shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start sm:items-center">
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
            <div className="flex-shrink-0">
              <button
                onClick={() => setShowIncompleteOnly(true)}
                className="w-full sm:w-auto bg-yellow-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                View Incomplete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions for Incomplete Bookings */}
      {incompleteBookings.length > 0 && (
        <div className="mb-6 bg-white shadow rounded-lg p-4 sm:p-6">
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

      {/* Header Section - Mobile Responsive */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="mt-1 sm:mt-2 text-sm text-gray-600">
              View and manage all your trek bookings.
            </p>
          </div>
          <Link
            to="/tickets"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
          >
            <FaTicketAlt className="mr-2 h-4 w-4" />
            View Support Tickets
          </Link>
        </div>
      </div>

      {/* Filter Toggle for Incomplete Bookings */}
      {incompleteBookings.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center">
              <span className="text-yellow-800 font-medium">
                ⏳ You have {incompleteBookings.length} incomplete booking{incompleteBookings.length > 1 ? 's' : ''} that need attention
              </span>
            </div>
            <button
              onClick={() => setShowIncompleteOnly(!showIncompleteOnly)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
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
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const resumeAction = getResumeAction(booking);
            const isIncomplete = isIncompleteBooking(booking.status);
            
            return (
              <div 
                key={booking._id} 
                className={`bg-white shadow rounded-lg overflow-hidden border-l-4 ${
                  isIncomplete ? 'border-l-yellow-400 bg-yellow-50' : 'border-l-emerald-400'
                }`}
              >
                <div className="p-4 sm:p-6">
                  {/* Header with Trek Name and Status */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                        {booking.trek?.name || 'Unknown Trek'}
                      </h3>
                      {isIncomplete && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-2">
                          ⏳ Incomplete
                        </span>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>

                  {/* Progress Indicator for Incomplete Bookings */}
                  <ProgressIndicator booking={booking} />

                  {/* Booking Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <FaCalendarAlt className="mr-2 h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Trek Date</p>
                        <p>{booking.batch && booking.batch.startDate ? formatDate(booking.batch.startDate) : 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <FaUsers className="mr-2 h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Participants</p>
                        <p>{booking.numberOfParticipants || 0}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <FaRupeeSign className="mr-2 h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Total Amount</p>
                        <p>₹{booking.totalPrice ? booking.totalPrice.toFixed(2) : '0.00'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <FaCalendarAlt className="mr-2 h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Booked On</p>
                        <p>{formatDate(booking.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Partial Payment Information */}
                  {booking.paymentMode === 'partial' && booking.partialPaymentDetails && 
                   booking.status !== 'confirmed' && booking.status !== 'payment_completed' && (
                    <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-orange-800">Partial Payment Details</h4>
                        {booking.status === 'payment_confirmed_partial' && (
                          <span className="text-xs text-orange-600 font-medium">
                            ⏰ Due: {booking.partialPaymentDetails.finalPaymentDueDate ? 
                              formatDate(booking.partialPaymentDetails.finalPaymentDueDate) : 'N/A'}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Initial Payment:</span>
                          <span className="ml-2 font-medium text-green-600">
                            ₹{booking.partialPaymentDetails.initialAmount?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Remaining Balance:</span>
                          <span className="ml-2 font-medium text-orange-600">
                            ₹{booking.partialPaymentDetails.remainingAmount?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                    {resumeAction && (
                      <Link
                        to={resumeAction.link}
                        className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${resumeAction.color} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 flex-1 sm:flex-none`}
                      >
                        <span className="mr-2">{resumeAction.icon}</span>
                        {resumeAction.text}
                      </Link>
                    )}
                    
                    <Link
                      to={`/booking-detail/${booking._id}`}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 flex-1 sm:flex-none"
                    >
                      <FaEye className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                    
                    <button
                      onClick={() => handleDownloadInvoice(booking._id)}
                      disabled={downloadingInvoiceId === booking._id}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 flex-1 sm:flex-none"
                      title="Download Invoice"
                    >
                      {downloadingInvoiceId === booking._id ? (
                        <svg className="animate-spin h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <>
                          <FaDownload className="mr-2 h-4 w-4" />
                          Invoice
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyBookings; 
