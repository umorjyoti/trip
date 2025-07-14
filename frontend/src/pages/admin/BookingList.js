import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllBookings, getAllTreks } from '../../services/api';
import { formatDate } from '../../utils/formatters';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'payment_completed', label: 'Payment Completed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'trek_completed', label: 'Trek Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const BookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [treks, setTreks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    trekId: '',
    batchId: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0,
    limit: 10
  });
  const [statusCounts, setStatusCounts] = useState({});

  useEffect(() => {
    fetchTreks();
    fetchBookings();
  }, [filters.status, filters.search, filters.trekId, filters.batchId, filters.startDate, filters.endDate, pagination.page]);

  const fetchTreks = async () => {
    try {
      const treksData = await getAllTreks();
      setTreks(treksData);
    } catch (err) {
      console.error('Error fetching treks:', err);
    }
  };

  const fetchBookings = async () => {
    console.log('Fetching bookings with filters:', filters);
    try {
      setLoading(true);
      // Only include non-empty filters
      const activeFilters = {};
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
          activeFilters[key] = filters[key];
        }
      });
      
      const data = await getAllBookings(pagination.page, activeFilters);
      setBookings(data.bookings || data);
      if (data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }));
      }
      
      // Fetch status counts if no filters are applied
      if (Object.keys(activeFilters).length === 0) {
        fetchStatusCounts();
      }
    } catch (err) {
      setError('Failed to fetch bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusCounts = async () => {
    try {
      const statuses = ['pending', 'pending_payment', 'payment_completed', 'confirmed', 'trek_completed', 'cancelled'];
      const counts = {};
      
      for (const status of statuses) {
        const data = await getAllBookings(1, { status });
        counts[status] = data.pagination?.total || 0;
      }
      
      setStatusCounts(counts);
    } catch (err) {
      console.error('Error fetching status counts:', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      search: '',
      trekId: '',
      batchId: '',
      startDate: '',
      endDate: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bookings</h1>
        <div className="flex space-x-4">
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search bookings..."
            className="px-4 py-2 border rounded-md"
          />
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="px-4 py-2 border rounded-md"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            name="trekId"
            value={filters.trekId}
            onChange={handleFilterChange}
            className="px-4 py-2 border rounded-md"
          >
            <option value="">All Treks</option>
            {treks.map(trek => (
              <option key={trek._id} value={trek._id}>
                {trek.name}
              </option>
            ))}
          </select>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Date Range Filters */}
      <div className="mb-6 flex space-x-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="px-4 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="px-4 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* Status Workflow Info */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Booking Status Workflow</h3>
            <div className="mt-1 text-sm text-blue-700">
              <p><strong>Pending</strong> → <strong>Pending Payment</strong> → <strong>Payment Completed</strong> → <strong>Confirmed</strong> → <strong>Trek Completed</strong></p>
              <p className="mt-1 text-xs">Bookings can be <strong>Cancelled</strong> at any stage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Status Filters */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2">Quick Filters:</span>
          <button
            onClick={() => setFilters(prev => ({ ...prev, status: 'pending' }))}
            className={`px-3 py-1 text-xs rounded-full ${
              filters.status === 'pending' 
                ? 'bg-gray-500 text-white' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, status: 'pending_payment' }))}
            className={`px-3 py-1 text-xs rounded-full ${
              filters.status === 'pending_payment' 
                ? 'bg-yellow-500 text-white' 
                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            }`}
          >
            Pending Payment
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, status: 'payment_completed' }))}
            className={`px-3 py-1 text-xs rounded-full ${
              filters.status === 'payment_completed' 
                ? 'bg-blue-500 text-white' 
                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
            }`}
          >
            Payment Completed
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, status: 'confirmed' }))}
            className={`px-3 py-1 text-xs rounded-full ${
              filters.status === 'confirmed' 
                ? 'bg-green-500 text-white' 
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, status: 'trek_completed' }))}
            className={`px-3 py-1 text-xs rounded-full ${
              filters.status === 'trek_completed' 
                ? 'bg-purple-500 text-white' 
                : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
            }`}
          >
            Trek Completed
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, status: 'cancelled' }))}
            className={`px-3 py-1 text-xs rounded-full ${
              filters.status === 'cancelled' 
                ? 'bg-red-500 text-white' 
                : 'bg-red-100 text-red-800 hover:bg-red-200'
            }`}
          >
            Cancelled
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
            className={`px-3 py-1 text-xs rounded-full ${
              filters.status === 'all' 
                ? 'bg-gray-500 text-white' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Status Counts */}
      {Object.keys(statusCounts).length > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {['pending', 'pending_payment', 'payment_completed', 'confirmed', 'trek_completed', 'cancelled'].map(status => (
              <div key={status} className="text-center p-2 bg-gray-50 rounded-md">
                <div className={`text-xs font-medium ${
                  status === 'pending' ? 'text-gray-600' :
                  status === 'pending_payment' ? 'text-yellow-600' :
                  status === 'payment_completed' ? 'text-blue-600' :
                  status === 'confirmed' ? 'text-green-600' :
                  status === 'trek_completed' ? 'text-purple-600' :
                  status === 'cancelled' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div className="text-lg font-bold text-gray-900">{statusCounts[status] || 0}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}

      {/* Filter Summary */}
      <div className="mb-4 p-4 bg-gray-50 rounded-md">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600">
              {loading ? 'Loading...' : `Showing ${bookings.length} of ${pagination.total} bookings`}
            </span>
            {(filters.status !== 'all' || filters.search || filters.trekId || filters.startDate || filters.endDate) && (
              <div className="mt-1">
                <span className="text-xs text-gray-500">Filters: </span>
                {filters.status !== 'all' && (
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">
                    Status: {filters.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                )}
                {filters.search && (
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-1">
                    Search: {filters.search}
                  </span>
                )}
                {filters.trekId && (
                  <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded mr-1">
                    Trek: {treks.find(t => t._id === filters.trekId)?.name || filters.trekId}
                  </span>
                )}
                {(filters.startDate || filters.endDate) && (
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mr-1">
                    Date: {filters.startDate || 'Any'} to {filters.endDate || 'Any'}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="text-sm text-gray-600">
            {!loading && `Page ${pagination.page} of ${pagination.pages}`}
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {bookings.length === 0 && !loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-lg">No bookings found</p>
            <p className="text-gray-400 text-sm mt-2">
              Try adjusting your filters or search criteria
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {bookings.map(booking => (
              <li key={booking._id}>
                <Link to={`/admin/bookings/${booking._id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-emerald-600 truncate">
                          Booking #{booking.bookingId}
                        </p>
                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                          booking.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'payment_completed' ? 'bg-blue-100 text-blue-800' :
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'trek_completed' ? 'bg-purple-100 text-purple-800' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="text-sm text-gray-500">
                          {formatDate(booking.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {booking.user?.name || 'N/A'}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          {booking.trek?.name || 'N/A'}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          ₹{booking.totalAmount || booking.totalPrice || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 border rounded-md ${
                    pagination.page === pageNum
                      ? 'bg-emerald-500 text-white'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default BookingList; 