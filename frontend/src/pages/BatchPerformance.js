import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getBatchPerformance } from '../services/api';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';

const BatchPerformance = () => {
  const { trekId, batchId } = useParams();
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        const data = await getBatchPerformance(trekId, batchId);
        setPerformanceData(data);
        setError('');
      } catch (err) {
        console.error('Error fetching batch performance:', err);
        setError('Failed to load batch performance data');
        toast.error('Failed to load batch performance data');
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [trekId, batchId]);

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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Batch Performance</h1>
      
      {/* Batch Details */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Batch Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Start Date</p>
            <p className="font-medium">{formatDate(performanceData.batch.startDate)}</p>
          </div>
          <div>
            <p className="text-gray-600">End Date</p>
            <p className="font-medium">{formatDate(performanceData.batch.endDate)}</p>
          </div>
          <div>
            <p className="text-gray-600">Price</p>
            <p className="font-medium">{formatCurrency(performanceData.batch.price)}</p>
          </div>
          <div>
            <p className="text-gray-600">Max Participants</p>
            <p className="font-medium">{performanceData.batch.maxParticipants}</p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 p-4 rounded-lg">
            <p className="text-gray-600">Total Bookings</p>
            <p className="text-2xl font-bold text-emerald-600">{performanceData.totalBookings}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(performanceData.totalRevenue)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-gray-600">Occupancy Rate</p>
            <p className="text-2xl font-bold text-purple-600">{performanceData.occupancyRate}%</p>
          </div>
        </div>
      </div>

      {/* Booking Details */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performanceData.bookings.map((booking) => (
                <tr key={booking._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{booking.user.name}</div>
                    <div className="text-sm text-gray-500">{booking.user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(booking.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.participants}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(booking.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback */}
      {performanceData.feedback && performanceData.feedback.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">User Feedback</h2>
          <div className="space-y-4">
            {performanceData.feedback.map((item) => (
              <div key={item._id} className="border-l-4 border-emerald-500 pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{item.user.name}</p>
                    <p className="text-sm text-gray-500">{formatDate(item.createdAt)}</p>
                  </div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i < item.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-gray-600">{item.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchPerformance; 