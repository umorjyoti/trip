import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllBookings, updateBookingStatus, getAllTreks, exportBookings, adminCancelBooking } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import ExportBookingsModal from '../components/ExportBookingsModal';
import BookingsTable from './BookingsTable';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'pending_payment', label: 'Pending Payment' },
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
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings. Please try again later.');
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
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
    setCancelLoading(true);
    try {
      await adminCancelBooking({
        bookingId: cancelModal.booking._id,
        refund: true,
        refundType: cancelModal.refundType,
        reason: 'Admin cancelled booking',
      });
      toast.success('Booking cancelled and refund processed (if applicable)');
      closeCancelModal();
      fetchBookings();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel booking');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchValue);
    setCurrentPage(1);
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

      <BookingsTable
        bookings={bookings}
        loading={loading}
        error={error}
        openCancelModal={openCancelModal}
        cancelModal={cancelModal}
        closeCancelModal={closeCancelModal}
        handleCancelBooking={handleCancelBooking}
        cancelLoading={cancelLoading}
        calculateRefund={calculateRefund}
      />

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

      <ExportBookingsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
      />
    </div>
  );
}

export default AdminBookings; 