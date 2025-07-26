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


      {filteredBookings.length === 0 ? (
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
                className={`bg-white shadow-sm rounded-lg border ${
                  isIncomplete ? 'border-yellow-200' : 'border-gray-200'
                } hover:shadow-md transition-shadow`}
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {booking.trek?.name || 'Unknown Trek'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Essential Info */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <FaCalendarAlt className="mr-1 h-3 w-3 text-gray-400" />
                      <span>{booking.batch && booking.batch.startDate ? formatDate(booking.batch.startDate) : 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <FaUsers className="mr-1 h-3 w-3 text-gray-400" />
                      <span>{booking.numberOfParticipants || 0} person{booking.numberOfParticipants !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center font-medium text-gray-900">
                      <FaRupeeSign className="mr-1 h-3 w-3" />
                      <span>₹{booking.totalPrice ? booking.totalPrice.toFixed(2) : '0.00'}</span>
                    </div>
                  </div>

                  {/* Partial Payment Alert */}
                  {booking.paymentMode === 'partial' && booking.partialPaymentDetails && 
                   booking.status !== 'confirmed' && booking.status !== 'payment_completed' && (
                    <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-orange-700 font-medium">
                          Balance: ₹{booking.partialPaymentDetails.remainingAmount?.toFixed(2) || '0.00'}
                        </span>
                        {booking.status === 'payment_confirmed_partial' && (
                          <span className="text-orange-600">
                            Due: {booking.partialPaymentDetails.finalPaymentDueDate ? 
                              formatDate(booking.partialPaymentDetails.finalPaymentDueDate) : 'N/A'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {booking.paymentMode === 'partial' && booking.status === 'payment_confirmed_partial' ? (
                      <>
                        <Link
                          to={`/payment/${booking._id}`}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                          <span className="mr-1">💰</span>
                          Pay Remaining Balance
                        </Link>
                        <Link
                          to={`/booking/${booking._id}/participant-details`}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                          <span className="mr-1">👥</span>
                          Fill Participant Details
                        </Link>
                      </>
                    ) : (
                      resumeAction && (
                        <Link
                          to={resumeAction.link}
                          className={`flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white ${resumeAction.color} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
                        >
                          <span className="mr-1">{resumeAction.icon}</span>
                          {resumeAction.text}
                        </Link>
                      )
                    )}
                    
                    <Link
                      to={`/booking-detail/${booking._id}`}
                      className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                      <FaEye className="h-4 w-4" />
                    </Link>
                    
                    <button
                      onClick={() => handleDownloadInvoice(booking._id)}
                      disabled={downloadingInvoiceId === booking._id}
                      className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                      title="Download Invoice"
                    >
                      {downloadingInvoiceId === booking._id ? (
                        <svg className="animate-spin h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <FaDownload className="h-4 w-4" />
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
