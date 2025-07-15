import React, { useState } from 'react';
import { updateAdminRemarks } from '../services/api';
import { toast } from 'react-toastify';
import Modal from './Modal';

const RemarksModal = ({ isOpen, onClose, booking, onUpdate }) => {
  const [remarks, setRemarks] = useState(booking?.adminRemarks || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!booking) return;

    setLoading(true);
    try {
      await updateAdminRemarks(booking.bookingId, remarks);
      toast.success('Remarks updated successfully');
      onUpdate(remarks);
      onClose();
    } catch (error) {
      console.error('Error updating remarks:', error);
      toast.error(error.response?.data?.message || 'Failed to update remarks');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRemarks(booking?.adminRemarks || '');
    onClose();
  };

  return (
    <Modal
      title="Edit Admin Remarks"
      isOpen={isOpen}
      onClose={handleClose}
      size="large"
    >
      <div className="space-y-6">
        <div>
          <p className="text-gray-600 mb-4">
            Add or edit remarks for this booking. These remarks are only visible to administrators.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Remarks
              </label>
              <textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter admin remarks for this booking..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
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
                    Saving...
                  </>
                ) : (
                  'Save Remarks'
                )}
              </button>
            </div>
          </form>
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>These remarks are for internal use only and will not be visible to customers.</p>
        </div>
      </div>
    </Modal>
  );
};

export default RemarksModal; 