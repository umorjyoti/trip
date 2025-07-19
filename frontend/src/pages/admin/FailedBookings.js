import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFailedBookings, restoreFailedBooking, deleteFailedBooking, exportFailedBookings } from '../../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FaEye, FaUndo, FaTrash, FaDownload, FaFilter, FaTimes } from 'react-icons/fa';

const FailedBookings = () => {
  const [failedBookings, setFailedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0,
    limit: 10
  });
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    failureReason: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    fetchFailedBookings();
  }, [pagination.page, filters]);

  const fetchFailedBookings = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      const data = await getFailedBookings(params);
      setFailedBookings(data.failedBookings);
      setPagination(data.pagination);
      setStats(data.stats);
      setError(null);
    } catch (err) {
      console.error('Error fetching failed bookings:', err);
      setError('Failed to load failed bookings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm('Are you sure you want to restore this failed booking? This will create a new pending payment booking.')) {
      return;
    }

    try {
      setProcessing(prev => ({ ...prev, [id]: true }));
      await restoreFailedBooking(id);
      toast.success('Failed booking restored successfully!');
      fetchFailedBookings(); // Refresh the list
    } catch (error) {
      console.error('Error restoring failed booking:', error);
      toast.error(error.message || 'Failed to restore booking');
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this failed booking? This action cannot be undone.')) {
      return;
    }

    try {
      setProcessing(prev => ({ ...prev, [id]: true }));
      await deleteFailedBooking(id);
      toast.success('Failed booking deleted permanently!');
      fetchFailedBookings(); // Refresh the list
    } catch (error) {
      console.error('Error deleting failed booking:', error);
      toast.error(error.message || 'Failed to delete booking');
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportFailedBookings(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `failed-bookings-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Failed bookings exported successfully!');
    } catch (error) {
      console.error('Error exporting failed bookings:', error);
      toast.error(error.message || 'Failed to export failed bookings');
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      failureReason: '',
      startDate: '',
      endDate: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFailureReasonBadge = (reason) => {
    const badges = {
      session_expired: 'bg-yellow-100 text-yellow-800',
      payment_failed: 'bg-red-100 text-red-800',
      user_cancelled: 'bg-gray-100 text-gray-800',
      system_error: 'bg-purple-100 text-purple-800'
    };
    return badges[reason] || 'bg-gray-100 text-gray-800';
  };

  const getFailureReasonLabel = (reason) => {
    const labels = {
      session_expired: 'Session Expired',
      payment_failed: 'Payment Failed',
      user_cancelled: 'User Cancelled',
      system_error: 'System Error'
    };
    return labels[reason] || reason;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Failed Bookings</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FaFilter className="mr-2" />
            Filters
          </button>
          <button
            onClick={handleExport}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FaDownload className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Failed</h3>
          <p className="text-2xl font-semibold text-gray-900">{stats.totalFailed || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
          <p className="text-2xl font-semibold text-gray-900">₹{stats.totalValue || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Session Expired</h3>
          <p className="text-2xl font-semibold text-yellow-600">{stats.sessionExpired || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Payment Failed</h3>
          <p className="text-2xl font-semibold text-red-600">{stats.paymentFailed || 0}</p>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            <button
              onClick={clearFilters}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="mr-1" />
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Failure Reason
              </label>
              <select
                value={filters.failureReason}
                onChange={(e) => handleFilterChange('failureReason', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Reasons</option>
                <option value="session_expired">Session Expired</option>
                <option value="payment_failed">Payment Failed</option>
                <option value="user_cancelled">User Cancelled</option>
                <option value="system_error">System Error</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
          <button 
            className="mt-2 bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded"
            onClick={fetchFailedBookings}
          >
            Retry
          </button>
        </div>
      )}

      {/* Failed Bookings Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Failed Bookings ({pagination.total} total)
          </h3>
        </div>
        
        {failedBookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No failed bookings found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Failed Booking ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trek
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Failure Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Archived At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {failedBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {booking.bookingId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.user?.name || booking.userDetails?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.user?.email || booking.userDetails?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.trek?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.numberOfParticipants}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{booking.totalPrice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getFailureReasonBadge(booking.failureReason)}`}>
                        {getFailureReasonLabel(booking.failureReason)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(booking.archivedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/admin/failed-bookings/${booking._id}`}
                          className="text-emerald-600 hover:text-emerald-900"
                          title="View Details"
                        >
                          <FaEye />
                        </Link>
                        <button
                          onClick={() => handleRestore(booking._id)}
                          disabled={processing[booking._id]}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          title="Restore Booking"
                        >
                          <FaUndo />
                        </button>
                        <button
                          onClick={() => handleDelete(booking._id)}
                          disabled={processing[booking._id]}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Delete Permanently"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FailedBookings; 