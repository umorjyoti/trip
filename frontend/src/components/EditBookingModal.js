import React, { useState, useEffect } from 'react';
import { updateBooking } from '../services/api';
import { toast } from 'react-toastify';
import Modal from './Modal';
import { FaUser, FaPhone, FaEnvelope, FaEdit } from 'react-icons/fa';

const EditBookingModal = ({ isOpen, onClose, booking, trekData, onUpdate }) => {
  const [formData, setFormData] = useState({
    participantDetails: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (booking) {
      setFormData({
        participantDetails: booking.participantDetails || []
      });
    }
  }, [booking]);

  const handleParticipantChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      participantDetails: prev.participantDetails.map((participant, i) => 
        i === index ? { ...participant, [field]: value } : participant
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!booking) return;

    // Validate that we have details for all participants
    const participantCount = booking.participants || booking.numberOfParticipants || 0;
    if (formData.participantDetails.length !== participantCount) {
      toast.error(`Please provide details for all ${participantCount} participants`);
      return;
    }

    // Validate that all participant details are filled
    const hasEmptyFields = formData.participantDetails.some(
      participant => !participant.name || !participant.phone || !participant.email
    );
    if (hasEmptyFields) {
      toast.error('Please fill in all participant details (name, phone, and email)');
      return;
    }

    setLoading(true);
    try {
      await updateBooking(booking.bookingId || booking._id, formData);
      toast.success('Participant details updated successfully');
      onUpdate(formData);
      onClose();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error(error.response?.data?.message || 'Failed to update participant details');
    } finally {
      setLoading(false);
    }
  };

  // Get custom fields from trek data
  const customFields = trekData?.customFields || [];

  return (
    <Modal
      title="Edit Participant Details"
      isOpen={isOpen}
      onClose={onClose}
      size="large"
    >
      <div className="space-y-6">
        <div>
          <p className="text-gray-600 mb-4">
            Update participant information for this booking. Please provide details for all {booking?.participants || booking?.numberOfParticipants || 0} participants.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Participant Details */}
            <div>
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                  <FaUser className="mr-2 text-emerald-600" />
                  Participant Details ({formData.participantDetails.length} of {booking?.participants || booking?.numberOfParticipants || 0})
                </h4>
              </div>

              <div className="space-y-4">
                {formData.participantDetails.map((participant, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="mb-3">
                      <h5 className="text-sm font-medium text-gray-900">Participant {index + 1}</h5>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaUser className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={participant.name}
                            onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Full name"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaPhone className="text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            value={participant.phone}
                            onChange={(e) => handleParticipantChange(index, 'phone', e.target.value)}
                            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Phone number"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaEnvelope className="text-gray-400" />
                          </div>
                          <input
                            type="email"
                            value={participant.email}
                            onChange={(e) => handleParticipantChange(index, 'email', e.target.value)}
                            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Email address"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Custom Fields */}
                    {customFields.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h6 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <FaEdit className="mr-2 text-purple-600" />
                          Additional Information
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {customFields.map((field, fieldIndex) => (
                            <div key={fieldIndex}>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {field.label} {field.required ? '*' : ''}
                              </label>
                              {field.type === 'textarea' ? (
                                <textarea
                                  value={participant[field.name] || ''}
                                  onChange={(e) => handleParticipantChange(index, field.name, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                  placeholder={field.placeholder || field.label}
                                  rows="3"
                                  required={field.required}
                                />
                              ) : field.type === 'select' ? (
                                <select
                                  value={participant[field.name] || ''}
                                  onChange={(e) => handleParticipantChange(index, field.name, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                  required={field.required}
                                >
                                  <option value="">Select {field.label}</option>
                                  {field.options?.map((option, optionIndex) => (
                                    <option key={optionIndex} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={field.type || 'text'}
                                  value={participant[field.name] || ''}
                                  onChange={(e) => handleParticipantChange(index, field.name, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                  placeholder={field.placeholder || field.label}
                                  required={field.required}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {formData.participantDetails.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FaUser className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>No participant details available for this booking.</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
                  'Update Participants'
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