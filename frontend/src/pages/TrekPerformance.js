import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  getTrekPerformance, 
  getBatchPerformance,
  sendReminderEmail,
  sendConfirmationEmail,
  sendInvoiceEmail,
  cancelBooking,
  sendPartialPaymentReminder,
  markPartialPaymentComplete
} from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import ParticipantExportModal from '../components/ParticipantExportModal';
import RemarksModal from '../components/RemarksModal';
import BookingActionMenu from '../components/BookingActionMenu';
import EditBookingModal from '../components/EditBookingModal';
import ShiftBookingModal from '../components/ShiftBookingModal';
import ViewBookingModal from '../components/ViewBookingModal';
import CancellationModal from '../components/CancellationModal';
import RequestResponseModal from '../components/RequestResponseModal';
import { formatCurrency, formatCurrencyWithSuffix, formatNumberWithSuffix, formatDate } from '../utils/formatters';
import CustomTooltip from '../components/CustomTooltip';

const TrekPerformance = () => {
  const { trekId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [performanceData, setPerformanceData] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchDetails, setBatchDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [showRequestResponseModal, setShowRequestResponseModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchPerformanceData();
  }, [trekId]);

  useEffect(() => {
    // Auto-select batch from URL query parameter
    const batchId = searchParams.get('batchId');
    if (performanceData && batchId) {
      const batch = performanceData.batches.find(b => b._id === batchId);
      if (batch) {
        handleBatchClick(batch);
      }
    }
  }, [performanceData, searchParams]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const data = await getTrekPerformance(trekId);
      setPerformanceData(data);
      setError('');
    } catch (err) {
      console.error('Error fetching trek performance:', err);
      setError('Failed to load trek performance data');
      toast.error('Failed to load trek performance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchDetails = async (batchId) => {
    try {
      setLoading(true);
      const data = await getBatchPerformance(trekId, batchId);
      setBatchDetails(data);
      setError('');
    } catch (err) {
      console.error('Error fetching batch details:', err);
      toast.error('Failed to load batch details');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchClick = async (batch) => {
    setSelectedBatch(batch);
    // Update URL with batch ID
    setSearchParams({ batchId: batch._id });
    await fetchBatchDetails(batch._id);
  };

  const handleRemarksClick = (booking) => {
    setSelectedBooking(booking);
    setShowRemarksModal(true);
  };

  const handleRemarksUpdate = (newRemarks) => {
    if (batchDetails && selectedBooking) {
      const updatedBatchDetails = {
        ...batchDetails,
        bookingDetails: batchDetails.bookingDetails.map(booking =>
          booking.bookingId === selectedBooking.bookingId
            ? { ...booking, adminRemarks: newRemarks }
            : booking
        )
      };
      setBatchDetails(updatedBatchDetails);
    }
  };

  const handleBookingUpdate = (updatedData) => {
    if (batchDetails && selectedBooking) {
      const updatedBatchDetails = {
        ...batchDetails,
        bookingDetails: batchDetails.bookingDetails.map(booking =>
          booking.bookingId === selectedBooking.bookingId
            ? { 
                ...booking, 
                participantDetails: updatedData.participantDetails
              }
            : booking
        )
      };
      setBatchDetails(updatedBatchDetails);
    }
  };

  const handleBookingShift = (newBatchId) => {
    // Remove the booking from current batch details
    if (batchDetails && selectedBooking) {
      const updatedBatchDetails = {
        ...batchDetails,
        bookingDetails: batchDetails.bookingDetails.filter(booking =>
          booking.bookingId !== selectedBooking.bookingId
        )
      };
      setBatchDetails(updatedBatchDetails);
    }
  };

  const handleBookingAction = async (action, booking) => {
    setSelectedBooking(booking);
    
    switch (action) {
      case 'view':
        setShowViewModal(true);
        break;
        
      case 'reminder':
        try {
          await sendReminderEmail(booking.bookingId);
          toast.success('Reminder email sent successfully');
        } catch (error) {
          console.error('Error sending reminder email:', error);
          toast.error(error.response?.data?.message || 'Failed to send reminder email');
        }
        break;
        
      case 'partial-reminder':
        try {
          await sendPartialPaymentReminder(booking.bookingId);
          toast.success('Partial payment reminder sent successfully');
          fetchBatchDetails(selectedBatch._id); // Refresh batch details
        } catch (error) {
          console.error('Error sending partial payment reminder:', error);
          toast.error(error.message || 'Failed to send partial payment reminder');
        }
        break;
        
      case 'mark-partial-complete':
        try {
          await markPartialPaymentComplete(booking.bookingId);
          toast.success('Partial payment marked as complete successfully');
          fetchBatchDetails(selectedBatch._id); // Refresh batch details
        } catch (error) {
          console.error('Error marking partial payment as complete:', error);
          toast.error(error.message || 'Failed to mark partial payment as complete');
        }
        break;
        
      case 'confirmation':
        try {
          await sendConfirmationEmail(booking.bookingId);
          toast.success('Confirmation email sent successfully');
        } catch (error) {
          console.error('Error sending confirmation email:', error);
          toast.error(error.response?.data?.message || 'Failed to send confirmation email');
        }
        break;
        
      case 'invoice':
        try {
          await sendInvoiceEmail(booking.bookingId);
          toast.success('Invoice email sent successfully');
        } catch (error) {
          console.error('Error sending invoice email:', error);
          toast.error(error.response?.data?.message || 'Failed to send invoice email');
        }
        break;
        
      case 'edit':
        setShowEditModal(true);
        break;
        
      case 'cancel':
        setShowCancellationModal(true);
        break;
        
      case 'shift':
        setShowShiftModal(true);
        break;
        
      case 'respond-request':
        setShowRequestResponseModal(true);
        break;
        
      default:
        toast.error('Unknown action');
    }
  };

  const handleRequestResponseSuccess = () => {
    // Refresh both batch details and overall performance data
    if (selectedBatch) {
      fetchBatchDetails(selectedBatch._id);
      // Ensure URL maintains the batch ID
      setSearchParams({ batchId: selectedBatch._id });
    }
    // Also refresh the overall performance data to update batch participant counts
    fetchPerformanceData();
  };

  const handleCancellationConfirm = async (cancellationData) => {
    try {
      await cancelBooking(cancellationData.bookingId || selectedBooking.bookingId, cancellationData);
      toast.success('Booking cancelled successfully');
      
      // Refresh both batch details and overall performance data
      if (selectedBatch) {
        await fetchBatchDetails(selectedBatch._id);
        // Ensure URL maintains the batch ID
        setSearchParams({ batchId: selectedBatch._id });
      }
      // Also refresh the overall performance data to update batch participant counts
      await fetchPerformanceData();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
      throw error; // Re-throw to let the modal handle the error state
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        {error}
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="p-4 text-gray-600">
        No performance data available
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">{performanceData.trek.name} Performance</h1>
      
      {/* Overall Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Revenue</h3>
          <CustomTooltip 
            content={`₹${performanceData.totalRevenue?.toLocaleString('en-IN') || '0'}`}
            position="top"
          >
            <p className="text-3xl font-bold text-emerald-600 cursor-help">
              {formatCurrencyWithSuffix(performanceData.totalRevenue)}
            </p>
          </CustomTooltip>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Bookings</h3>
          <CustomTooltip 
            content={performanceData.totalBookings?.toLocaleString('en-IN') || '0'}
            position="top"
          >
            <p className="text-3xl font-bold text-blue-600 cursor-help">
              {formatNumberWithSuffix(performanceData.totalBookings)}
            </p>
          </CustomTooltip>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Rating</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {performanceData.averageRating.toFixed(1)} / 5.0
          </p>
        </div>
      </div>

      {/* Batch Performance Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Batch Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Occupancy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performanceData.batches.sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).map((batch) => (
                <tr 
                  key={batch._id} 
                  onClick={() => handleBatchClick(batch)}
                  className={`cursor-pointer hover:bg-gray-50 ${selectedBatch?._id === batch._id ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(batch.startDate)} - {formatDate(batch.endDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {batch.currentParticipants} / {batch.maxParticipants}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(batch.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Math.round((batch.currentParticipants / batch.maxParticipants) * 100)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      batch.status === 'completed' ? 'bg-green-100 text-green-800' :
                      batch.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Details Modal */}
      {selectedBatch && batchDetails && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Batch Details: {formatDate(batchDetails.batchDetails.startDate)} - {formatDate(batchDetails.batchDetails.endDate)}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => fetchBatchDetails(selectedBatch._id)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Participants
              </button>
              <button
                onClick={() => {
                  setSelectedBatch(null);
                  setBatchDetails(null);
                  setSearchParams({}); // Clear batchId from URL
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Batch Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
              <p className="mt-1 text-2xl font-semibold text-emerald-600">{formatCurrency(batchDetails.revenue.total)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Participants</h3>
              <p className="mt-1 text-2xl font-semibold text-blue-600">
                {batchDetails.participants.total} / {batchDetails.batchDetails.maxParticipants}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Booking Status</h3>
              <div className="mt-1 space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Confirmed</span>
                  <span className="text-sm font-medium text-green-600">{batchDetails.bookings.confirmed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Cancelled</span>
                  <span className="text-sm font-medium text-red-600">{batchDetails.bookings.cancelled}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total</span>
                  <span className="text-sm font-medium">{batchDetails.bookings.total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Participants List */}
          <div className="px-6 py-5 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bookings</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact & Booking Info</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount & Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {batchDetails.bookingDetails.map((booking) => (
                    <tr key={booking.bookingId}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{booking.user.name}</div>
                        <div className="text-sm text-gray-500">{booking.user.email}</div>
                        <div className="text-sm text-gray-500">{booking.user.phone}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Booked: {formatDate(booking.bookingDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {booking.participantDetails && booking.participantDetails.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1">
                            {booking.participantDetails.map((participant, index) => (
                              <li key={index} className={`text-xs ${participant.isCancelled ? 'line-through text-gray-400' : ''}`}>
                                <span className={`font-medium ${participant.isCancelled ? 'text-gray-400' : 'text-gray-900'}`}>
                                  {participant.name}
                                  {participant.isCancelled && (
                                    <span className="ml-1 text-red-500 text-xs">(Cancelled)</span>
                                  )}
                                </span>
                                {participant.phone && (
                                  <span className={`${participant.isCancelled ? 'text-gray-300' : 'text-gray-400'}`}> - {participant.phone}</span>
                                )}
                                {participant.email && (
                                  <span className={`${participant.isCancelled ? 'text-gray-300' : 'text-gray-400'}`}> - {participant.email}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-400">No participant details available</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {formatCurrency(booking.amountPaid || booking.totalPrice)}
                        </div>
                        
                        {/* Partial Payment Information */}
                        {booking.paymentMode === 'partial' && booking.partialPaymentDetails && (
                          <div className="text-xs text-gray-600 mb-1">
                            <div>Total: {formatCurrency(booking.totalPrice)}</div>
                            {booking.status === 'payment_confirmed_partial' && (
                              <>
                                <div className="text-orange-600">Remaining: {formatCurrency(booking.partialPaymentDetails.remainingAmount || 0)}</div>
                                {booking.partialPaymentDetails.finalPaymentDueDate && (
                                  <div className="text-red-600">Due: {formatDate(booking.partialPaymentDetails.finalPaymentDueDate)}</div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                        
                        {(() => {
                          // Calculate total refunded amount (booking-level + participant-level)
                          let refunded = 0;
                          if (booking.refundStatus === 'success') {
                            refunded += booking.refundAmount || 0;
                          }
                          if (Array.isArray(booking.participantDetails)) {
                            refunded += booking.participantDetails.reduce((rSum, p) => {
                              if (p.refundStatus === 'success') {
                                return rSum + (p.refundAmount || 0);
                              }
                              return rSum;
                            }, 0);
                          }
                          
                          if (refunded > 0) {
                            return (
                              <div className="text-xs text-red-600 mb-1">
                                Refunded: {formatCurrency(refunded)}
                              </div>
                            );
                          }
                          return null;
                        })()}
                        
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'payment_confirmed_partial' ? 'bg-orange-100 text-orange-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {booking.cancellationRequest ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="capitalize font-medium text-gray-900">
                                {booking.cancellationRequest.type}
                              </span>
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                booking.cancellationRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                booking.cancellationRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                                booking.cancellationRequest.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {booking.cancellationRequest.status}
                              </span>
                            </div>
                            {booking.cancellationRequest.reason && (
                              <p className="text-xs text-gray-600 truncate max-w-32">
                                {booking.cancellationRequest.reason}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              {booking.cancellationRequest.requestedAt ? formatDate(booking.cancellationRequest.requestedAt) : "-"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No request</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 w-48 max-w-48">
                        <button
                          onClick={() => handleRemarksClick(booking)}
                          className="text-left w-full hover:bg-gray-50 p-2 rounded transition-colors"
                        >
                          {booking.adminRemarks ? (
                            <div className="max-w-40">
                              <p className="text-gray-900 truncate text-xs">{booking.adminRemarks}</p>
                              <p className="text-xs text-gray-400 mt-1">Click to edit</p>
                            </div>
                          ) : (
                            <div className="text-gray-400 italic">
                              <p className="text-xs">No remarks</p>
                              <p className="text-xs mt-1">Click to add</p>
                            </div>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <BookingActionMenu 
                          booking={booking} 
                          onAction={handleBookingAction}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Remarks Modal */}
      <RemarksModal
        isOpen={showRemarksModal}
        onClose={() => setShowRemarksModal(false)}
        booking={selectedBooking}
        onUpdate={handleRemarksUpdate}
      />

      {/* Edit Booking Modal */}
      <EditBookingModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        booking={selectedBooking}
        trekData={performanceData?.trek}
        onUpdate={handleBookingUpdate}
      />

      {/* Shift Booking Modal */}
      <ShiftBookingModal
        isOpen={showShiftModal}
        onClose={() => setShowShiftModal(false)}
        booking={selectedBooking}
        trekId={trekId}
        onUpdate={handleBookingShift}
      />

      {/* View Booking Modal */}
      <ViewBookingModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        booking={selectedBooking}
        trekData={performanceData?.trek}
      />

      {/* Export Participants Modal */}
      <ParticipantExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        trekId={trekId}
        batchId={selectedBatch?._id}
        trekData={performanceData?.trek}
      />

      {/* Cancellation Modal */}
      <CancellationModal
        isOpen={showCancellationModal}
        onClose={() => setShowCancellationModal(false)}
        bookingId={selectedBooking?.bookingId}
        trek={performanceData?.trek}
        onConfirmCancellation={handleCancellationConfirm}
      />

      {/* Request Response Modal */}
      <RequestResponseModal
        isOpen={showRequestResponseModal}
        onClose={() => setShowRequestResponseModal(false)}
        booking={selectedBooking}
        batchDetails={batchDetails}
        trek={performanceData?.trek}
        onSuccess={handleRequestResponseSuccess}
      />
    </div>
  );
};

export default TrekPerformance; 