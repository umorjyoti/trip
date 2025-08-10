import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { validateUserByPhone, createUserForManualBooking, createManualBooking, getAllTreks } from '../services/api';
import { FaPhone, FaUser, FaCalendar, FaUsers, FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';
import Modal from './Modal';

const ManualBookingModal = ({ isOpen, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [treks, setTreks] = useState([]);
  const [selectedTrek, setSelectedTrek] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [batches, setBatches] = useState([]);

  // Step 1: Phone validation
  const [phone, setPhone] = useState('');
  const [userValidationResult, setUserValidationResult] = useState(null);

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

  // Step 3: Booking details
  const [bookingData, setBookingData] = useState({
    numberOfParticipants: 1,
    userDetails: {
      name: '',
      email: '',
      phone: ''
    },
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    },
    participantDetails: [{
      name: '',
      age: '',
      gender: '',
      medicalConditions: ''
    }],
    totalPrice: 0,
    paymentStatus: 'payment_completed',
    additionalRequests: ''
  });

  const [selectedUser, setSelectedUser] = useState(null);

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
    console.log('useEffect triggered - selectedTrek:', selectedTrek, 'treks:', treks);
    if (selectedTrek) {
      const trek = treks.find(t => t._id === selectedTrek);
      console.log('Found trek:', trek);
      if (trek && trek.batches) {
        console.log('Setting batches:', trek.batches);
        setBatches(trek.batches);
      } else {
        console.log('No trek found or no batches');
        setBatches([]);
      }
    } else {
      console.log('No trek selected, clearing batches');
      setBatches([]);
    }
  }, [selectedTrek, treks]);

  useEffect(() => {
    if (selectedBatch && selectedUser) {
      const batch = batches.find(b => b._id === selectedBatch);
      if (batch) {
        setBookingData(prev => ({
          ...prev,
          totalPrice: batch.price * bookingData.numberOfParticipants
        }));
      }
    }
  }, [selectedBatch, selectedUser, bookingData.numberOfParticipants]);

  const fetchTreks = async () => {
    try {
      const data = await getAllTreks();
      console.log('Fetched treks:', data);
      const enabledTreks = data.filter(trek => trek.isEnabled);
      console.log('Enabled treks:', enabledTreks);
      setTreks(enabledTreks);
    } catch (error) {
      console.error('Error fetching treks:', error);
      toast.error('Failed to load treks');
    }
  };

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
        setSelectedUser(result.user);
        setBookingData(prev => ({
          ...prev,
          userDetails: {
            name: result.user.name,
            email: result.user.email,
            phone: result.user.phone
          }
        }));
        setCurrentStep(3);
      } else {
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

  const handleCreateUser = async () => {
    if (!validateStep2()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setLoading(true);
    try {
      const user = await createUserForManualBooking(newUserData);
      setSelectedUser(user);
      setBookingData(prev => ({
        ...prev,
        userDetails: {
          name: user.name,
          email: user.email,
          phone: user.phone
        }
      }));
      setCurrentStep(3);
      toast.success('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async () => {
    if (!validateStep3()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setLoading(true);
    try {
      const booking = await createManualBooking({
        ...bookingData,
        trekId: selectedTrek,
        batchId: selectedBatch,
        userId: selectedUser._id
      });
      
      toast.success('Booking created successfully');
      onSuccess(booking);
      resetModal();
      onClose(); // Close the modal after successful booking creation
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking');
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
      emergencyContact: { name: '', phone: '', relation: '' },
      participantDetails: [{ name: '', age: '', gender: '', medicalConditions: '' }],
      totalPrice: 0,
      paymentStatus: 'payment_completed',
      additionalRequests: ''
    });
    setErrors({});
    setTouched({});
  };

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

  const validateRequired = (value, fieldName) => {
    if (!value || value.trim() === '') {
      setErrors(prev => ({ ...prev, [fieldName]: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required` }));
      return false;
    }
    return true;
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
    
    if (!validateRequired(newUserData.name, 'name')) {
      newErrors.name = 'Name is required';
    } else if (!validateName(newUserData.name)) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    if (!validateRequired(newUserData.email, 'email')) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(newUserData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Optional fields validation
    if (newUserData.address && newUserData.address.trim().length > 200) {
      newErrors.address = 'Address must be less than 200 characters';
      newTouched.address = true;
    }
    if (newUserData.city && newUserData.city.trim().length > 50) {
      newErrors.city = 'City must be less than 50 characters';
      newTouched.city = true;
    }
    if (newUserData.state && newUserData.state.trim().length > 50) {
      newErrors.state = 'State must be less than 50 characters';
      newTouched.state = true;
    }

    console.log('Final validation errors:', newErrors);
    console.log('Validation failed fields:', Object.keys(newErrors));
    console.log('Validation result:', Object.keys(newErrors).length === 0 ? 'PASSED' : 'FAILED');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    const newTouched = { ...touched };
    
    console.log('Validating Step 3 with data:', {
      userDetails: bookingData.userDetails,
      emergencyContact: bookingData.emergencyContact,
      participantDetails: bookingData.participantDetails,
      selectedTrek,
      selectedBatch
    });
    
    // User details validation
    const userNameError = validateName(bookingData.userDetails.name);
    if (userNameError) {
      newErrors.userName = userNameError;
      newTouched.userName = true;
      console.log('User name validation error:', userNameError);
    }
    
    const userEmailError = validateEmail(bookingData.userDetails.email);
    if (userEmailError) {
      newErrors.userEmail = userEmailError;
      newTouched.userEmail = true;
      console.log('User email validation error:', userEmailError);
    }
    
    const userPhoneError = validatePhone(bookingData.userDetails.phone);
    if (userPhoneError) {
      newErrors.userPhone = userPhoneError;
      newTouched.userPhone = true;
      console.log('User phone validation error:', userPhoneError);
    }
    
    // Emergency contact validation - only validate if any field is filled
    const hasEmergencyContact = bookingData.emergencyContact.name.trim() || 
                               bookingData.emergencyContact.phone.trim() || 
                               bookingData.emergencyContact.relation.trim();
    
    if (hasEmergencyContact) {
      // If any emergency contact field is filled, all are required
      if (!bookingData.emergencyContact.name.trim()) {
        newErrors.emergencyName = 'Emergency contact name is required';
        newTouched.emergencyName = true;
        console.log('Emergency name validation error: Emergency contact name is required');
      } else {
        const emergencyNameError = validateName(bookingData.emergencyContact.name);
        if (emergencyNameError) {
          newErrors.emergencyName = emergencyNameError;
          newTouched.emergencyName = true;
          console.log('Emergency name validation error:', emergencyNameError);
        }
      }
      
      if (!bookingData.emergencyContact.phone.trim()) {
        newErrors.emergencyPhone = 'Emergency contact phone is required';
        newTouched.emergencyPhone = true;
        console.log('Emergency phone validation error: Emergency contact phone is required');
      } else {
        const emergencyPhoneError = validatePhone(bookingData.emergencyContact.phone);
        if (emergencyPhoneError) {
          newErrors.emergencyPhone = emergencyPhoneError;
          newTouched.emergencyPhone = true;
          console.log('Emergency phone validation error:', emergencyPhoneError);
        }
      }
      
      if (!bookingData.emergencyContact.relation.trim()) {
        newErrors.emergencyRelation = 'Emergency contact relation is required';
        newTouched.emergencyRelation = true;
        console.log('Emergency relation validation error: Emergency contact relation is required');
      }
    }
    // If no emergency contact fields are filled, skip validation entirely
    
    // Participant details validation
    bookingData.participantDetails.forEach((participant, index) => {
      if (!participant.name || !participant.name.trim()) {
        newErrors[`participant${index}Name`] = 'Participant name is required';
        newTouched[`participant${index}Name`] = true;
        console.log(`Participant ${index + 1} name validation error: Participant name is required`);
      } else {
        const participantNameError = validateName(participant.name);
        if (participantNameError) {
          newErrors[`participant${index}Name`] = participantNameError;
          newTouched[`participant${index}Name`] = true;
          console.log(`Participant ${index + 1} name validation error:`, participantNameError);
        }
      }
      
      if (!participant.age) {
        newErrors[`participant${index}Age`] = 'Participant age is required';
        newTouched[`participant${index}Age`] = true;
        console.log(`Participant ${index + 1} age validation error: Participant age is required`);
      } else {
        const participantAgeError = validateAge(participant.age);
        if (participantAgeError) {
          newErrors[`participant${index}Age`] = participantAgeError;
          newTouched[`participant${index}Age`] = true;
          console.log(`Participant ${index + 1} age validation error:`, participantAgeError);
        }
      }
      
      if (!participant.gender) {
        newErrors[`participant${index}Gender`] = 'Please select gender';
        newTouched[`participant${index}Gender`] = true;
        console.log(`Participant ${index + 1} gender validation error: Please select gender`);
      }
    });
    
    // Trek and batch validation
    if (!selectedTrek) {
      newErrors.trek = 'Please select a trek';
      newTouched.trek = true;
      console.log('Trek validation error: Please select a trek');
    }
    if (!selectedBatch) {
      newErrors.batch = 'Please select a batch';
      newTouched.batch = true;
      console.log('Batch validation error: Please select a batch');
    }

    console.log('Final validation errors:', newErrors);
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

      {/* Step 1: Phone Validation */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <FaPhone className="mx-auto text-4xl text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold">Enter Customer Phone Number</h3>
            <p className="text-gray-600">We'll check if this customer already exists in our system</p>
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
              placeholder="Enter phone number"
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
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Validating...' : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Create User */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <FaUser className="mx-auto text-4xl text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold">Create New Customer</h3>
            <p className="text-gray-600">This customer doesn't exist. Please create a new account.</p>
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
              disabled={loading || !newUserData.name || !newUserData.email || !newUserData.phone}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create User & Continue'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Booking Details */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <FaCalendar className="mx-auto text-4xl text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold">Booking Details</h3>
            <p className="text-gray-600">Select trek, batch, and enter booking information</p>
          </div>

            {/* Trek and Batch Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Trek *
                </label>
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-500 mb-2">
                    Available treks: {treks.length} | Selected: {selectedTrek || 'None'}
                  </div>
                )}
                <select
                  value={selectedTrek}
                  onChange={(e) => {
                    console.log('Trek selected:', e.target.value);
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
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-500 mb-2">
                    Available batches: {batches.length} | Selected: {selectedBatch || 'None'}
                  </div>
                )}
                <select
                  value={selectedBatch}
                  onChange={(e) => {
                    console.log('Batch selected:', e.target.value);
                    setSelectedBatch(e.target.value);
                  }}
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

          {/* User Details */}
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
                  onChange={(e) => setBookingData(prev => ({
                    ...prev,
                    userDetails: { ...prev.userDetails, name: e.target.value }
                  }))}
                  onBlur={() => handleFieldBlur('userName')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.userName && touched.userName 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.userName && touched.userName && (
                  <div className="flex items-center mt-1 text-red-600 text-sm">
                    <FaExclamationTriangle className="mr-1" size={12} />
                    {errors.userName}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={bookingData.userDetails.email}
                  onChange={(e) => setBookingData(prev => ({
                    ...prev,
                    userDetails: { ...prev.userDetails, email: e.target.value }
                  }))}
                  onBlur={() => handleFieldBlur('userEmail')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.userEmail && touched.userEmail 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.userEmail && touched.userEmail && (
                  <div className="flex items-center mt-1 text-red-600 text-sm">
                    <FaExclamationTriangle className="mr-1" size={12} />
                    {errors.userEmail}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={bookingData.userDetails.phone}
                  onChange={(e) => setBookingData(prev => ({
                    ...prev,
                    userDetails: { ...prev.userDetails, phone: e.target.value }
                  }))}
                  onBlur={() => handleFieldBlur('userPhone')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.userPhone && touched.userPhone 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.userPhone && touched.userPhone && (
                  <div className="flex items-center mt-1 text-red-600 text-sm">
                    <FaExclamationTriangle className="mr-1" size={12} />
                    {errors.userPhone}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-semibold mb-3">Emergency Contact</h4>
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
                  Relation
                </label>
                <input
                  type="text"
                  value={bookingData.emergencyContact.relation}
                  onChange={(e) => setBookingData(prev => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, relation: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Number of Participants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Participants *
            </label>
            <select
              value={bookingData.numberOfParticipants}
              onChange={handleNumberOfParticipantsChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          {/* Participant Details */}
          <div className="space-y-4">
            <h4 className="font-semibold">Participant Details</h4>
            {bookingData.participantDetails.map((participant, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-md">
                <h5 className="font-medium mb-3">Participant {index + 1}</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={participant.name}
                      onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                      onBlur={() => handleFieldBlur(`participant${index}Name`)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        errors[`participant${index}Name`] && touched[`participant${index}Name`]
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {errors[`participant${index}Name`] && touched[`participant${index}Name`] && (
                      <div className="flex items-center mt-1 text-red-600 text-sm">
                        <FaExclamationTriangle className="mr-1" size={12} />
                        {errors[`participant${index}Name`]}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age *
                    </label>
                    <input
                      type="number"
                      value={participant.age}
                      onChange={(e) => handleParticipantChange(index, 'age', e.target.value)}
                      onBlur={() => handleFieldBlur(`participant${index}Age`)}
                      min="1"
                      max="120"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        errors[`participant${index}Age`] && touched[`participant${index}Age`]
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {errors[`participant${index}Age`] && touched[`participant${index}Age`] && (
                      <div className="flex items-center mt-1 text-red-600 text-sm">
                        <FaExclamationTriangle className="mr-1" size={12} />
                        {errors[`participant${index}Age`]}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender *
                    </label>
                    <select
                      value={participant.gender}
                      onChange={(e) => handleParticipantChange(index, 'gender', e.target.value)}
                      onBlur={() => handleFieldBlur(`participant${index}Gender`)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        errors[`participant${index}Gender`] && touched[`participant${index}Gender`]
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors[`participant${index}Gender`] && touched[`participant${index}Gender`] && (
                      <div className="flex items-center mt-1 text-red-600 text-sm">
                        <FaExclamationTriangle className="mr-1" size={12} />
                        {errors[`participant${index}Gender`]}
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
                      onChange={(e) => handleParticipantChange(index, 'medicalConditions', e.target.value)}
                      placeholder="Any medical conditions or allergies"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Status */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-semibold mb-3">Payment Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  value="unpaid"
                  checked={bookingData.paymentStatus === 'unpaid'}
                  onChange={(e) => setBookingData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                  className="text-blue-500"
                />
                <span>Unpaid</span>
              </label>
            </div>
          </div>

          {/* Additional Requests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Requests
            </label>
            <textarea
              value={bookingData.additionalRequests}
              onChange={(e) => setBookingData(prev => ({ ...prev, additionalRequests: e.target.value }))}
              rows={3}
              placeholder="Any special requests or additional information"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              disabled={loading || !selectedTrek || !selectedBatch || !bookingData.userDetails.name}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Booking...' : 'Create Booking'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ManualBookingModal; 