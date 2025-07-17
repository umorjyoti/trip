import React, { useState, useEffect } from 'react';
import { updateCancellationRequest, adminCancelBooking, calculateRefund } from '../services/api';
import { toast } from 'react-toastify';
import Modal from './Modal';
import { FaCheck, FaTimes, FaComment, FaCalculator, FaUser, FaUsers, FaRupeeSign } from 'react-icons/fa';

function RequestResponseModal({ isOpen, onClose, booking, onSuccess }) {
  const [status, setStatus] = useState('approved');
  const [adminResponse, setAdminResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Cancellation form state
  const [cancellationType, setCancellationType] = useState('entire');
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [refundType, setRefundType] = useState('auto');
  const [customRefundAmount, setCustomRefundAmount] = useState(0);
  const [cancellationReason, setCancellationReason] = useState('');
  const [refundCalculation, setRefundCalculation] = useState({
    totalRefund: 0,
    policyDescription: '',
    policyColor: '',
    daysUntilTrek: 0
  });

  // Calculate refund using backend API
  const calculateTotalRefund = async () => {
    if (!booking) return 0;
    
    try {
      const response = await calculateRefund({
        bookingId: booking._id,
        cancellationType,
        selectedParticipants,
        refundType,
        customRefundAmount: refundType === 'custom' ? customRefundAmount : null
      });
      
      setRefundCalculation(response);
      return response.totalRefund;
    } catch (error) {
      console.error('Error calculating refund:', error);
      return 0;
    }
  };

  // Update refund calculation when form fields change
  useEffect(() => {
    if (status === 'approved' && booking?.cancellationRequest?.type === 'cancellation') {
      calculateTotalRefund();
    }
  }, [cancellationType, selectedParticipants, refundType, customRefundAmount, status]);

  // Handle cancellation type change
  const handleCancellationTypeChange = (type) => {
    setCancellationType(type);
    if (type === 'entire') {
      setSelectedParticipants([]);
    } else {
      // Select all non-cancelled participants by default
      const nonCancelledParticipants = booking?.participantDetails
        .filter(p => !p.isCancelled)
        .map(p => p._id);
      setSelectedParticipants(nonCancelledParticipants);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // If approving a cancellation request, use the admin cancel booking API
      if (status === 'approved' && booking.cancellationRequest.type === 'cancellation') {
        // Validate cancellation form
        if (cancellationType === 'individual' && selectedParticipants.length === 0) {
          setError('Please select at least one participant to cancel');
          return;
        }

        if (refundType === 'custom' && customRefundAmount <= 0) {
          setError('Please enter a valid custom refund amount');
          return;
        }

        // Call admin cancel booking API
        await adminCancelBooking({
          bookingId: booking._id,
          cancellationType,
          selectedParticipants,
          refundType,
          customRefundAmount: refundType === 'custom' ? customRefundAmount : null,
          cancellationReason: cancellationReason || booking.cancellationRequest.reason || 'Admin approved cancellation request',
          totalRefund: refundCalculation.totalRefund
        });

        // Update the cancellation request status
        await updateCancellationRequest(booking._id, {
          status: 'approved',
          adminResponse: adminResponse.trim() || 'Cancellation approved and processed'
        });

        toast.success('Cancellation request approved and booking cancelled successfully');
      } else {
        // For reschedule requests or rejections, use the normal flow
        const response = await updateCancellationRequest(booking._id, {
          status,
          adminResponse: adminResponse.trim()
        });
        
        toast.success(response.message || `Request ${status} successfully`);
      }
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update request. Please try again.');
      toast.error(err.response?.data?.message || 'Failed to update request');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStatus('approved');
      setAdminResponse('');
      setCancellationType('entire');
      setSelectedParticipants([]);
      setRefundType('auto');
      setCustomRefundAmount(0);
      setCancellationReason('');
      setError(null);
      setRefundCalculation({
        totalRefund: 0,
        policyDescription: '',
        policyColor: '',
        daysUntilTrek: 0
      });
    }
  }, [isOpen]);

  // Early return if no booking or cancellation request
  if (!booking || !booking.cancellationRequest) {
    return null;
  }

  const request = booking.cancellationRequest;

  return (
    <Modal
      title={`Respond to ${request.type} Request`}
      isOpen={isOpen}
      onClose={onClose}
      size="large"
    >
      <div className="space-y-6">
        {/* Request Details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Request Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Type:</span>
              <span className="capitalize">{request.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                request.status === 'approved' ? 'bg-green-100 text-green-800' :
                request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {request.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Requested:</span>
              <span>{formatDate(request.requestedAt)}</span>
            </div>
            {request.reason && (
              <div>
                <span className="font-medium">Reason:</span>
                <p className="mt-1 text-gray-600">{request.reason}</p>
              </div>
            )}
            {request.type === 'reschedule' && request.preferredBatch && (
              <div>
                <span className="font-medium">Preferred Batch:</span>
                <p className="mt-1 text-gray-600">
                  {(() => {
                    // Find the preferred batch from trek batches
                    if (booking.trek && booking.trek.batches) {
                      const preferredBatch = booking.trek.batches.find(
                        batch => batch._id.toString() === request.preferredBatch.toString()
                      );
                      if (preferredBatch) {
                        return `${formatDate(preferredBatch.startDate)} - ${formatDate(preferredBatch.endDate)} (₹${preferredBatch.price})`;
                      }
                    }
                    return 'Batch details not available';
                  })()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Response Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Decision <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-md shadow-sm">
              <select
                id="status"
                name="status"
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                required
              >
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="adminResponse" className="block text-sm font-medium text-gray-700 mb-1">
              Response Message
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                <FaComment className="text-gray-400" />
              </div>
              <textarea
                id="adminResponse"
                name="adminResponse"
                value={adminResponse}
                onChange={e => setAdminResponse(e.target.value)}
                rows={4}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                placeholder={`Provide a response to the ${request.type} request...`}
              />
            </div>
          </div>

          {/* Cancellation Form - Show only when approving cancellation request */}
          {status === 'approved' && request.type === 'cancellation' && (
            <div className="space-y-6 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900">Cancellation Details</h3>
              
              {/* Booking Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-2">Booking Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Booking ID:</span>
                    <span className="ml-2 text-gray-900">{booking._id}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Trek:</span>
                    <span className="ml-2 text-gray-900">{booking.trek?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Batch:</span>
                    <span className="ml-2 text-gray-900">
                      {booking.batch?.startDate ? new Date(booking.batch.startDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Total Amount:</span>
                    <span className="ml-2 text-gray-900">₹{booking.totalPrice}</span>
                  </div>
                </div>
              </div>

              {/* Cancellation Policy */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-2 flex items-center">
                  <FaCalculator className="mr-2" />
                  Cancellation Policy
                </h4>
                <div className="text-sm">
                  <p className={`font-medium ${refundCalculation.policyColor}`}>
                    {refundCalculation.policyDescription || 'Calculating...'}
                  </p>
                  <p className="text-gray-600 mt-1">
                    Days until trek: {refundCalculation.daysUntilTrek}
                  </p>
                </div>
              </div>

              {/* Cancellation Type Selection */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Cancellation Type</h4>
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
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Select Participants to Cancel</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {booking.participantDetails
                      .filter(p => !p.isCancelled)
                      .map((participant, index) => (
                        <label key={participant._id} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={selectedParticipants.includes(participant._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedParticipants([...selectedParticipants, participant._id]);
                              } else {
                                setSelectedParticipants(selectedParticipants.filter(id => id !== participant._id));
                              }
                            }}
                            className="mr-3"
                          />
                          <span className="text-sm">
                            {participant.name} (Age: {participant.age}, Gender: {participant.gender})
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              )}

              {/* Refund Type Selection */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Refund Type</h4>
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
                    <div className="flex items-center">
                      <FaCalculator className="mr-2 text-blue-600" />
                      <span className="font-medium">Auto-calculated (based on policy)</span>
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
                    <div className="flex items-center">
                      <FaRupeeSign className="mr-2 text-green-600" />
                      <span className="font-medium">Custom amount</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Custom Refund Amount */}
              {refundType === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Refund Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={customRefundAmount}
                    onChange={(e) => setCustomRefundAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter refund amount"
                    min="0"
                    max={booking.totalPrice}
                  />
                </div>
              )}

              {/* Total Refund Display */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Refund:</span>
                  <span className="text-lg font-bold text-green-600">₹{refundCalculation.totalRefund}</span>
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
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 flex items-center ${
                status === 'approved' 
                  ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                  : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              }`}
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
                <>
                  {status === 'approved' ? (
                    <>
                      <FaCheck className="mr-2 h-4 w-4" />
                      {request.type === 'cancellation' ? 'Approve & Cancel Booking' : 'Approve'}
                    </>
                  ) : (
                    <>
                      <FaTimes className="mr-2 h-4 w-4" />
                      Reject
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default RequestResponseModal; 