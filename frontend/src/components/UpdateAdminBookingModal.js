import React, { useState, useEffect } from 'react';
import { FaTimes, FaEdit, FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { updateAdminCreatedBookingStatus } from '../services/api';

const UpdateAdminBookingModal = ({ isOpen, onClose, booking, onUpdate }) => {
  const [formData, setFormData] = useState({
    status: '',
    paymentStatus: '',
    adminRemarks: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (booking) {
      setFormData({
        status: booking.status || '',
        paymentStatus: getPaymentStatusFromBooking(booking),
        adminRemarks: booking.adminRemarks || ''
      });
      setErrors({});
    }
  }, [booking]);

  const getPaymentStatusFromBooking = (booking) => {
    if (booking.paymentMode === 'partial') {
      return 'payment_confirmed_partial';
    } else if (booking.status === 'confirmed' || booking.status === 'payment_completed') {
      return 'payment_completed';
    } else {
      return 'unpaid';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }
    
    if (!formData.paymentStatus) {
      newErrors.paymentStatus = 'Payment status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updateData = {};
      
      if (formData.status !== booking.status) {
        updateData.status = formData.status;
      }
      
      if (formData.paymentStatus !== getPaymentStatusFromBooking(booking)) {
        updateData.paymentStatus = formData.paymentStatus;
      }
      
      if (formData.adminRemarks !== booking.adminRemarks) {
        updateData.adminRemarks = formData.adminRemarks;
      }

      if (Object.keys(updateData).length === 0) {
        toast.info('No changes to update');
        return;
      }

      const response = await updateAdminCreatedBookingStatus(booking._id, updateData);
      
      toast.success('Booking updated successfully');
      onUpdate(response.booking);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to update booking');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Update Admin-Created Booking
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Booking Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Booking Information</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div><span className="font-medium">ID:</span> {booking._id?.substring(0, 8)}...</div>
              <div><span className="font-medium">User:</span> {booking.user?.name}</div>
              <div><span className="font-medium">Trek:</span> {booking.trek?.name}</div>
              <div><span className="font-medium">Current Status:</span> 
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {booking.status}
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.status ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Status</option>
                <option value="pending">Pending</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="payment_completed">Payment Completed</option>
                <option value="payment_confirmed_partial">Partial Payment Confirmed</option>
                <option value="confirmed">Confirmed</option>
                <option value="trek_completed">Trek Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status}</p>
              )}
            </div>

            {/* Payment Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status *
              </label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.paymentStatus ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Payment Status</option>
                <option value="payment_completed">Payment Completed</option>
                <option value="payment_confirmed_partial">Partial Payment</option>
                <option value="unpaid">Unpaid</option>
              </select>
              {errors.paymentStatus && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentStatus}</p>
              )}
            </div>

            {/* Admin Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Remarks
              </label>
              <textarea
                value={formData.adminRemarks}
                onChange={(e) => handleInputChange('adminRemarks', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any additional remarks..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FaSave className="w-4 h-4 mr-2" />
                    Update
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateAdminBookingModal; 