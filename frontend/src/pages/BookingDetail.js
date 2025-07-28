import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { getBookingById, downloadInvoice } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import CreateTicketModal from '../components/CreateTicketModal';
import { FaDownload, FaHistory, FaClock, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaCalculator } from 'react-icons/fa';

function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const paymentStatus = location.state?.paymentStatus;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const data = await getBookingById(id);
        console.log('Booking data:', data);
        
        if (!data) {
          throw new Error('Booking not found');
        }
        
        // Ensure all required fields are present
        const bookingData = {
          ...data,
          trek: data.trek || {},
          batch: data.batch || {},
          participants: data.participants || 0,
          totalPrice: data.totalPrice || 0,
          status: data.status || 'unknown',
          createdAt: data.createdAt || new Date(),
          cancelledAt: data.cancelledAt || null,
          participantDetails: Array.isArray(data.participantDetails) ? data.participantDetails : [],
          cancellationRequest: data.cancellationRequest || null,
          paymentMode: data.paymentMode || 'full',
          partialPaymentDetails: data.partialPaymentDetails || null
        };
        
        setBooking(bookingData);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError(err.response?.data?.message || 'Failed to load booking details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'payment_confirmed_partial':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateTicket = () => {
    setShowTicketModal(true);
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      await downloadInvoice(booking._id);
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice. Please try again.');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const ParticipantList = ({ participants }) => {
    return (
      <div className="space-y-4">
        {participants.map((participant) => (
          <div key={participant._id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
            <div>
              <h4 className="font-medium">{participant.name}</h4>
              <p className="text-sm text-gray-600">Age: {participant.age}</p>
              <p className="text-sm text-gray-600">Gender: {participant.gender}</p>
              <div className="text-xs text-gray-500">Status: {participant.status || (participant.isCancelled ? 'bookingCancelled' : 'confirmed')}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const RequestHistory = ({ cancellationRequest }) => {
    
    if (!cancellationRequest) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FaHistory className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-sm">No request history available</p>
        </div>
      );
    }

    const getStatusIcon = (status) => {
      switch (status) {
        case 'pending':
          return <FaClock className="h-5 w-5 text-yellow-500" />;
        case 'approved':
          return <FaCheckCircle className="h-5 w-5 text-green-500" />;
        case 'rejected':
          return <FaTimesCircle className="h-5 w-5 text-red-500" />;
        default:
          return <FaExclamationTriangle className="h-5 w-5 text-gray-500" />;
      }
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'pending':
          return 'border-yellow-200 bg-yellow-50';
        case 'approved':
          return 'border-green-200 bg-green-50';
        case 'rejected':
          return 'border-red-200 bg-red-50';
        default:
          return 'border-gray-200 bg-gray-50';
      }
    };

    return (
      <div className="space-y-4">
        <div className={`border-l-4 border-l-4 p-4 rounded-r-lg ${getStatusColor(cancellationRequest.status)}`}>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getStatusIcon(cancellationRequest.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 capitalize">
                  {cancellationRequest.type} Request
                </h4>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  cancellationRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  cancellationRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                  cancellationRequest.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {cancellationRequest.status}
                </span>
              </div>
              
              <div className="mt-2 space-y-2 text-sm text-gray-600">
                {cancellationRequest.reason && (
                  <div>
                    <span className="font-medium">Reason: </span>
                    <span>{cancellationRequest.reason}</span>
                  </div>
                )}
                
                {cancellationRequest.type === 'reschedule' && cancellationRequest.preferredBatch && (
                  <div>
                    <span className="font-medium">Preferred Batch: </span>
                    <span>
                      {(() => {
                        // Find the preferred batch from trek batches
                        if (booking.trek && booking.trek.batches) {
                          const preferredBatch = booking.trek.batches.find(
                            batch => batch._id.toString() === cancellationRequest.preferredBatch.toString()
                          );
                          if (preferredBatch) {
                            return `${formatDate(preferredBatch.startDate)} - ${formatDate(preferredBatch.endDate)} (₹${preferredBatch.price})`;
                          }
                        }
                        return 'Batch details not available';
                      })()}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center text-xs text-gray-500">
                  <FaClock className="mr-1 h-3 w-3" />
                  Requested: {formatDate(cancellationRequest.requestedAt)}
                </div>
                
                {cancellationRequest.adminResponse && (
                  <div className="mt-3 p-3 bg-white rounded border-l-4 border-l-blue-400">
                    <div className="font-medium text-sm text-gray-900 mb-1">Admin Response:</div>
                    <div className="text-sm text-gray-700">{cancellationRequest.adminResponse}</div>
                    {cancellationRequest.respondedAt && (
                      <div className="text-xs text-gray-500 mt-2">
                        Responded: {formatDate(cancellationRequest.respondedAt)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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

  if (!booking) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">Booking not found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Payment Status Alert */}
      {paymentStatus === 'success' && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">Payment completed successfully!</p>
            </div>
          </div>
        </div>
      )}
      {paymentStatus === 'failure' && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">Payment failed. Please try again or contact support.</p>
            </div>
          </div>
        </div>
      )}
      <div className="mb-8">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <div>
                <Link to="/" className="text-gray-400 hover:text-gray-500">
                  <svg className="flex-shrink-0 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  <span className="sr-only">Home</span>
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
                <Link to="/my-bookings" className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">My Bookings</Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
                <span className="ml-4 text-sm font-medium text-gray-500">Booking Details</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      {/* Payment Summary Section - Prominent display for partial payments */}
      {(booking.paymentMode === 'partial' && booking.partialPaymentDetails && booking.status === 'payment_confirmed_partial') ? (
        <div className="mb-4">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-3 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Payment Summary</h3>
                  <div className="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800">
                    Partial Payment
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="bg-white rounded-lg p-2 sm:p-4 border border-orange-200">
                    <div className="text-xs text-gray-500">Amount Paid</div>
                    <div className="text-lg sm:text-2xl font-bold text-emerald-600">
                      ₹{booking.partialPaymentDetails?.initialAmount?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2 sm:p-4 border border-orange-200">
                    <div className="text-xs text-gray-500">Remaining Due</div>
                    <div className="text-lg sm:text-2xl font-bold text-red-600">
                      ₹{booking.partialPaymentDetails?.remainingAmount?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2 sm:p-4 border border-orange-200">
                    <div className="text-xs text-gray-500">Due Date</div>
                    <div className="text-sm sm:text-lg font-semibold text-red-600">
                      {booking.partialPaymentDetails?.finalPaymentDueDate ? formatDate(booking.partialPaymentDetails.finalPaymentDueDate) : 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mt-2 text-center sm:text-left">
                  Total: ₹{booking.totalPrice?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="text-center lg:text-right lg:self-center">
                {booking.status === 'payment_confirmed_partial' && (
                  <button
                    onClick={() => {
                      // Navigate to payment page for remaining balance
                      navigate(`/payment/${booking._id}`);
                    }}
                    className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
                  >
                    Pay Remaining Balance
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Booking Details */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Booking Details</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Booking ID: {booking._id}
              </p>
            </div>
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(booking.status)} break-words`}>
              {booking.status.replace(/_/g, ' ')}
            </span>
          </div>
          
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Trek</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {booking.trek && (
                    <Link to={`/treks/${booking.trek._id}`} className="text-emerald-600 hover:text-emerald-900">
                      {booking.trek.name}
                    </Link>
                  )}
                </dd>
              </div>
              <div className="bg-white px-4 py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Booking Date</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(booking.createdAt)}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Batch Information</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {booking.batch && (
                    <>
                      {booking.batch.name && <div><strong>Name:</strong> {booking.batch.name}</div>}
                      <div><strong>Start Date:</strong> {booking.batch.startDate ? formatDate(booking.batch.startDate) : 'N/A'}</div>
                      <div><strong>End Date:</strong> {booking.batch.endDate ? formatDate(booking.batch.endDate) : 'N/A'}</div>
                      {booking.batch.price && <div><strong>Price:</strong> ₹{booking.batch.price}</div>}
                    </>
                  )}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Number of Participants</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{booking.participants || 0}</dd>
              </div>
              <div className="bg-white px-4 py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Total Amount (INR)</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">₹{booking.totalPrice?.toFixed(2) || '0.00'}</dd>
              </div>
              
              {/* Partial Payment Information */}
              {booking.paymentMode === 'partial' && booking.partialPaymentDetails && 
               booking.status !== 'confirmed' && booking.status !== 'payment_completed' && (
                <>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Payment Mode</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800">
                        Partial Payment
                      </span>
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Amount Paid</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <span className="font-semibold text-emerald-600">₹{booking.partialPaymentDetails?.initialAmount?.toFixed(2) || '0.00'}</span>
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Remaining Balance</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <span className="font-semibold text-orange-600">₹{booking.partialPaymentDetails?.remainingAmount?.toFixed(2) || '0.00'}</span>
                    </dd>
                  </div>
                  {booking.partialPaymentDetails?.finalPaymentDueDate && (
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Final Payment Due Date</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <span className="font-semibold text-red-600">{formatDate(booking.partialPaymentDetails.finalPaymentDueDate)}</span>
                      </dd>
                    </div>
                  )}
                  {booking.partialPaymentDetails?.finalPaymentDate && (
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Final Payment Date</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <span className="font-semibold text-green-600">{formatDate(booking.partialPaymentDetails.finalPaymentDate)}</span>
                      </dd>
                    </div>
                  )}
                </>
              )}
              
              {booking.status === 'cancelled' && (
                <>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Cancellation Date</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {booking.cancelledAt ? formatDate(booking.cancelledAt) : 'Not specified'}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Cancellation Reason</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {booking.cancellationReason || 'Not specified'}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Refund Status</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        booking.refundStatus === 'success' ? 'bg-green-100 text-green-800' :
                        booking.refundStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        booking.refundStatus === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.refundStatus || 'Not applicable'}
                      </span>
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Refund Date</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {booking.refundDate ? formatDate(booking.refundDate) : 'Not applicable'}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Refund Amount</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div className="font-medium text-lg text-emerald-600 flex items-center">
                        <FaCalculator className="mr-1" />
                        {booking.refundStatus === 'success' ? `₹${booking.refundAmount || 0}` :
                         booking.refundStatus === 'failed' ? 'Refund Failed' :
                         booking.refundStatus === 'processing' ? 'Processing...' :
                         `₹${booking.refundAmount || 0}`}
                      </div>
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Refund Type</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        booking.refundStatus === 'failed' ? 'bg-red-100 text-red-800' :
                        booking.refundStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        booking.refundAmount === booking.totalPrice ? 'bg-blue-100 text-blue-800' :
                        booking.refundAmount > 0 ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.refundStatus === 'failed' ? 'Refund Failed' :
                         booking.refundStatus === 'processing' ? 'Processing Refund' :
                         booking.refundAmount === booking.totalPrice ? 'Full Refund (100%)' :
                         booking.refundAmount > 0 ? 'Partial Refund (Policy-based)' :
                         'No Refund (Policy-based)'}
                      </span>
                    </dd>
                  </div>
                  
                  {/* Additional refund information for participant-level cancellations */}
                  {booking.participantDetails && booking.participantDetails.some(p => p.refundStatus === 'success') && (
                    <div className="bg-orange-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-t border-orange-200">
                      <dt className="text-sm font-medium text-orange-800">Participant-Level Refunds</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <div className="space-y-2">
                          {booking.participantDetails
                            .filter(p => p.refundStatus === 'success')
                            .map((participant, index) => (
                              <div key={index} className="flex justify-between items-center text-sm bg-white p-2 rounded border">
                                <span className="text-gray-700">{participant.name}</span>
                                <span className="font-medium text-emerald-600">
                                  ₹{participant.refundAmount || 0}
                                </span>
                              </div>
                            ))}
                        </div>
                      </dd>
                    </div>
                  )}
                </>
              )}
            </dl>
          </div>
        </div>

        {/* Participants Details */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Participants</h3>
          </div>
          <div className="border-t border-gray-200">
            <div className="divide-y divide-gray-200">
              <ParticipantList participants={booking.participantDetails} />
            </div>
          </div>
        </div>
      </div>

      {/* Request History Section */}
      <div className="mt-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <FaHistory className="mr-2 h-5 w-5 text-gray-500" />
              Request History
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Track all cancellation and rescheduling requests for this booking
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <RequestHistory cancellationRequest={booking.cancellationRequest} />
          </div>
        </div>
      </div>

      {/* Action Buttons Section - Responsive for Mobile */}
      <div className="mt-8">
        <hr className="mb-4 border-gray-200" />
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          {/* Download Invoice Button */}
          <button
            type="button"
            onClick={handleDownloadInvoice}
            disabled={downloadingInvoice}
            className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all"
            aria-label="Download Invoice"
          >
            {downloadingInvoice ? (
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <FaDownload className="mr-2 h-5 w-5" />
            )}
            {downloadingInvoice ? 'Downloading...' : 'Download Invoice'}
          </button>

          {/* Create Support Ticket Button */}
          {booking.status !== 'cancelled' && (
            <button
              type="button"
              onClick={handleCreateTicket}
              className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all"
              aria-label="Need Help? Create Support Ticket"
            >
              <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Need Help? Create Support Ticket
            </button>
          )}
        </div>
      </div>

      {showTicketModal && (
        <CreateTicketModal
          bookingId={booking._id}
          onClose={() => setShowTicketModal(false)}
          onSuccess={() => {
            // Refresh booking data to show updated request history
            const fetchBooking = async () => {
              try {
                const data = await getBookingById(id);
                if (data) {
                  const bookingData = {
                    ...data,
                    trek: data.trek || {},
                    batch: data.batch || {},
                    participants: data.participants || 0,
                    totalPrice: data.totalPrice || 0,
                    status: data.status || 'unknown',
                    createdAt: data.createdAt || new Date(),
                    cancelledAt: data.cancelledAt || null,
                    participantDetails: Array.isArray(data.participantDetails) ? data.participantDetails : [],
                    cancellationRequest: data.cancellationRequest || null
                  };
                  setBooking(bookingData);
                }
              } catch (err) {
                console.error('Error refreshing booking:', err);
              }
            };
            fetchBooking();
          }}
        />
      )}
    </div>
  );
}

export default BookingDetail; 