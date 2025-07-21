import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createBooking } from '../services/api';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaUsers, FaMoneyBillWave, FaInfoCircle, FaUserPlus, FaUserFriends, FaPhoneAlt } from 'react-icons/fa';

function BookingForm({ trek, batch, onClose, onSuccess }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState(1);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    specialRequirements: '',
    // Emergency contact
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    // Participant details (array of participants)
    participantDetails: [
      {
        name: currentUser?.name || '',
        age: '',
        gender: '',
        medicalConditions: ''
      }
    ]
  });
  const [errors, setErrors] = useState({});
  const [totalPrice, setTotalPrice] = useState(batch?.price || 0);
  const [paymentMode, setPaymentMode] = useState('full');

  // Debug the batch data
  useEffect(() => {
    console.log('BookingForm mounted with batch:', batch);
    
    // Check if batch exists and has required properties
    if (!batch) {
      console.error('No batch selected');
      toast.error('No batch selected. Please try again.');
      onClose();
      return;
    }
    
    if (!batch._id) {
      console.error('Invalid batch data (missing _id):', batch);
      toast.error('Invalid batch data. Please try again.');
      onClose();
      return;
    }
    
    // Set initial total price
    setTotalPrice(batch.price * participants);
  }, [batch, participants, onClose]);

  // Update total price when participants change
  useEffect(() => {
    if (batch && batch.price) {
      setTotalPrice(batch.price * participants);
    }
    
    // Update participant details array when number of participants changes
    const currentParticipants = formData.participantDetails || [];
    if (participants > currentParticipants.length) {
      // Add more participant slots
      const newParticipants = [...currentParticipants];
      for (let i = currentParticipants.length; i < participants; i++) {
        newParticipants.push({
          name: '',
          age: '',
          gender: '',
          medicalConditions: ''
        });
      }
      setFormData({
        ...formData,
        participantDetails: newParticipants
      });
    } else if (participants < currentParticipants.length) {
      // Remove excess participant slots
      setFormData({
        ...formData,
        participantDetails: currentParticipants.slice(0, participants)
      });
    }
  }, [participants, batch, formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleEmergencyContactChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      emergencyContact: {
        ...formData.emergencyContact,
        [name.replace('emergency_', '')]: value
      }
    });
  };

  const handleParticipantChange = (index, field, value) => {
    const updatedParticipants = [...formData.participantDetails];
    updatedParticipants[index] = {
      ...updatedParticipants[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      participantDetails: updatedParticipants
    });
  };

  const handleParticipantsChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= (batch.maxParticipants - batch.currentParticipants)) {
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
    
    // Validate emergency contact
    if (!formData.emergencyContact.name.trim()) {
      newErrors.emergency_name = 'Emergency contact name is required';
    }
    
    if (!formData.emergencyContact.phone.trim()) {
      newErrors.emergency_phone = 'Emergency contact phone is required';
    }
    
    if (!formData.emergencyContact.relationship.trim()) {
      newErrors.emergency_relationship = 'Relationship is required';
    }
    
    // Validate participant details
    formData.participantDetails.forEach((participant, index) => {
      if (!participant.name.trim()) {
        newErrors[`participant_${index}_name`] = 'Name is required';
      }
      
      if (!participant.age.trim()) {
        newErrors[`participant_${index}_age`] = 'Age is required';
      } else if (isNaN(participant.age) || parseInt(participant.age) <= 0) {
        newErrors[`participant_${index}_age`] = 'Please enter a valid age';
      }
      
      if (!participant.gender.trim()) {
        newErrors[`participant_${index}_gender`] = 'Gender is required';
      }
    });
    
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
        batchId: batch._id,
        participants,
        contactInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        },
        emergencyContact: formData.emergencyContact,
        participantDetails: formData.participantDetails,
        specialRequirements: formData.specialRequirements,
        totalPrice,
        paymentMode
      };
      
      const response = await createBooking(bookingData);
      
      if (response && response._id) {
        // Redirect to booking confirmation or payment page
        toast.success('Booking created successfully!');
        onSuccess(response._id);
      } else {
        toast.error('Something went wrong with your booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  if (!trek || !batch) {
    return null;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const availableSpots = batch.maxParticipants - batch.currentParticipants;

  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-2xl w-full">
      <div className="bg-emerald-600 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Book Your Trek</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="px-6 py-4 max-h-[80vh] overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900">{trek.name}</h3>
          <div className="mt-2 flex flex-col space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <FaCalendarAlt className="mr-2 text-emerald-500" />
              <span>{formatDate(batch.startDate)} - {formatDate(batch.endDate)}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <FaUsers className="mr-2 text-emerald-500" />
              <span>{availableSpots} {availableSpots === 1 ? 'spot' : 'spots'} left</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <FaMoneyBillWave className="mr-2 text-emerald-500" />
              <span>{formatCurrency(batch.price)} per person</span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Main contact information */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <FaUserPlus className="mr-2 text-emerald-500" />
              Main Contact Information
            </h4>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm ${
                    errors.name ? 'border-red-300' : ''
                  }`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm ${
                    errors.email ? 'border-red-300' : ''
                  }`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm ${
                    errors.phone ? 'border-red-300' : ''
                  }`}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
            </div>
          </div>
          
          {/* Emergency Contact */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <FaPhoneAlt className="mr-2 text-emerald-500" />
              Emergency Contact
            </h4>
            <div className="space-y-4">
              <div>
                <label htmlFor="emergency_name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  id="emergency_name"
                  name="emergency_name"
                  value={formData.emergencyContact.name}
                  onChange={handleEmergencyContactChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm ${
                    errors.emergency_name ? 'border-red-300' : ''
                  }`}
                />
                {errors.emergency_name && <p className="mt-1 text-sm text-red-600">{errors.emergency_name}</p>}
              </div>
              
              <div>
                <label htmlFor="emergency_relationship" className="block text-sm font-medium text-gray-700">Relationship</label>
                <input
                  type="text"
                  id="emergency_relationship"
                  name="emergency_relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={handleEmergencyContactChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm ${
                    errors.emergency_relationship ? 'border-red-300' : ''
                  }`}
                  placeholder="e.g. Spouse, Parent, Friend"
                />
                {errors.emergency_relationship && <p className="mt-1 text-sm text-red-600">{errors.emergency_relationship}</p>}
              </div>
              
              <div>
                <label htmlFor="emergency_phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  id="emergency_phone"
                  name="emergency_phone"
                  value={formData.emergencyContact.phone}
                  onChange={handleEmergencyContactChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm ${
                    errors.emergency_phone ? 'border-red-300' : ''
                  }`}
                />
                {errors.emergency_phone && <p className="mt-1 text-sm text-red-600">{errors.emergency_phone}</p>}
              </div>
            </div>
          </div>
          
          {/* Number of Participants */}
          <div className="mb-6">
            <label htmlFor="participants" className="block text-sm font-medium text-gray-700">Number of Participants</label>
            <select
              id="participants"
              name="participants"
              value={participants}
              onChange={handleParticipantsChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
            >
              {[...Array(Math.min(10, availableSpots)).keys()].map(i => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>
          
          {/* Participant Details */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <FaUserFriends className="mr-2 text-emerald-500" />
              Participant Details
            </h4>
            
            {formData.participantDetails.map((participant, index) => (
              <div key={index} className="mb-6 p-4 border border-gray-200 rounded-md">
                <h5 className="text-sm font-medium text-gray-900 mb-3">
                  Participant {index + 1}
                </h5>
                <div className="space-y-4">
                  <div>
                    <label htmlFor={`participant_${index}_name`} className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      id={`participant_${index}_name`}
                      value={participant.name}
                      onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm ${
                        errors[`participant_${index}_name`] ? 'border-red-300' : ''
                      }`}
                    />
                    {errors[`participant_${index}_name`] && <p className="mt-1 text-sm text-red-600">{errors[`participant_${index}_name`]}</p>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={`participant_${index}_age`} className="block text-sm font-medium text-gray-700">Age</label>
                      <input
                        type="number"
                        id={`participant_${index}_age`}
                        value={participant.age}
                        onChange={(e) => handleParticipantChange(index, 'age', e.target.value)}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm ${
                          errors[`participant_${index}_age`] ? 'border-red-300' : ''
                        }`}
                        min="1"
                      />
                      {errors[`participant_${index}_age`] && <p className="mt-1 text-sm text-red-600">{errors[`participant_${index}_age`]}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor={`participant_${index}_gender`} className="block text-sm font-medium text-gray-700">Gender</label>
                      <select
                        id={`participant_${index}_gender`}
                        value={participant.gender}
                        onChange={(e) => handleParticipantChange(index, 'gender', e.target.value)}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm ${
                          errors[`participant_${index}_gender`] ? 'border-red-300' : ''
                        }`}
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                      {errors[`participant_${index}_gender`] && <p className="mt-1 text-sm text-red-600">{errors[`participant_${index}_gender`]}</p>}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor={`participant_${index}_medical`} className="block text-sm font-medium text-gray-700">Medical Conditions/Allergies</label>
                    <textarea
                      id={`participant_${index}_medical`}
                      value={participant.medicalConditions}
                      onChange={(e) => handleParticipantChange(index, 'medicalConditions', e.target.value)}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                      placeholder="List any medical conditions, allergies, or dietary restrictions"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Special Requirements */}
          <div className="mb-6">
            <label htmlFor="specialRequirements" className="block text-sm font-medium text-gray-700">Additional Special Requirements</label>
            <textarea
              id="specialRequirements"
              name="specialRequirements"
              rows={3}
              value={formData.specialRequirements}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
              placeholder="Any other special requirements for your group"
            />
          </div>

          {/* Payment Mode Selection */}
          {trek.partialPayment && trek.partialPayment.enabled && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <FaMoneyBillWave className="mr-2 text-emerald-500" />
                Payment Options
              </h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="payment_full"
                    name="paymentMode"
                    value="full"
                    checked={paymentMode === 'full'}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <label htmlFor="payment_full" className="ml-2 block text-sm text-gray-900">
                    <span className="font-medium">Pay in Full</span>
                    <span className="text-gray-500 ml-2">- Pay the complete amount now</span>
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="payment_partial"
                    name="paymentMode"
                    value="partial"
                    checked={paymentMode === 'partial'}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <label htmlFor="payment_partial" className="ml-2 block text-sm text-gray-900">
                    <span className="font-medium">Pay Partial Now & Pay Later</span>
                    <span className="text-gray-500 ml-2">
                      - Pay ₹{trek.partialPayment.amountType === 'percentage' 
                        ? Math.round((totalPrice * trek.partialPayment.amount) / 100)
                        : trek.partialPayment.amount} now, balance due {trek.partialPayment.finalPaymentDueDays} days before trek
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* Price Summary */}
          <div className="mt-6 bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Price:</span>
              <span className="text-lg font-bold text-emerald-600">{formatCurrency(totalPrice)}</span>
            </div>
            
            {paymentMode === 'partial' && trek.partialPayment && trek.partialPayment.enabled && (
              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Initial Payment:</span>
                  <span className="font-medium text-emerald-600">
                    ₹{trek.partialPayment.amountType === 'percentage' 
                      ? Math.round((totalPrice * trek.partialPayment.amount) / 100)
                      : trek.partialPayment.amount}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Remaining Balance:</span>
                  <span className="font-medium text-gray-800">
                    ₹{(trek.partialPayment.amountType === 'percentage' 
                      ? totalPrice - Math.round((totalPrice * trek.partialPayment.amount) / 100)
                      : totalPrice - trek.partialPayment.amount).toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex items-start">
                  <FaInfoCircle className="mr-1 mt-0.5 flex-shrink-0" />
                  <span>Remaining balance due {trek.partialPayment.finalPaymentDueDays} days before trek start date</span>
                </div>
              </div>
            )}
            
            {paymentMode === 'full' && (
              <div className="mt-2 text-xs text-gray-500 flex items-start">
                <FaInfoCircle className="mr-1 mt-0.5 flex-shrink-0" />
                <span>Pay the complete amount now to confirm your booking</span>
              </div>
            )}
          </div>
          
          {/* Form Actions */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingForm; 