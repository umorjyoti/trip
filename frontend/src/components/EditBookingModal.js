import React, { useState, useEffect } from 'react';
import { updateBooking } from '../services/api';
import { toast } from 'react-toastify';
import Modal from './Modal';

const EditBookingModal = ({ isOpen, onClose, booking, onUpdate }) => {
  const [formData, setFormData] = useState({
    numberOfParticipants: 1,
    totalPrice: 0,
    userDetails: {
      name: '',
      email: '',
      phone: ''
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (booking) {
      setFormData({
        numberOfParticipants: booking.participants || 1,
        totalPrice: booking.totalPrice || 0,
        userDetails: {
          name: booking.user?.name || '',
          email: booking.user?.email || '',
          phone: booking.user?.phone || ''
        }
      });
    }
  }, [booking]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('user.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        userDetails: {
          ...prev.userDetails,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!booking) return;

    setLoading(true);
    try {
      await updateBooking(booking.bookingId, formData);
      toast.success('Booking updated successfully');
      onUpdate(formData);
      onClose();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error(error.response?.data?.message || 'Failed to update booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Edit Booking Data"
      isOpen={isOpen}
      onClose={onClose}
      size="large"
    >
      <div className="space-y-6">
        <div>
          <p className="text-gray-600 mb-4">
            Update booking information. Changes will be reflected immediately.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="numberOfParticipants" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Participants
                </label>
                <input
                  type="number"
                  id="numberOfParticipants"
                  name="numberOfParticipants"
                  value={formData.numberOfParticipants}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              
              <div>
                <label htmlFor="totalPrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Total Price (₹)
                </label>
                <input
                  type="number"
                  id="totalPrice"
                  name="totalPrice"
                  value={formData.totalPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="user.name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="user.name"
                    name="user.name"
                    value={formData.userDetails.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="user.email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="user.email"
                    name="user.email"
                    value={formData.userDetails.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="user.phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="user.phone"
                    name="user.phone"
                    value={formData.userDetails.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Update Booking'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default EditBookingModal; 