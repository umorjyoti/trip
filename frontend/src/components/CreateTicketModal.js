import React, { useState, useEffect } from 'react';
import { createTicket, createCancellationRequest, getBookingById, getTrekById } from '../services/api';
import { toast } from 'react-toastify';
import Modal from './Modal';
import { FaTag, FaFlag, FaAlignLeft, FaListAlt, FaCalendarAlt } from 'react-icons/fa';
import CustomDropdown from './CustomDropdown';

function CreateTicketModal({ bookingId, onClose, onSuccess }) {
  const [ticketType, setTicketType] = useState('general');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [preferredBatch, setPreferredBatch] = useState('');
  const [availableBatches, setAvailableBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchingBatches, setFetchingBatches] = useState(false);

  // Fetch available batches when reschedule is selected
  useEffect(() => {
    if (ticketType === 'reschedule' && bookingId) {
      fetchAvailableBatches();
    }
  }, [ticketType, bookingId]);

  const fetchAvailableBatches = async () => {
    try {
      setFetchingBatches(true);
      const booking = await getBookingById(bookingId);
      
      if (booking.trek && booking.trek._id) {
        // Fetch the trek with full batch details
        const trek = await getTrekById(booking.trek._id);
        
        if (trek && trek.batches) {
          // Filter out the current batch and full batches
          const currentBatchId = booking.batch?._id || booking.batch;
          const available = trek.batches.filter(batch => {
            const isNotCurrentBatch = batch._id.toString() !== currentBatchId?.toString();
            const hasAvailableSpots = batch.currentParticipants < batch.maxParticipants;
            const isFutureBatch = new Date(batch.startDate) > new Date();
            
            return isNotCurrentBatch && hasAvailableSpots && isFutureBatch;
          });
          
          setAvailableBatches(available);
        }
      }
    } catch (error) {
      console.error('Error fetching available batches:', error);
      toast.error('Failed to fetch available batches');
    } finally {
      setFetchingBatches(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (ticketType === 'general') {
      // Handle regular support ticket
      if (!subject.trim() || !description.trim()) {
        setError('Please fill in all required fields');
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        await createTicket({ bookingId, subject, description, priority });
        toast.success('Support ticket created successfully');
        if (onSuccess) onSuccess();
        onClose();
      } catch (err) {
        setError('Failed to create ticket. Please try again later.');
        toast.error('Failed to create ticket');
      } finally {
        setLoading(false);
      }
    } else {
      // Handle cancellation/reschedule request
      if (!description.trim()) {
        setError('Please provide a reason for your request');
        return;
      }

      if (ticketType === 'reschedule' && !preferredBatch) {
        setError('Please select a preferred batch for rescheduling');
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        await createCancellationRequest(bookingId, {
          requestType: ticketType,
          reason: description,
          preferredBatch: ticketType === 'reschedule' ? preferredBatch : null
        });
        toast.success(`${ticketType === 'cancellation' ? 'Cancellation' : 'Reschedule'} request submitted successfully`);
        if (onSuccess) onSuccess();
        onClose();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to submit request. Please try again later.');
        toast.error(err.response?.data?.message || 'Failed to submit request');
      } finally {
        setLoading(false);
      }
    }
  };

  const getModalTitle = () => {
    switch (ticketType) {
      case 'cancellation':
        return 'Request Cancellation';
      case 'reschedule':
        return 'Request Reschedule';
      default:
        return 'Create Support Ticket';
    }
  };

  const getDescriptionPlaceholder = () => {
    switch (ticketType) {
      case 'cancellation':
        return 'Please provide a detailed reason for your cancellation request...';
      case 'reschedule':
        return 'Please provide a detailed reason for your reschedule request...';
      default:
        return 'Describe your issue in detail';
    }
  };

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

  return (
    <Modal
      title={getModalTitle()}
      isOpen={true}
      onClose={onClose}
      size="default"
    >
      <p className="text-gray-600 mb-6">
        {ticketType === 'general' 
          ? 'Please provide details about your issue and our support team will assist you.'
          : `Please provide details about your ${ticketType} request. Our team will review and respond within 24-48 hours.`
        }
      </p>
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="ticketType" className="block text-sm font-medium text-gray-700 mb-1">
            Request Type <span className="text-red-500">*</span>
          </label>
          <CustomDropdown
            options={[
              { value: 'general', label: 'General Support Ticket' },
              { value: 'cancellation', label: 'Cancellation Request' },
              { value: 'reschedule', label: 'Reschedule Request' }
            ]}
            value={ticketType}
            onChange={(option) => setTicketType(option.value)}
            placeholder="Select request type"
            required
            icon={FaListAlt}
          />
        </div>
        
        {ticketType === 'reschedule' && (
          <div>
            <label htmlFor="preferredBatch" className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Batch <span className="text-red-500">*</span>
            </label>
            {fetchingBatches ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                <div className="flex items-center">
                  <svg className="animate-spin h-4 w-4 text-gray-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading available batches...
                </div>
              </div>
            ) : (
              <CustomDropdown
                options={availableBatches.map((batch) => ({
                  value: batch._id,
                  label: `${formatDate(batch.startDate)} - ${formatDate(batch.endDate)} (${formatCurrency(batch.price)}) - ${batch.currentParticipants}/${batch.maxParticipants} spots available`
                }))}
                value={preferredBatch}
                onChange={(option) => setPreferredBatch(option.value)}
                placeholder="Select a preferred batch"
                required
                icon={FaCalendarAlt}
                disabled={availableBatches.length === 0}
                error={availableBatches.length === 0 && !fetchingBatches ? "No available batches found for rescheduling. Please contact support directly." : null}
              />
            )}
          </div>
        )}
        
        {ticketType === 'general' && (
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaTag className="text-gray-400" />
              </div>
              <input
                type="text"
                id="subject"
                name="subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Subject of your issue"
                required
              />
            </div>
          </div>
        )}
        
        {ticketType === 'general' && (
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <CustomDropdown
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' }
              ]}
              value={priority}
              onChange={(option) => setPriority(option.value)}
              placeholder="Select priority"
              icon={FaFlag}
            />
          </div>
        )}
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            {ticketType === 'general' ? 'Description' : 'Reason'} <span className="text-red-500">*</span>
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute top-3 left-3 flex items-start pointer-events-none">
              <FaAlignLeft className="text-gray-400" />
            </div>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              placeholder={getDescriptionPlaceholder()}
              required
            />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || (ticketType === 'reschedule' && availableBatches.length === 0)}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {ticketType === 'general' ? 'Creating...' : 'Submitting...'}
              </>
            ) : (
              ticketType === 'general' ? 'Create Ticket' : 'Submit Request'
            )}
          </button>
        </div>
      </form>
      <div className="mt-4 text-xs text-gray-500">
        <p>By submitting this form, you agree to our privacy policy and terms of service.</p>
      </div>
    </Modal>
  );
}

export default CreateTicketModal; 