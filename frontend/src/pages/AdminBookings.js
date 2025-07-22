import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllBookings, updateBookingStatus, getAllTreks, exportBookings, adminCancelBooking, sendReminderEmail, sendConfirmationEmail, sendInvoiceEmail, cancelBooking, sendPartialPaymentReminder, markPartialPaymentComplete } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import ExportBookingsModal from '../components/ExportBookingsModal';
import BookingsTable from './BookingsTable';
import ParticipantExportModal from '../components/ParticipantExportModal';
import RemarksModal from '../components/RemarksModal';
import BookingActionMenu from '../components/BookingActionMenu';
import EditBookingModal from '../components/EditBookingModal';

import ViewBookingModal from '../components/ViewBookingModal';
import CancellationModal from '../components/CancellationModal';
import RequestResponseModal from '../components/RequestResponseModal';
import { formatCurrency, formatCurrencyWithSuffix, formatNumberWithSuffix, formatDate } from '../utils/formatters';
import CustomTooltip from '../components/CustomTooltip';
import MetricTooltip from '../components/MetricTooltip';
import { FaCheckCircle, FaTimesCircle, FaUsers } from 'react-icons/fa';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'payment_confirmed_partial', label: 'Partial Payment Confirmed' },
  { value: 'payment_completed', label: 'Payment Completed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'trek_completed', label: 'Trek Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, confirmed, cancelled
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  
  // New filter states
  const [treks, setTreks] = useState([]);
  const [selectedTrek, setSelectedTrek] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [cancelModal, setCancelModal] = useState({ open: false, booking: null, refundType: 'auto' });
  const [cancelLoading, setCancelLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchValue, setSearchValue] = useState('');

  // Performance metrics states
  const [performanceMetrics, setPerformanceMetrics] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    averageBookingValue: 0,
    todayParticipantsCount: 0
  });

  // Modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [showViewModal, setShowViewModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [showRequestResponseModal, setShowRequestResponseModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchTreks();
    fetchBookings();
    // eslint-disable-next-line
  }, [filter, search, selectedTrek, selectedBatch, currentPage]);

  // Add a separate useEffect for date range
  useEffect(() => {
    if (startDate && endDate) {
      fetchBookings();
    }
    // eslint-disable-next-line
  }, [startDate, endDate]);

  const fetchTreks = async () => {
    try {
      const data = await getAllTreks();
      setTreks(data);
    } catch (err) {
      console.error('Error fetching treks:', err);
      toast.error('Failed to load treks');
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log('Fetching bookings with status:', filter, 'and search:', search);
      const data = await getAllBookings(currentPage, {
        status: filter !== 'all' ? filter : undefined,
        trekId: selectedTrek || undefined,
        batchId: selectedBatch || undefined,
        startDate: startDate ? startDate.toISOString().split('T')[0] : undefined,
        endDate: endDate ? endDate.toISOString().split('T')[0] : undefined,
        search: search || undefined
      });
      console.log('Bookings data:', data);
      setBookings(Array.isArray(data.bookings) ? data.bookings : []);
      setTotalPages(data.pagination.pages);
      setTotalBookings(data.pagination.total);
      
      // Use stats from API response instead of calculating from paginated data
      if (data.stats) {
        setPerformanceMetrics({
          totalRevenue: data.stats.totalRevenue || 0,
          totalBookings: data.stats.totalBookings || 0,
          confirmedBookings: data.stats.confirmedBookings || 0,
          cancelledBookings: data.stats.cancelledBookings || 0,
          averageBookingValue: data.stats.averageBookingValue || 0,
          todayParticipantsCount: data.stats.todayParticipantsCount || 0
        });
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings. Please try again later.');
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformanceMetrics = (bookingsData) => {
    const totalRevenue = bookingsData.reduce((sum, booking) => {
      const paid = booking.totalPrice || 0;
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
      return sum + (paid - refunded);
    }, 0);

    const confirmedBookings = bookingsData.filter(b => b.status === 'confirmed').length;
    const cancelledBookings = bookingsData.filter(b => b.status === 'cancelled').length;
    const averageBookingValue = bookingsData.length > 0 ? totalRevenue / bookingsData.length : 0;

    setPerformanceMetrics({
      totalRevenue,
      totalBookings: bookingsData.length,
      confirmedBookings,
      cancelledBookings,
      averageBookingValue
    });
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      console.log(`Changing booking ${bookingId} status to ${newStatus}`);
      await updateBookingStatus(bookingId, newStatus);
      toast.success(`Booking ${newStatus === 'confirmed' ? 'restored' : 'cancelled'} successfully`);
      fetchBookings(); // Refresh the list
    } catch (err) {
      console.error('Error updating booking status:', err);
      toast.error(err.message || 'Failed to update booking status');
    }
  };

  const handleTrekChange = (e) => {
    setSelectedTrek(e.target.value);
    setSelectedBatch(''); // Reset batch when trek changes
    setCurrentPage(1); // Reset to first page
  };

  const handleBatchChange = (e) => {
    setSelectedBatch(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    setCurrentPage(1); // Reset to first page
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleExport = async (exportOptions) => {
    try {
      const response = await exportBookings({
        ...exportOptions,
        filters: {
          status: filter !== 'all' ? filter : undefined,
          trekId: selectedTrek || undefined,
          batchId: selectedBatch || undefined,
          startDate: startDate ? startDate.toISOString().split('T')[0] : undefined,
          endDate: endDate ? endDate.toISOString().split('T')[0] : undefined
        }
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bookings_export.${exportOptions.fileType}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Bookings exported successfully');
    } catch (err) {
      console.error('Error exporting bookings:', err);
      toast.error('Failed to export bookings');
    }
  };

  // Refund calculation helper
  const calculateRefund = (booking, refundType = 'auto') => {
    if (!booking) return 0;
    const start = new Date(booking.batch?.startDate);
    const now = new Date();
    const total = booking.totalPrice;
    if (refundType === 'full') return total;
    const diffDays = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
    if (diffDays > 7) return Math.round(total * 0.9);
    if (diffDays >= 3) return Math.round(total * 0.5);
    return 0;
  };

  const openCancelModal = (booking) => {
    setCancelModal({ open: true, booking, refundType: 'auto' });
  };
  const closeCancelModal = () => setCancelModal({ open: false, booking: null, refundType: 'auto' });

  const handleCancelBooking = async () => {
    try {
      setCancelLoading(true);
      await adminCancelBooking({
        bookingId: cancelModal.booking._id,
        refund: calculateRefund(cancelModal.booking, cancelModal.refundType),
        refundType: cancelModal.refundType,
        reason: 'Admin cancellation'
      });
      toast.success('Booking cancelled successfully');
      closeCancelModal();
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.message || 'Failed to cancel booking');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleSendPartialReminder = async (bookingId) => {
    try {
      await sendPartialPaymentReminder(bookingId);
      toast.success('Partial payment reminder sent successfully');
      fetchBookings(); // Refresh to update reminder status
    } catch (error) {
      console.error('Error sending partial payment reminder:', error);
      toast.error(error.message || 'Failed to send partial payment reminder');
    }
  };

  const handleMarkPartialComplete = async (bookingId) => {
    try {
      await markPartialPaymentComplete(bookingId);
      toast.success('Partial payment marked as complete successfully');
      fetchBookings(); // Refresh to update booking status
    } catch (error) {
      console.error('Error marking partial payment as complete:', error);
      toast.error(error.message || 'Failed to mark partial payment as complete');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchValue);
    setCurrentPage(1);
  };

  // Enhanced booking action handlers
  const handleRemarksClick = (booking) => {
    setSelectedBooking(booking);
    setShowRemarksModal(true);
  };

  const handleRemarksUpdate = (newRemarks) => {
    if (selectedBooking) {
      const updatedBookings = bookings.map(booking =>
        booking._id === selectedBooking._id
          ? { ...booking, adminRemarks: newRemarks }
          : booking
      );
      setBookings(updatedBookings);
    }
  };

  const handleBookingUpdate = (updatedData) => {
    if (selectedBooking) {
      const updatedBookings = bookings.map(booking =>
        booking._id === selectedBooking._id
          ? { 
              ...booking, 
              participantDetails: updatedData.participantDetails
            }
          : booking
      );
      setBookings(updatedBookings);
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
          await sendReminderEmail(booking._id);
          toast.success('Reminder email sent successfully');
        } catch (error) {
          console.error('Error sending reminder email:', error);
          toast.error(error.response?.data?.message || 'Failed to send reminder email');
        }
        break;
        
      case 'partial-reminder':
        try {
          await sendPartialPaymentReminder(booking._id);
          toast.success('Partial payment reminder sent successfully');
          fetchBookings(); // Refresh to update reminder status
        } catch (error) {
          console.error('Error sending partial payment reminder:', error);
          toast.error(error.message || 'Failed to send partial payment reminder');
        }
        break;
        
      case 'mark-partial-complete':
        try {
          await markPartialPaymentComplete(booking._id);
          toast.success('Partial payment marked as complete successfully');
          fetchBookings(); // Refresh to update booking status
        } catch (error) {
          console.error('Error marking partial payment as complete:', error);
          toast.error(error.message || 'Failed to mark partial payment as complete');
        }
        break;
        
      case 'confirmation':
        try {
          await sendConfirmationEmail(booking._id);
          toast.success('Confirmation email sent successfully');
        } catch (error) {
          console.error('Error sending confirmation email:', error);
          toast.error(error.response?.data?.message || 'Failed to send confirmation email');
        }
        break;
        
      case 'invoice':
        try {
          await sendInvoiceEmail(booking._id);
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
        // Handle shift action if needed
        toast.info('Shift functionality not implemented yet');
        break;
        
      case 'respond-request':
        setShowRequestResponseModal(true);
        break;
        
      default:
        toast.error('Unknown action');
    }
  };

  const handleCancellationConfirm = async (cancellationData) => {
    try {
      await cancelBooking(cancellationData.bookingId || selectedBooking._id, cancellationData);
      toast.success('Booking cancelled successfully');
      
      // Refresh the bookings list
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
      throw error; // Re-throw to let the modal handle the error state
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          Export Bookings
        </button>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Revenue</h3>
          <MetricTooltip 
            value={performanceMetrics.totalRevenue}
            type="currency"
            theme="success"
          >
            <p className="text-3xl font-bold text-emerald-600 cursor-help">
              {formatCurrencyWithSuffix(performanceMetrics.totalRevenue)}
            </p>
          </MetricTooltip>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Bookings</h3>
          <MetricTooltip 
            value={performanceMetrics.totalBookings}
            type="number"
            theme="dark"
          >
            <p className="text-3xl font-bold text-blue-600 cursor-help">
              {formatNumberWithSuffix(performanceMetrics.totalBookings)}
            </p>
          </MetricTooltip>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmed Bookings</h3>
          <MetricTooltip 
            value={performanceMetrics.confirmedBookings}
            type="number"
            icon={<FaCheckCircle className="w-4 h-4" />}
            theme="success"
          >
            <p className="text-3xl font-bold text-green-600 cursor-help">
              {formatNumberWithSuffix(performanceMetrics.confirmedBookings)}
            </p>
          </MetricTooltip>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancelled Bookings</h3>
          <MetricTooltip 
            value={performanceMetrics.cancelledBookings}
            type="number"
            icon={<FaTimesCircle className="w-4 h-4" />}
            theme="error"
          >
            <p className="text-3xl font-bold text-red-600 cursor-help">
              {formatNumberWithSuffix(performanceMetrics.cancelledBookings)}
            </p>
          </MetricTooltip>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg. Booking</h3>
          <MetricTooltip 
            value={performanceMetrics.averageBookingValue}
            type="currency"
            theme="warning"
          >
            <p className="text-3xl font-bold text-yellow-600 cursor-help">
              {formatCurrencyWithSuffix(performanceMetrics.averageBookingValue)}
            </p>
          </MetricTooltip>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Today's Participants</h3>
          <MetricTooltip 
            value={performanceMetrics.todayParticipantsCount}
            type="number"
            icon={<FaUsers className="w-4 h-4" />}
            theme="info"
          >
            <p className="text-3xl font-bold text-indigo-600 cursor-help">
              {formatNumberWithSuffix(performanceMetrics.todayParticipantsCount)}
            </p>
          </MetricTooltip>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filter}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Trek Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trek</label>
            <select
              value={selectedTrek}
              onChange={handleTrekChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">All Treks</option>
              {treks.map(trek => (
                <option key={trek._id} value={trek._id}>{trek.name}</option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
            <select
              value={selectedBatch}
              onChange={handleBatchChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">All Batches</option>
              {selectedTrek && treks.find(t => t._id === selectedTrek)?.batches.map(batch => (
                <option key={batch._id} value={batch._id}>
                  {new Date(batch.startDate).toLocaleDateString()} - {new Date(batch.endDate).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              placeholderText="Select date range"
              isClearable={true}
            />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 items-center w-full">
          <input
            type="text"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            placeholder="Search by Booking ID, User, Trek, or Status"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-5 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}

      {/* Enhanced Bookings Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Bookings</h2>
        </div>
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
              {bookings.length > 0 ? (
                bookings.map((booking) => (
                  <tr key={booking._id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{booking.user?.name || 'Unknown User'}</div>
                      <div className="text-sm text-gray-500">{booking.user?.email || 'No email'}</div>
                      <div className="text-sm text-gray-500">{booking.user?.phone || 'No phone'}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        ID: {booking.id ? booking.id.substring(0, 8) + '...' : booking._id.substring(0, 8) + '...'} | Booked: {formatDate(booking.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {booking.numberOfParticipants || booking.participants || 0} participants
                      {booking.participantDetails && booking.participantDetails.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {booking.participantDetails.length} details available
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="font-medium text-gray-900">{formatCurrency(booking.totalPrice || 0)}</div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        booking.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {booking.cancellationRequest ? (
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <span className="font-medium capitalize text-xs">{booking.cancellationRequest.type}</span>
                            <span className={`ml-1 px-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                              booking.cancellationRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              booking.cancellationRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                              booking.cancellationRequest.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.cancellationRequest.status}
                            </span>
                          </div>
                          {booking.cancellationRequest.reason && (
                            <div className="text-xs text-gray-400 truncate max-w-32" title={booking.cancellationRequest.reason}>
                              {booking.cancellationRequest.reason}
                            </div>
                          )}
                          {booking.cancellationRequest.type === 'reschedule' && booking.cancellationRequest.preferredBatch && (
                            <div className="text-xs text-blue-600">
                              {(() => {
                                // Find the preferred batch from trek batches
                                if (booking.trek && booking.trek.batches) {
                                  const preferredBatch = booking.trek.batches.find(
                                    batch => batch._id.toString() === booking.cancellationRequest.preferredBatch.toString()
                                  );
                                  if (preferredBatch) {
                                    const startDate = new Date(preferredBatch.startDate).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    });
                                    return `To: ${startDate}`;
                                  }
                                }
                                return 'Batch not found';
                              })()}
                            </div>
                          )}
                          {booking.cancellationRequest.requestedAt && (
                            <div className="text-xs text-gray-400">
                              {formatDate(booking.cancellationRequest.requestedAt)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-400 italic text-xs">No request</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
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
                        hideShiftAction={true}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * 10, totalBookings)}</span> of{' '}
              <span className="font-medium">{totalBookings}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Previous</span>
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    currentPage === page
                      ? 'z-10 bg-emerald-50 border-emerald-500 text-emerald-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Next</span>
                &gt;
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ExportBookingsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
      />

      <RemarksModal
        isOpen={showRemarksModal}
        onClose={() => setShowRemarksModal(false)}
        booking={selectedBooking}
        onUpdate={handleRemarksUpdate}
      />

      <EditBookingModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        booking={selectedBooking}
        trekData={selectedBooking ? treks.find(t => t._id === selectedBooking.trek) : null}
        onUpdate={handleBookingUpdate}
      />



      <ViewBookingModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        booking={selectedBooking}
        trekData={selectedBooking ? treks.find(t => t._id === selectedBooking.trek) : null}
      />

      <CancellationModal
        isOpen={showCancellationModal}
        onClose={() => setShowCancellationModal(false)}
        booking={selectedBooking}
        bookingId={selectedBooking?._id}
        onConfirmCancellation={handleCancellationConfirm}
      />

      <RequestResponseModal
        isOpen={showRequestResponseModal}
        onClose={() => setShowRequestResponseModal(false)}
        booking={selectedBooking}
        onSuccess={fetchBookings}
      />
    </div>
  );
}

export default AdminBookings; 