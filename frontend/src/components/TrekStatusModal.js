import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import BatchManager from './BatchManager';
import { getTrekByIdForAdmin, toggleTrekStatus } from '../services/api';
import toast from 'react-hot-toast';

function TrekStatusModal({ isOpen, onClose, trek, onToggleStatus, onTrekUpdated }) {
  const [isEnabled, setIsEnabled] = useState(trek?.isEnabled || false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBatchManager, setShowBatchManager] = useState(false);
  const [currentTrek, setCurrentTrek] = useState(trek);

  useEffect(() => {
    if (trek) {
      setIsEnabled(trek.isEnabled || false);
      setError('');
      setShowBatchManager(false);
      setCurrentTrek(trek);
    }
  }, [trek]);

  const handleSubmit = async () => {
    setError('');
    
    // If enabling and no batches, show batch manager
    if (isEnabled && (!currentTrek.batches || currentTrek.batches.length === 0)) {
      setShowBatchManager(true);
      return;
    }
    
    setLoading(true);
    try {
      const updatedTrek = await toggleTrekStatus(currentTrek._id);
      
      // Call the original handler with the response data
      if (onToggleStatus) {
        onToggleStatus(currentTrek._id, updatedTrek);
      }
      
      toast.success(`Trek ${updatedTrek.isEnabled ? 'enabled' : 'disabled'} successfully`);
      onClose();
    } catch (err) {
      console.error('Error updating trek status:', err);
      setError(err.message || 'Failed to update trek status');
      toast.error(err.message || 'Failed to update trek status');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchesUpdated = async () => {
    try {
      // Refresh the trek data
      const updatedTrek = await getTrekByIdForAdmin(currentTrek._id);
      setCurrentTrek(updatedTrek);
      
      // If trek was updated with batches, it should be enabled now
      if (updatedTrek.batches && updatedTrek.batches.length > 0) {
        setIsEnabled(true);
      }
      
      // Call the parent's update handler if provided
      if (onTrekUpdated) {
        onTrekUpdated(currentTrek._id);
      }
    } catch (err) {
      console.error('Error refreshing trek data:', err);
      toast.error('Failed to refresh trek data');
    }
  };

  if (showBatchManager) {
    return (
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={`Manage Batches: ${currentTrek?.name}`}
        size="large"
      >
        <BatchManager 
          trek={currentTrek} 
          onBatchesUpdated={handleBatchesUpdated} 
        />
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setShowBatchManager(false)}
            className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            Back to Status
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            Done
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trek Status">
      {currentTrek && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900">{currentTrek.name}</h3>
            <p className="text-sm text-gray-500">
              Current status: <span className={`font-medium ${currentTrek.isEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {currentTrek.isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </p>
          </div>
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-gray-700">
                {isEnabled ? 'Enable' : 'Disable'} this trek
              </span>
            </label>
          </div>
          
          {currentTrek?.batches && currentTrek.batches.length > 0 ? (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Batches</h4>
              <div className="bg-gray-50 p-3 rounded-md">
                <ul className="divide-y divide-gray-200">
                  {currentTrek.batches.map((batch) => (
                    <li key={batch._id} className="py-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          {new Date(batch.startDate).toLocaleDateString()} - ${batch.price}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          batch.isFull ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {batch.isFull ? 'Full' : `${batch.currentParticipants}/${batch.maxParticipants}`}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchManager(true)}
                className="mt-2 text-sm text-emerald-600 hover:text-emerald-500"
              >
                Manage Batches
              </button>
            </div>
          ) : (
            <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    This trek has no batches. You need to add at least one batch to enable it.
                  </p>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setShowBatchManager(true)}
                      className="text-sm font-medium text-yellow-700 hover:text-yellow-600"
                    >
                      Add Batches
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default TrekStatusModal; 