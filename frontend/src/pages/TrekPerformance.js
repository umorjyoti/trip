import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getTrekPerformance, getBatchPerformance } from '../services/api';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';

const TrekPerformance = () => {
  const { trekId } = useParams();
  const [searchParams] = useSearchParams();
  const [performanceData, setPerformanceData] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchDetails, setBatchDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    await fetchBatchDetails(batch._id);
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
          <p className="text-3xl font-bold text-emerald-600">
            {formatCurrency(performanceData.totalRevenue)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Bookings</h3>
          <p className="text-3xl font-bold text-blue-600">
            {performanceData.totalBookings}
          </p>
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
              {performanceData.batches.map((batch) => (
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
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Batch Details: {formatDate(selectedBatch.startDate)} - {formatDate(selectedBatch.endDate)}
            </h2>
            <button
              onClick={() => {
                setSelectedBatch(null);
                setBatchDetails(null);
              }}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {batchDetails.bookingDetails.map((booking) => (
                    <tr key={booking.bookingId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {booking.user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.user.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.participants}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(booking.totalPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(booking.bookingDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrekPerformance; 