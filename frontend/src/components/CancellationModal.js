import React, { useState, useEffect } from 'react';
import { FaTimes, FaCalculator, FaUser, FaUsers, FaRupeeSign } from 'react-icons/fa';
import Modal from './Modal';
import { getBookingById } from '../services/api';

const CancellationModal = ({ 
  isOpen, 
  onClose, 
  booking, 
  bookingId, // New prop for bookingId
  trek, 
  onConfirmCancellation 
}) => {
  const [cancellationType, setCancellationType] = useState('entire'); // 'entire' or 'individual'
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [refundType, setRefundType] = useState('auto'); // 'auto' or 'custom'
  const [customRefundAmount, setCustomRefundAmount] = useState(0);
  const [cancellationReason, setCancellationReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [fetchingBooking, setFetchingBooking] = useState(false);

  // Calculate refund based on cancellation policy
  const calculateRefund = (amount, startDate, refundType = 'auto') => {
    if (refundType === 'custom') {
      return customRefundAmount;
    }

    const now = new Date();
    const start = new Date(startDate);
    const diffDays = Math.ceil((start - now) / (1000 * 60 * 60 * 24));

    // Based on the cancellation policy from CancellationPolicy.js
    if (diffDays > 21) {
      return amount; // Free cancellation
    } else if (diffDays >= 15) {
      return amount * 0.75; // 25% charge
    } else if (diffDays >= 8) {
      return amount * 0.5; // 50% charge
    } else {
      return 0; // No refund
    }
  };

  // Get cancellation policy description
  const getCancellationPolicyDescription = (startDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const diffDays = Math.ceil((start - now) / (1000 * 60 * 60 * 24));

    if (diffDays > 21) {
      return { text: 'Free Cancellation', color: 'text-green-600', percentage: 100 };
    } else if (diffDays >= 15) {
      return { text: '25% Cancellation Charge', color: 'text-yellow-600', percentage: 75 };
    } else if (diffDays >= 8) {
      return { text: '50% Cancellation Charge', color: 'text-orange-600', percentage: 50 };
    } else {
      return { text: 'No Refund', color: 'text-red-600', percentage: 0 };
    }
  };

  // Calculate total refund for selected participants
  const calculateTotalRefund = () => {
    if (refundType === 'custom') {
      return customRefundAmount || 0;
    }
    
    if (cancellationType === 'entire') {
      const policy = getCancellationPolicyDescription(bookingData?.batch?.startDate);
      return calculateRefund(bookingData?.totalPrice, bookingData?.batch?.startDate, refundType);
    } else {
      const participantDetails = bookingData?.participantDetails || [];
      const perParticipantPrice = participantDetails.length > 0 ? bookingData?.totalPrice / participantDetails.length : 0;
      return selectedParticipants.reduce((total, participantId) => {
        const participant = participantDetails.find(p => p._id === participantId);
        if (participant && !participant.isCancelled) {
          return total + calculateRefund(perParticipantPrice, bookingData?.batch?.startDate, refundType);
        }
        return total;
      }, 0);
    }
  };

  // Recalculate total refund when custom refund amount changes
  useEffect(() => {
    if (refundType === 'custom') {
      // totalRefund will be updated automatically through the calculateTotalRefund function
    }
  }, [customRefundAmount, refundType]);

  // Handle participant selection
  const handleParticipantToggle = (participantId) => {
    setSelectedParticipants(prev => {
      if (prev.includes(participantId)) {
        return prev.filter(id => id !== participantId);
      } else {
        return [...prev, participantId];
      }
    });
  };

  // Handle cancellation type change
  const handleCancellationTypeChange = (type) => {
    setCancellationType(type);
    if (type === 'entire') {
      setSelectedParticipants([]);
    } else {
      // Select all non-cancelled participants by default
      const nonCancelledParticipants = (bookingData?.participantDetails || [])
        .filter(p => !p.isCancelled)
        .map(p => p._id);
      setSelectedParticipants(nonCancelledParticipants);
    }
  };

  // Handle confirmation
  const handleConfirm = async () => {
    if (cancellationType === 'individual' && selectedParticipants.length === 0) {
      alert('Please select at least one participant to cancel');
      return;
    }

    if (refundType === 'custom' && customRefundAmount <= 0) {
      alert('Please enter a valid custom refund amount');
      return;
    }

    setLoading(true);
    try {
      await onConfirmCancellation({
        bookingId: bookingData._id,
        cancellationType,
        selectedParticipants,
        refundType,
        customRefundAmount: refundType === 'custom' ? customRefundAmount : null,
        cancellationReason,
        totalRefund: calculateTotalRefund()
      });
      onClose();
    } catch (error) {
      console.error('Error during cancellation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch booking data when modal opens
  useEffect(() => {
    const fetchBooking = async () => {
      if (isOpen && bookingId) {
        setFetchingBooking(true);
        try {
          const data = await getBookingById(bookingId);
          console.log('Fetched booking data:', data);
          setBookingData(data);
        } catch (error) {
          console.error('Error fetching booking:', error);
          alert('Failed to fetch booking details.');
          onClose();
        } finally {
          setFetchingBooking(false);
        }
      }
    };

    fetchBooking();
  }, [isOpen, bookingId, onClose]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCancellationType('entire');
      setSelectedParticipants([]);
      setRefundType('auto');
      setCustomRefundAmount(0);
      setCancellationReason('');
    } else {
      // Reset booking data when modal closes
      setBookingData(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Show loading state while fetching booking data
  if (fetchingBooking || !bookingData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Cancel Booking">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading booking details...</span>
        </div>
      </Modal>
    );
  }

  const policy = getCancellationPolicyDescription(bookingData.batch?.startDate);
  const totalRefund = calculateTotalRefund();
  const nonCancelledParticipants = (bookingData.participantDetails || []).filter(p => !p.isCancelled);
  
  // Debug logging
  console.log('CancellationModal Debug:', {
    bookingId: bookingData._id,
    hasParticipantDetails: !!bookingData.participantDetails,
    participantDetailsLength: bookingData.participantDetails?.length || 0,
    participantDetails: bookingData.participantDetails,
    nonCancelledParticipantsLength: nonCancelledParticipants.length,
    nonCancelledParticipants: nonCancelledParticipants,
    cancellationType: cancellationType,
    selectedParticipants: selectedParticipants
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancel Booking">
      <div className="space-y-6">
        {/* Booking Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Booking ID:</span>
              <span className="ml-2 text-gray-900">{bookingData._id}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Trek:</span>
              <span className="ml-2 text-gray-900">{trek?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Batch:</span>
              <span className="ml-2 text-gray-900">
                {bookingData.batch?.startDate ? new Date(bookingData.batch.startDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Total Amount:</span>
              <span className="ml-2 text-gray-900">₹{bookingData.totalPrice}</span>
            </div>
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
            <FaCalculator className="mr-2" />
            Cancellation Policy
          </h3>
          <div className="text-sm">
            <p className={`font-medium ${policy.color}`}>{policy.text}</p>
            <p className="text-gray-600 mt-1">
              Days until trek: {Math.ceil((new Date(bookingData.batch?.startDate) - new Date()) / (1000 * 60 * 60 * 24))}
            </p>
          </div>
        </div>

        {/* Cancellation Type Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Cancellation Type</h3>
          <div className="space-y-3">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="cancellationType"
                value="entire"
                checked={cancellationType === 'entire'}
                onChange={(e) => handleCancellationTypeChange(e.target.value)}
                className="mr-3"
              />
              <div className="flex items-center">
                <FaUsers className="mr-2 text-blue-600" />
                <span className="font-medium">Cancel Entire Booking</span>
              </div>
            </label>
            
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="cancellationType"
                value="individual"
                checked={cancellationType === 'individual'}
                onChange={(e) => handleCancellationTypeChange(e.target.value)}
                className="mr-3"
              />
              <div className="flex items-center">
                <FaUser className="mr-2 text-green-600" />
                <span className="font-medium">Cancel Individual Participants</span>
              </div>
            </label>
          </div>
        </div>

        {/* Participant Selection (for individual cancellation) */}
        {cancellationType === 'individual' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Participants to Cancel</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {nonCancelledParticipants.length > 0 ? (
                nonCancelledParticipants.map((participant) => (
                  <label key={participant._id} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedParticipants.includes(participant._id)}
                      onChange={() => handleParticipantToggle(participant._id)}
                      className="mr-3"
                    />
                    <div>
                      <span className="font-medium">{participant.name || 'Unnamed Participant'}</span>
                      <span className="text-sm text-gray-500 ml-2">({participant.age || 'N/A'} years)</span>
                      {participant.email && (
                        <span className="text-sm text-gray-400 ml-2">({participant.email})</span>
                      )}
                    </div>
                  </label>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No participants available for cancellation</p>
                  <p className="text-sm mt-1">All participants may already be cancelled or no participant details are available.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Refund Type Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Refund Options</h3>
          <div className="space-y-3">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="refundType"
                value="auto"
                checked={refundType === 'auto'}
                onChange={(e) => setRefundType(e.target.value)}
                className="mr-3"
              />
              <div>
                <span className="font-medium">Auto-calculated Refund</span>
                <p className="text-sm text-gray-600">Based on cancellation policy</p>
              </div>
            </label>
            
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="refundType"
                value="custom"
                checked={refundType === 'custom'}
                onChange={(e) => setRefundType(e.target.value)}
                className="mr-3"
              />
              <div>
                <span className="font-medium">Custom Refund Amount</span>
                <p className="text-sm text-gray-600">Enter specific amount</p>
              </div>
            </label>
          </div>
        </div>

        {/* Custom Refund Amount Input */}
        {refundType === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Refund Amount (₹)
            </label>
            <input
              type="number"
              value={customRefundAmount}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                const maxAmount = cancellationType === 'entire' ? 
                  bookingData.totalPrice : 
                  (bookingData.totalPrice / bookingData.participantDetails.length) * selectedParticipants.length;
                
                if (value > maxAmount) {
                  setCustomRefundAmount(maxAmount);
                } else {
                  setCustomRefundAmount(value);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter refund amount"
              min="0"
              max={cancellationType === 'entire' ? 
                bookingData.totalPrice : 
                (bookingData.totalPrice / bookingData.participantDetails.length) * selectedParticipants.length}
            />
            <p className="text-xs text-gray-500 mt-1">
              Max refund: ₹{cancellationType === 'entire' ? 
                bookingData.totalPrice : 
                (bookingData.totalPrice / bookingData.participantDetails.length) * selectedParticipants.length}
            </p>
          </div>
        )}

        {/* Refund Summary */}
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
            <FaRupeeSign className="mr-2" />
            Refund Summary
          </h3>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Cancellation Type:</span>
              <span className="font-medium">
                {cancellationType === 'entire' ? 'Entire Booking' : `${selectedParticipants.length} Participant(s)`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Refund Type:</span>
              <span className="font-medium">
                {refundType === 'auto' ? 'Auto-calculated' : 'Custom Amount'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Policy-based Refund:</span>
              <span className="font-medium text-blue-600">
                ₹{(() => {
                  if (refundType === 'custom') return 'N/A';
                  return calculateRefund(
                    cancellationType === 'entire' ? 
                      bookingData.totalPrice : 
                      (bookingData.totalPrice / bookingData.participantDetails.length) * selectedParticipants.length,
                    bookingData.trek?.batches?.find(b => b._id === bookingData.batch)?.startDate,
                    refundType
                  ).toFixed(2);
                })()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Actual Refund:</span>
              <span className="font-bold text-green-600 text-lg">₹{totalRefund.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Cancellation Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cancellation Reason (Optional)
          </label>
          <textarea
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Enter reason for cancellation..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (cancellationType === 'individual' && selectedParticipants.length === 0)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <FaTimes className="mr-2" />
                Confirm Cancellation
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CancellationModal; 