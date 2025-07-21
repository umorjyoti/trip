import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getBatchPerformance } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from './LoadingSpinner';
import { formatCurrency, formatCurrencyWithSuffix, formatNumberWithSuffix, formatDate } from '../utils/formatters';
import CustomTooltip from './CustomTooltip';

function BatchPerformance() {
  const { trekId, batchId } = useParams();
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPerformanceData();
  }, [trekId, batchId]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const data = await getBatchPerformance(trekId, batchId);
      setPerformanceData(data);
    } catch (err) {
      console.error('Error fetching batch performance:', err);
      setError('Failed to load batch performance data');
      toast.error('Failed to load batch performance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!performanceData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Batch Details Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Batch Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Start Date</p>
            <p className="font-medium">{formatDate(performanceData.batchDetails.startDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">End Date</p>
            <p className="font-medium">{formatDate(performanceData.batchDetails.endDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Price per Person</p>
            <p className="font-medium">{formatCurrency(performanceData.batchDetails.price)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium capitalize">{performanceData.batchDetails.status}</p>
          </div>
        </div>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bookings Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bookings</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <CustomTooltip 
                content={performanceData.bookings.total?.toLocaleString('en-IN') || '0'}
                position="top"
              >
                <span className="font-medium cursor-help">
                  {formatNumberWithSuffix(performanceData.bookings.total)}
                </span>
              </CustomTooltip>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Confirmed</span>
              <CustomTooltip 
                content={performanceData.bookings.confirmed?.toLocaleString('en-IN') || '0'}
                position="top"
              >
                <span className="font-medium text-green-600 cursor-help">
                  {formatNumberWithSuffix(performanceData.bookings.confirmed)}
                </span>
              </CustomTooltip>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Cancelled</span>
              <CustomTooltip 
                content={performanceData.bookings.cancelled?.toLocaleString('en-IN') || '0'}
                position="top"
              >
                <span className="font-medium text-red-600 cursor-help">
                  {formatNumberWithSuffix(performanceData.bookings.cancelled)}
                </span>
              </CustomTooltip>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Completed</span>
              <CustomTooltip 
                content={performanceData.bookings.completed?.toLocaleString('en-IN') || '0'}
                position="top"
              >
                <span className="font-medium text-blue-600 cursor-help">
                  {formatNumberWithSuffix(performanceData.bookings.completed)}
                </span>
              </CustomTooltip>
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <CustomTooltip 
                content={`₹${performanceData.revenue.total?.toLocaleString('en-IN') || '0'}`}
                position="top"
              >
                <span className="font-medium cursor-help">
                  {formatCurrencyWithSuffix(performanceData.revenue.total)}
                </span>
              </CustomTooltip>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Confirmed</span>
              <CustomTooltip 
                content={`₹${performanceData.revenue.confirmed?.toLocaleString('en-IN') || '0'}`}
                position="top"
              >
                <span className="font-medium text-green-600 cursor-help">
                  {formatCurrencyWithSuffix(performanceData.revenue.confirmed)}
                </span>
              </CustomTooltip>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Cancelled</span>
              <CustomTooltip 
                content={`₹${performanceData.revenue.cancelled?.toLocaleString('en-IN') || '0'}`}
                position="top"
              >
                <span className="font-medium text-red-600 cursor-help">
                  {formatCurrencyWithSuffix(performanceData.revenue.cancelled)}
                </span>
              </CustomTooltip>
            </div>
          </div>
        </div>

        {/* Participants Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Participants</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <CustomTooltip 
                content={performanceData.participants.total?.toLocaleString('en-IN') || '0'}
                position="top"
              >
                <span className="font-medium cursor-help">
                  {formatNumberWithSuffix(performanceData.participants.total)}
                </span>
              </CustomTooltip>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Confirmed</span>
              <CustomTooltip 
                content={performanceData.participants.confirmed?.toLocaleString('en-IN') || '0'}
                position="top"
              >
                <span className="font-medium text-green-600 cursor-help">
                  {formatNumberWithSuffix(performanceData.participants.confirmed)}
                </span>
              </CustomTooltip>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Cancelled</span>
              <CustomTooltip 
                content={performanceData.participants.cancelled?.toLocaleString('en-IN') || '0'}
                position="top"
              >
                <span className="font-medium text-red-600 cursor-help">
                  {formatNumberWithSuffix(performanceData.participants.cancelled)}
                </span>
              </CustomTooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Details Table */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performanceData.bookingDetails.map((booking) => (
                <tr key={booking.bookingId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{booking.user.name}</div>
                    <div className="text-sm text-gray-500">{booking.user.email}</div>
                    <div className="text-sm text-gray-500">{booking.user.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.participants}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(booking.totalPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status}
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

      {/* Feedback Section */}
      {performanceData.feedback && performanceData.feedback.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Feedback</h3>
          <div className="space-y-4">
            {performanceData.feedback.map((item, index) => (
              <div key={index} className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`h-5 w-5 ${
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
                  <span className="text-sm text-gray-500">{formatDate(item.date)}</span>
                </div>
                <p className="text-gray-700">{item.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BatchPerformance; 