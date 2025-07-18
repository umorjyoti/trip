import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createCustomTrekBooking } from '../services/api';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaUsers, FaMoneyBillWave, FaInfoCircle, FaUserPlus, FaUserFriends, FaPhoneAlt } from 'react-icons/fa';

function CustomTrekBookingForm({ trek, onClose, onSuccess }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState(1);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    specialRequirements: ''
  });
  const [errors, setErrors] = useState({});
  const [totalPrice, setTotalPrice] = useState(trek?.displayPrice || 0);

  // Debug the trek data
  useEffect(() => {
    console.log('CustomTrekBookingForm mounted with trek:', trek);
    
    // Check if trek exists and has required properties
    if (!trek) {
      console.error('No trek selected');
      toast.error('No trek selected. Please try again.');
      onClose();
      return;
    }
    
    if (!trek._id) {
      console.error('Invalid trek data (missing _id):', trek);
      toast.error('Invalid trek data. Please try again.');
      onClose();
      return;
    }
    
    // Set initial total price
    setTotalPrice(trek.displayPrice * participants);
  }, [trek, participants, onClose]);

  // Update total price when participants change
  useEffect(() => {
    if (trek && trek.displayPrice) {
      setTotalPrice(trek.displayPrice * participants);
    }
  }, [participants, trek]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleParticipantsChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= 50) { // Reasonable limit for custom treks
      setParticipants(value);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate main contact
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
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
      const bookingData = {
        trekId: trek._id,
        numberOfParticipants: participants,
        userDetails: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        },
        totalPrice: totalPrice
      };

      console.log('Submitting custom trek booking:', bookingData);
      
      const response = await createCustomTrekBooking(bookingData);
      
      console.log('Custom trek booking response:', response);
      
      toast.success('Custom trek booking confirmed successfully!');
      
      if (onSuccess) {
        await onSuccess(response);
      }
      
      onClose();
    } catch (error) {
      console.error('Error creating custom trek booking:', error);
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        // Duplicate custom trek booking error
        const errorMessage = error.response?.data?.message || "You already have a confirmed booking for this custom trek.";
        toast.error(errorMessage);
        
        // If there's an existing booking ID, redirect to it
        if (error.response?.data?.existingBooking) {
          window.location.href = `/booking-detail/${error.response.data.existingBooking}`;
        }
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to create booking. Please try again.';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Book Custom Trek</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Trek Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{trek?.name}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <FaCalendarAlt className="mr-2" />
                <span>{trek?.duration} Day{trek?.duration > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center">
                <FaMoneyBillWave className="mr-2" />
                <span>{formatCurrency(trek?.displayPrice)} per person</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Number of Participants */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaUsers className="inline mr-2" />
                Number of Participants
              </label>
              <select
                value={participants}
                onChange={handleParticipantsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {[...Array(50)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} {i === 0 ? 'Person' : 'People'}
                  </option>
                ))}
              </select>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  disabled={loading}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  disabled={loading}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  disabled={loading}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>

            {/* Special Requirements (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Requirements (optional)
              </label>
              <textarea
                name="specialRequirements"
                value={formData.specialRequirements}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={2}
                disabled={loading}
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-semibold"
                disabled={loading}
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CustomTrekBookingForm; 