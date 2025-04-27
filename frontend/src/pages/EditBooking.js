import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookingById, updateBooking, getTrekById } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

function EditBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [trek, setTrek] = useState(null);
  const [formData, setFormData] = useState({
    batch: '',
    participants: 0,
    participantDetails: [],
    contactInfo: {
      name: '',
      email: '',
      phone: '',
      address: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    specialRequirements: '',
    totalPrice: 0
  });

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      const bookingData = await getBookingById(id);
      setBooking(bookingData);
      
      // Fetch trek details to get available batches
      const trekData = await getTrekById(bookingData.trek._id);
      setTrek(trekData);
      
      // Initialize form data
      setFormData({
        batch: bookingData.batch,
        participants: bookingData.participants,
        participantDetails: bookingData.participantDetails,
        contactInfo: bookingData.contactInfo || {
          name: '',
          email: '',
          phone: '',
          address: ''
        },
        emergencyContact: bookingData.emergencyContact || {
          name: '',
          relationship: '',
          phone: ''
        },
        specialRequirements: bookingData.specialRequirements || '',
        totalPrice: bookingData.totalPrice
      });
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast.error('Failed to load booking details');
      navigate('/admin/bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [name]: value
      }
    }));
  };

  const handleEmergencyContactChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [name]: value
      }
    }));
  };

  const handleParticipantChange = (index, field, value) => {
    setFormData(prev => {
      const newParticipantDetails = [...prev.participantDetails];
      newParticipantDetails[index] = {
        ...newParticipantDetails[index],
        [field]: value
      };
      return {
        ...prev,
        participantDetails: newParticipantDetails
      };
    });
  };

  const handleCustomFieldChange = (participantIndex, fieldIndex, value) => {
    setFormData(prev => {
      const newParticipantDetails = [...prev.participantDetails];
      newParticipantDetails[participantIndex] = {
        ...newParticipantDetails[participantIndex],
        customFieldResponses: newParticipantDetails[participantIndex].customFieldResponses.map((response, i) => 
          i === fieldIndex ? { ...response, value } : response
        )
      };
      return {
        ...prev,
        participantDetails: newParticipantDetails
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateBooking(id, formData);
      toast.success('Booking updated successfully');
      navigate('/admin/bookings');
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error(error.response?.data?.message || 'Failed to update booking');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!booking || !trek) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Booking</h1>
        <p className="mt-2 text-sm text-gray-500">
          Update booking details for {trek.name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Batch Selection */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Batch Selection</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Select a different batch for this booking</p>
            </div>
            <div className="mt-5">
              <select
                name="batch"
                value={formData.batch}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
              >
                {trek.batches.map(batch => (
                  <option key={batch._id} value={batch._id}>
                    {new Date(batch.startDate).toLocaleDateString()} - {new Date(batch.endDate).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Contact Information</h3>
            <div className="mt-5 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.contactInfo.name}
                  onChange={handleContactInfoChange}
                  className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.contactInfo.email}
                  onChange={handleContactInfoChange}
                  className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={formData.contactInfo.phone}
                  onChange={handleContactInfoChange}
                  className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  id="address"
                  value={formData.contactInfo.address}
                  onChange={handleContactInfoChange}
                  className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Emergency Contact</h3>
            <div className="mt-5 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="emergencyName" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="emergencyName"
                  value={formData.emergencyContact.name}
                  onChange={handleEmergencyContactChange}
                  className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="relationship" className="block text-sm font-medium text-gray-700">
                  Relationship
                </label>
                <input
                  type="text"
                  name="relationship"
                  id="relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={handleEmergencyContactChange}
                  className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="emergencyPhone"
                  value={formData.emergencyContact.phone}
                  onChange={handleEmergencyContactChange}
                  className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Participant Details */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Participant Details</h3>
            <div className="mt-5 space-y-6">
              {formData.participantDetails.map((participant, index) => (
                <div key={participant._id} className="border border-gray-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Participant {index + 1}</h4>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor={`name-${index}`} className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        id={`name-${index}`}
                        value={participant.name}
                        onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                        className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor={`age-${index}`} className="block text-sm font-medium text-gray-700">
                        Age
                      </label>
                      <input
                        type="number"
                        id={`age-${index}`}
                        value={participant.age}
                        onChange={(e) => handleParticipantChange(index, 'age', e.target.value)}
                        className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor={`gender-${index}`} className="block text-sm font-medium text-gray-700">
                        Gender
                      </label>
                      <select
                        id={`gender-${index}`}
                        value={participant.gender}
                        onChange={(e) => handleParticipantChange(index, 'gender', e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor={`contactNumber-${index}`} className="block text-sm font-medium text-gray-700">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        id={`contactNumber-${index}`}
                        value={participant.contactNumber}
                        onChange={(e) => handleParticipantChange(index, 'contactNumber', e.target.value)}
                        className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor={`medicalConditions-${index}`} className="block text-sm font-medium text-gray-700">
                        Medical Conditions
                      </label>
                      <textarea
                        id={`medicalConditions-${index}`}
                        value={participant.medicalConditions}
                        onChange={(e) => handleParticipantChange(index, 'medicalConditions', e.target.value)}
                        rows={3}
                        className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor={`specialRequests-${index}`} className="block text-sm font-medium text-gray-700">
                        Special Requests
                      </label>
                      <textarea
                        id={`specialRequests-${index}`}
                        value={participant.specialRequests}
                        onChange={(e) => handleParticipantChange(index, 'specialRequests', e.target.value)}
                        rows={3}
                        className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    {/* Custom Fields */}
                    {participant.customFieldResponses && participant.customFieldResponses.map((field, fieldIndex) => (
                      <div key={fieldIndex} className="sm:col-span-6">
                        <label className="block text-sm font-medium text-gray-700">
                          {field.fieldName}
                        </label>
                        {field.fieldType === 'text' && (
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) => handleCustomFieldChange(index, fieldIndex, e.target.value)}
                            className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        )}
                        {field.fieldType === 'number' && (
                          <input
                            type="number"
                            value={field.value}
                            onChange={(e) => handleCustomFieldChange(index, fieldIndex, e.target.value)}
                            className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        )}
                        {field.fieldType === 'select' && (
                          <select
                            value={field.value}
                            onChange={(e) => handleCustomFieldChange(index, fieldIndex, e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                          >
                            {field.options.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        )}
                        {field.fieldType === 'checkbox' && (
                          <div className="mt-2 space-y-2">
                            {field.options.map(option => (
                              <div key={option} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={field.value.includes(option)}
                                  onChange={(e) => {
                                    const newValue = e.target.checked
                                      ? [...field.value, option]
                                      : field.value.filter(v => v !== option);
                                    handleCustomFieldChange(index, fieldIndex, newValue);
                                  }}
                                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-900">
                                  {option}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Special Requirements */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Special Requirements</h3>
            <div className="mt-5">
              <textarea
                name="specialRequirements"
                value={formData.specialRequirements}
                onChange={handleInputChange}
                rows={4}
                className="shadow-sm focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Total Price */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Total Price</h3>
            <div className="mt-5">
              <input
                type="number"
                name="totalPrice"
                value={formData.totalPrice}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditBooking; 