import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { validateUserByPhone, createUserForManualBooking, createManualBooking, getAllTreks } from '../services/api';
import { FaPhone, FaUser, FaCalendar, FaUsers, FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaSearch, FaUserPlus } from 'react-icons/fa';
import Modal from './Modal';

/**
 * ManualBookingModal - Streamlined manual booking system for admins
 * 
 * Flow:
 * 1. User Lookup: Search by phone number
 * 2. User Creation: Create new user if not found (with adminCreated: true flag)
 * 3. Booking Flow: Trek selection, batch selection, participants, emergency contact
 * 4. Payment Status: Manual entry according to DB enums
 */

const ManualBookingModal = ({ isOpen, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userCreating, setUserCreating] = useState(false);
  const [treks, setTreks] = useState([]);
  const [selectedTrek, setSelectedTrek] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [batches, setBatches] = useState([]);

  // Step 1: Phone validation and user lookup/creation
  const [phone, setPhone] = useState('');
  const [userValidationResult, setUserValidationResult] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Step 2: User creation (if needed)
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  // Step 3: Booking details (matching standard booking flow)
  const [bookingData, setBookingData] = useState({
    numberOfParticipants: 1,
    userDetails: {
      name: '',
      email: '',
      phone: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    participantDetails: [{
      name: '',
      age: '',
      gender: '',
      medicalConditions: ''
    }],
    totalPrice: 0,
    paymentStatus: 'payment_completed',
    specialRequirements: ''
  });

  // Validation states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchTreks();
    }
  }, [isOpen]);

  // Fetch batches when trek is selected
  useEffect(() => {
    if (selectedTrek) {
      const trek = treks.find(t => t._id === selectedTrek);
      if (trek && trek.batches) {
        setBatches(trek.batches);
      } else {
        setBatches([]);
      }
    } else {
      setBatches([]);
    }
  }, [selectedTrek, treks]);

  // Update total price when batch or participants change
  useEffect(() => {
    if (selectedBatch && selectedUser) {
      const batch = batches.find(b => b._id === selectedBatch);
      if (batch) {
        setBookingData(prev => ({
          ...prev,
          totalPrice: batch.price * prev.participantDetails.length
        }));
      }
    }
  }, [selectedBatch, selectedUser, bookingData.participantDetails.length]);



  const fetchTreks = async () => {
    try {
      const data = await getAllTreks();
      const enabledTreks = data.filter(trek => trek.isEnabled);
      setTreks(enabledTreks);
    } catch (error) {
      console.error('Error fetching treks:', error);
      toast.error('Failed to load treks');
    }
  };



  // Step 1: Phone validation and user lookup
  const handlePhoneValidation = async () => {
    if (!validateStep1()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setLoading(true);
    try {
      const result = await validateUserByPhone(phone);
      setUserValidationResult(result);
      
      if (result.exists) {
        // User exists - set selected user and populate booking data immediately
        const userObject = result.user;
        
        setSelectedUser(userObject);
        
        // Directly populate booking data with user details
        setBookingData(prev => ({
          ...prev,
          userDetails: {
            name: userObject.name || '',
            email: userObject.email || '',
            phone: userObject.phone || ''
          },
          participantDetails: [{
            name: userObject.name || '',
            age: '',
            gender: '',
            medicalConditions: ''
          }]
        }));
        
        setCurrentStep(3);
        toast.success(`User found: ${userObject.name}`);
      } else {
        // User doesn't exist - proceed to user creation
        setNewUserData(prev => ({ ...prev, phone }));
        setCurrentStep(2);
      }
    } catch (error) {
      console.error('Error validating phone:', error);
      toast.error('Failed to validate phone number');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Create new user
  const handleCreateUser = async () => {
    if (!validateStep2()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setUserCreating(true);
    try {
      const response = await createUserForManualBooking(newUserData);
      
      // Extract user data from the response
      const user = response.user || response;
      
      // Set the created user
      setSelectedUser(user);
      
      // Directly populate booking data with user details from the response
      setBookingData(prev => ({
        ...prev,
        userDetails: {
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || ''
        },
        participantDetails: [{
          name: user.name || '',
          age: '',
          gender: '',
          medicalConditions: ''
        }]
      }));
      
      setCurrentStep(3);
      toast.success('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setUserCreating(false);
    }
  };

  // Step 3: Create booking
  const handleCreateBooking = async () => {
    if (!validateStep3()) {
      toast.error('Please fix the validation errors');
      return;
    }

    // Validate user exists
    if (!selectedUser || !(selectedUser._id || selectedUser.id)) {
      toast.error('User information is missing. Please try again.');
      return;
    }

    // Validate trek and batch selection
    if (!selectedTrek || !selectedBatch) {
      toast.error('Please select both trek and batch.');
      return;
    }

    const userId = selectedUser._id || selectedUser.id;
    
    const bookingPayload = {
      ...bookingData,
      userId: userId,
      trekId: selectedTrek,
      batchId: selectedBatch
    };

    setLoading(true);
    try {
      const booking = await createManualBooking(bookingPayload);
      
      toast.success('Booking created successfully');
      onSuccess(booking);
      resetModal();
      onClose();
    } catch (error) {
      console.error('Error creating booking:', error);
      if (error.response && error.response.status === 400) {
        toast.error('Booking validation failed. Please check all required fields.');
      } else {
        toast.error('Failed to create booking');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleParticipantChange = (index, field, value) => {
    const newParticipantDetails = [...bookingData.participantDetails];
    newParticipantDetails[index] = { ...newParticipantDetails[index], [field]: value };
    setBookingData(prev => ({ ...prev, participantDetails: newParticipantDetails }));
  };

  const handleNumberOfParticipantsChange = (e) => {
    const count = parseInt(e.target.value);
    setBookingData(prev => ({
      ...prev,
      numberOfParticipants: count,
      participantDetails: Array.from({ length: count }, (_, index) => 
        prev.participantDetails[index] || { name: '', age: '', gender: '', medicalConditions: '' }
      )
    }));
  };

  const handleAddParticipant = () => {
    setBookingData(prev => ({
      ...prev,
      participantDetails: [...prev.participantDetails, { name: '', age: '', gender: '', medicalConditions: '' }]
    }));
    setErrors(prev => ({ ...prev, [`participant${bookingData.participantDetails.length}Name`]: '' }));
    setTouched(prev => ({ ...prev, [`participant${bookingData.participantDetails.length}Name`]: true }));
  };

  const handleRemoveParticipant = (index) => {
    setBookingData(prev => {
      const newParticipantDetails = prev.participantDetails.filter((_, i) => i !== index);
      // Update errors and touched for removed participants
      const newErrors = { ...errors };
      const newTouched = { ...touched };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith('participant') && parseInt(key.slice(-1)) > index) {
          delete newErrors[key];
        }
      });
      Object.keys(newTouched).forEach(key => {
        if (key.startsWith('participant') && parseInt(key.slice(-1)) > index) {
          delete newTouched[key];
        }
      });
      return {
        ...prev,
        participantDetails: newParticipantDetails,
        errors: newErrors,
        touched: newTouched
      };
    });
  };

  const resetModal = () => {
    setCurrentStep(1);
    setPhone('');
    setUserValidationResult(null);
    setSelectedUser(null);
    setSelectedTrek('');
    setSelectedBatch('');
    setNewUserData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    });
    setBookingData({
      numberOfParticipants: 1,
      userDetails: { name: '', email: '', phone: '' },
      emergencyContact: { name: '', relationship: '', phone: '' },
      participantDetails: [{ name: '', age: '', gender: '', medicalConditions: '' }],
      totalPrice: 0,
      paymentStatus: 'payment_completed',
      specialRequirements: ''
    });
    setErrors({});
    setTouched({});
  };

  // Validation functions
  const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateName = (name) => {
    return name.trim().length >= 2;
  };

  const validateAge = (age) => {
    const numAge = parseInt(age);
    return numAge >= 1 && numAge <= 120;
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!newUserData.name || !newUserData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (!validateName(newUserData.name)) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    if (!newUserData.email || !newUserData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(newUserData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!newUserData.phone || !newUserData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!validatePhone(newUserData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    // Optional fields validation
    if (newUserData.address && newUserData.address.trim().length > 200) {
      newErrors.address = 'Address must be less than 200 characters';
    }
    if (newUserData.city && newUserData.city.trim().length > 50) {
      newErrors.city = 'City must be less than 50 characters';
    }
    if (newUserData.state && newUserData.state.trim().length > 50) {
      newErrors.state = 'State must be less than 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    
    // User details validation
    if (!validateName(bookingData.userDetails.name)) {
      newErrors.userName = 'Name must be at least 2 characters long';
    }
    
    if (!validateEmail(bookingData.userDetails.email)) {
      newErrors.userEmail = 'Please enter a valid email address';
    }
    
    if (!validatePhone(bookingData.userDetails.phone)) {
      newErrors.userPhone = 'Please enter a valid 10-digit phone number';
    }
    
    // Emergency contact validation - only validate if any field is filled
    const hasEmergencyContact = bookingData.emergencyContact.name.trim() || 
                               bookingData.emergencyContact.phone.trim() || 
                               bookingData.emergencyContact.relationship.trim();
    
    if (hasEmergencyContact) {
      if (!bookingData.emergencyContact.name.trim()) {
        newErrors.emergencyName = 'Emergency contact name is required';
      } else if (!validateName(bookingData.emergencyContact.name)) {
        newErrors.emergencyName = 'Name must be at least 2 characters long';
      }
      
      if (!bookingData.emergencyContact.phone.trim()) {
        newErrors.emergencyPhone = 'Emergency contact phone is required';
      } else if (!validatePhone(bookingData.emergencyContact.phone)) {
        newErrors.emergencyPhone = 'Please enter a valid 10-digit phone number';
      }
      
      if (!bookingData.emergencyContact.relationship.trim()) {
        newErrors.emergencyRelationship = 'Emergency contact relationship is required';
      }
    }
    
    // Participant details validation
    bookingData.participantDetails.forEach((participant, index) => {
      if (!participant.name || !participant.name.trim()) {
        newErrors[`participant${index}Name`] = 'Participant name is required';
      } else if (!validateName(participant.name)) {
        newErrors[`participant${index}Name`] = 'Name must be at least 2 characters long';
      }
      
      if (!participant.age) {
        newErrors[`participant${index}Age`] = 'Participant age is required';
      } else if (!validateAge(participant.age)) {
        newErrors[`participant${index}Age`] = 'Age must be between 1 and 120';
      }
      
      if (!participant.gender) {
        newErrors[`participant${index}Gender`] = 'Please select gender';
      }
    });
    
    // Trek and batch validation
    if (!selectedTrek) {
      newErrors.trek = 'Please select a trek';
    }
    if (!selectedBatch) {
      newErrors.batch = 'Please select a batch';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal 
      title="Create Manual Booking" 
      isOpen={isOpen} 
      onClose={onClose}
      size="xl"
    >
      {/* Progress Steps */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center space-x-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= step ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {currentStep > step ? <FaCheckCircle size={16} /> : step}
              </div>
              {step < 3 && (
                <div className={`w-16 h-1 mx-2 ${
                  currentStep > step ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Phone Validation & User Lookup */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <FaPhone className="mx-auto text-4xl text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold">Customer Phone Lookup</h3>
            <p className="text-gray-600">Enter phone number to find existing customer or create new one</p>
          </div>

          <div className="max-w-md mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => handleFieldBlur('phone')}
              placeholder="Enter 10-digit phone number"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.phone && touched.phone 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.phone && touched.phone && (
              <div className="flex items-center mt-1 text-red-600 text-sm">
                <FaExclamationTriangle className="mr-1" size={12} />
                {errors.phone}
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-4 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePhoneValidation}
              disabled={loading || !phone.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <FaSearch className="animate-spin" />
                  <span>Looking up...</span>
                </>
              ) : (
                <>
                  <FaSearch />
                  <span>Find Customer</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Create New User */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <FaUserPlus className="mx-auto text-4xl text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold">Create New Customer</h3>
            <p className="text-gray-600">Customer not found. Please create a new account.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={newUserData.name}
                onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                onBlur={() => handleFieldBlur('name')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.name && touched.name 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.name && touched.name && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <FaExclamationTriangle className="mr-1" size={12} />
                  {errors.name}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                onBlur={() => handleFieldBlur('email')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.email && touched.email 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.email && touched.email && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <FaExclamationTriangle className="mr-1" size={12} />
                  {errors.email}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone *
              </label>
              <input
                type="tel"
                value={newUserData.phone}
                onChange={(e) => setNewUserData(prev => ({ ...prev, phone: e.target.value }))}
                onBlur={() => handleFieldBlur('phone')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.phone && touched.phone 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.phone && touched.phone && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <FaExclamationTriangle className="mr-1" size={12} />
                  {errors.phone}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={newUserData.address}
                onChange={(e) => setNewUserData(prev => ({ ...prev, address: e.target.value }))}
                onBlur={() => handleFieldBlur('address')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.address && touched.address 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.address && touched.address && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <FaExclamationTriangle className="mr-1" size={12} />
                  {errors.address}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={newUserData.city}
                onChange={(e) => setNewUserData(prev => ({ ...prev, city: e.target.value }))}
                onBlur={() => handleFieldBlur('city')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.city && touched.city 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.city && touched.city && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <FaExclamationTriangle className="mr-1" size={12} />
                  {errors.city}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                value={newUserData.state}
                onChange={(e) => setNewUserData(prev => ({ ...prev, state: e.target.value }))}
                onBlur={() => handleFieldBlur('state')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.state && touched.state 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.state && touched.state && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <FaExclamationTriangle className="mr-1" size={12} />
                  {errors.state}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center space-x-4 mt-6">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleCreateUser}
              disabled={userCreating || !newUserData.name || !newUserData.email || !newUserData.phone}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {userCreating ? (
                <>
                  <FaUserPlus className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <FaUserPlus />
                  <span>Create Customer & Continue</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

             {/* Step 3: Booking Details */}
       {currentStep === 3 && (
         <div className="space-y-6">
                       {!selectedUser ? (
            <div className="text-center py-8">
              <FaExclamationTriangle className="mx-auto text-4xl text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-red-600">Customer Information Missing</h3>
              <p className="text-gray-600 mb-4">No customer has been selected or created yet.</p>
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Start Customer Lookup
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <FaCalendar className="mx-auto text-4xl text-blue-500 mb-4" />
                <h3 className="text-xl font-semibold">Booking Details</h3>
                <p className="text-gray-600">Select trek, batch, and enter booking information</p>
                <div className="text-sm text-gray-600 mt-2">
                  Customer: <span className="font-semibold">{selectedUser.name}</span> ({selectedUser.phone})
                </div>
              </div>

              {/* Trek and Batch Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Trek *
                  </label>
                  <select
                    value={selectedTrek}
                    onChange={(e) => {
                      setSelectedTrek(e.target.value);
                      setSelectedBatch('');
                    }}
                    onBlur={() => handleFieldBlur('trek')}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.trek && touched.trek 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">Select a trek</option>
                    {treks.map(trek => (
                      <option key={trek._id} value={trek._id}>
                        {trek.name}
                      </option>
                    ))}
                  </select>
                  {errors.trek && touched.trek && (
                    <div className="flex items-center mt-1 text-red-600 text-sm">
                      <FaExclamationTriangle className="mr-1" size={12} />
                      {errors.trek}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Batch *
                  </label>
                  <select
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    onBlur={() => handleFieldBlur('batch')}
                    disabled={!selectedTrek}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 disabled:bg-gray-100 ${
                      errors.batch && touched.batch 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">Select a batch</option>
                    {batches.map(batch => (
                      <option key={batch._id} value={batch._id}>
                        {new Date(batch.startDate).toLocaleDateString()} - {new Date(batch.endDate).toLocaleDateString()} 
                        (₹{batch.price})
                      </option>
                    ))}
                  </select>
                  {errors.batch && touched.batch && (
                    <div className="flex items-center mt-1 text-red-600 text-sm">
                      <FaExclamationTriangle className="mr-1" size={12} />
                      {errors.batch}
                    </div>
                  )}
                </div>
              </div>

                                            {/* Customer Information */}
               <div className="bg-gray-50 p-4 rounded-md">
                 <h4 className="font-semibold mb-3">Customer Information</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Name *
                     </label>
                     <input
                       type="text"
                       value={bookingData.userDetails.name}
                       disabled
                       className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 cursor-not-allowed"
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Email *
                     </label>
                     <input
                       type="email"
                       value={bookingData.userDetails.email}
                       disabled
                       className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 cursor-not-allowed"
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Phone *
                     </label>
                     <input
                       type="tel"
                       value={bookingData.userDetails.phone}
                       disabled
                       className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                     />
                   </div>
                 </div>
               </div>

              {/* Emergency Contact */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="font-semibold mb-3">Emergency Contact (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={bookingData.emergencyContact.name}
                      onChange={(e) => setBookingData(prev => ({
                        ...prev,
                        emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={bookingData.emergencyContact.phone}
                      onChange={(e) => setBookingData(prev => ({
                        ...prev,
                        emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                                     <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Relationship
                     </label>
                     <select
                       value={bookingData.emergencyContact.relationship}
                       onChange={(e) => setBookingData(prev => ({
                         ...prev,
                         emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                       }))}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     >
                       <option value="">Select relationship</option>
                       <option value="Spouse">Spouse</option>
                       <option value="Parent">Parent</option>
                       <option value="Child">Child</option>
                       <option value="Sibling">Sibling</option>
                       <option value="Friend">Friend</option>
                       <option value="Relative">Relative</option>
                       <option value="Colleague">Colleague</option>
                       <option value="Other">Other</option>
                     </select>
                   </div>
                </div>
              </div>



              {/* Participant Details */}
              <div className="space-y-4">
                <h4 className="font-semibold">Participant Details</h4>
                <div className="bg-gray-50 p-4 rounded-md">
                  {bookingData.participantDetails.map((participant, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 border-b pb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={participant.name || ''}
                          onChange={(e) => handleParticipantChange(idx, 'name', e.target.value)}
                          onBlur={() => handleFieldBlur(`participant${idx}Name`)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                            errors[`participant${idx}Name`] && touched[`participant${idx}Name`]
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                        {errors[`participant${idx}Name`] && touched[`participant${idx}Name`] && (
                          <div className="flex items-center mt-1 text-red-600 text-sm">
                            <FaExclamationTriangle className="mr-1" size={12} />
                            {errors[`participant${idx}Name`]}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Age *
                        </label>
                        <input
                          type="number"
                          value={participant.age || ''}
                          onChange={(e) => handleParticipantChange(idx, 'age', e.target.value)}
                          onBlur={() => handleFieldBlur(`participant${idx}Age`)}
                          min="1"
                          max="120"
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                            errors[`participant${idx}Age`] && touched[`participant${idx}Age`]
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                        {errors[`participant${idx}Age`] && touched[`participant${idx}Age`] && (
                          <div className="flex items-center mt-1 text-red-600 text-sm">
                            <FaExclamationTriangle className="mr-1" size={12} />
                            {errors[`participant${idx}Age`]}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Gender *
                        </label>
                        <select
                          value={participant.gender || ''}
                          onChange={(e) => handleParticipantChange(idx, 'gender', e.target.value)}
                          onBlur={() => handleFieldBlur(`participant${idx}Gender`)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                            errors[`participant${idx}Gender`] && touched[`participant${idx}Gender`]
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        {errors[`participant${idx}Gender`] && touched[`participant${idx}Gender`] && (
                          <div className="flex items-center mt-1 text-red-600 text-sm">
                            <FaExclamationTriangle className="mr-1" size={12} />
                            {errors[`participant${idx}Gender`]}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Medical Conditions
                        </label>
                        <input
                          type="text"
                          value={participant.medicalConditions || ''}
                          onChange={(e) => handleParticipantChange(idx, 'medicalConditions', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                      {bookingData.participantDetails.length > 1 && (
                        <div className="col-span-2 flex justify-end">
                          <button
                            type="button"
                            className="text-red-600 hover:text-red-800 text-sm mt-2"
                            onClick={() => handleRemoveParticipant(idx)}
                          >
                            Remove Participant
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="mt-2 px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                    onClick={handleAddParticipant}
                  >
                    + Add Participant
                  </button>
                </div>
              </div>

              {/* Special Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requirements
                </label>
                <textarea
                  value={bookingData.specialRequirements}
                  onChange={(e) => setBookingData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                  rows={3}
                  placeholder="Any special requests or additional information"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Payment Status */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="font-semibold mb-3">Payment Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="payment_completed"
                      checked={bookingData.paymentStatus === 'payment_completed'}
                      onChange={(e) => setBookingData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                      className="text-blue-500"
                    />
                    <span>Payment Completed</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="payment_confirmed_partial"
                      checked={bookingData.paymentStatus === 'payment_confirmed_partial'}
                      onChange={(e) => setBookingData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                      className="text-blue-500"
                    />
                    <span>Partial Payment</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="unpaid"
                      checked={bookingData.paymentStatus === 'unpaid'}
                      onChange={(e) => setBookingData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                      className="text-blue-500"
                    />
                    <span>Unpaid</span>
                  </label>
                </div>
              </div>

              {/* Total Price Display */}
              {bookingData.totalPrice > 0 && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Price:</span>
                    <span className="text-xl font-bold text-blue-600">
                      ₹{bookingData.totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateBooking}
                  disabled={loading || !selectedTrek || !selectedBatch || !selectedUser || !(selectedUser._id || selectedUser.id)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <FaCalendar className="animate-spin" />
                      <span>Creating Booking...</span>
                    </>
                  ) : (
                    <>
                      <FaCalendar />
                      <span>Create Booking</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ManualBookingModal; 