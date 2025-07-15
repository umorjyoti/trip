import React, { useState, useEffect } from 'react';
import { shiftBookingToBatch, getTrekById } from '../services/api';
import { toast } from 'react-toastify';
import Modal from './Modal';

const ShiftBookingModal = ({ isOpen, onClose, booking, trekId, onUpdate }) => {
  const [availableBatches, setAvailableBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingBatches, setFetchingBatches] = useState(false);

  useEffect(() => {
    if (isOpen && trekId) {
      fetchAvailableBatches();
    }
  }, [isOpen, trekId]);

  const fetchAvailableBatches = async () => {
    setFetchingBatches(true);
    try {
      const trek = await getTrekById(trekId);
      if (trek && trek.batches) {
        // Filter out the current batch and only show future batches
        const currentDate = new Date();
        const availableBatches = trek.batches.filter(batch => {
          const batchStartDate = new Date(batch.startDate);
          return batchStartDate > currentDate && batch._id !== booking?.batch;
        });
        setAvailableBatches(availableBatches);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to fetch available batches');
    } finally {
      setFetchingBatches(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatchId || !booking) return;

    setLoading(true);
    try {
      await shiftBookingToBatch(booking.bookingId, selectedBatchId);
      toast.success('Booking shifted to new batch successfully');
      onUpdate(selectedBatchId);
      onClose();
    } catch (error) {
      console.error('Error shifting booking:', error);
      toast.error(error.response?.data?.message || 'Failed to shift booking');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Modal
      title="Shift Booking to Another Batch"
      isOpen={isOpen}
      onClose={onClose}
      size="large"
    >
      <div className="space-y-6">
        <div>
          <p className="text-gray-600 mb-4">
            Select a new batch to shift this booking. Only future batches with available spots are shown.
          </p>
          
          {fetchingBatches ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <span className="ml-2 text-gray-600">Loading available batches...</span>
            </div>
          ) : availableBatches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No available batches found for this trek.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="batchSelect" className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Batch
                </label>
                <select
                  id="batchSelect"
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                >
                  <option value="">Choose a batch...</option>
                  {availableBatches.map((batch) => (
                    <option key={batch._id} value={batch._id}>
                      {formatDate(batch.startDate)} - {formatDate(batch.endDate)} 
                      (₹{batch.price} - {batch.currentParticipants}/{batch.maxParticipants} participants)
                    </option>
                  ))}
                </select>
              </div>

              {selectedBatchId && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Selected Batch Details</h4>
                  {(() => {
                    const selectedBatch = availableBatches.find(b => b._id === selectedBatchId);
                    if (selectedBatch) {
                      return (
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Dates:</strong> {formatDate(selectedBatch.startDate)} - {formatDate(selectedBatch.endDate)}</p>
                          <p><strong>Price per person:</strong> ₹{selectedBatch.price}</p>
                          <p><strong>Available spots:</strong> {selectedBatch.maxParticipants - selectedBatch.currentParticipants}</p>
                          <p><strong>Current participants:</strong> {selectedBatch.currentParticipants}/{selectedBatch.maxParticipants}</p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

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
                  disabled={loading || !selectedBatchId}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Shifting...
                    </>
                  ) : (
                    'Shift Booking'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ShiftBookingModal; 