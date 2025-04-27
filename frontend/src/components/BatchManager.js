import React, { useState } from 'react';
import { addBatch, removeBatch } from '../services/api';
import toast from 'react-hot-toast';
import Modal from './Modal';
import { Link } from 'react-router-dom';

function BatchManager({ trek, onBatchesUpdated }) {
  const [newBatch, setNewBatch] = useState({
    startDate: '',
    endDate: '',
    price: '',
    maxParticipants: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ 
    isOpen: false, 
    batchId: null, 
    startDate: '' 
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBatch(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate inputs
    if (!newBatch.startDate || !newBatch.price) {
      setError('Start date and price are required');
      return;
    }
    
    if (newBatch.endDate && new Date(newBatch.endDate) <= new Date(newBatch.startDate)) {
      setError('End date must be after start date');
      return;
    }
    
    setLoading(true);
    try {
      await addBatch(trek._id, newBatch);
      toast.success('Batch added successfully');
      
      // Reset form
      setNewBatch({
        startDate: '',
        endDate: '',
        price: '',
        maxParticipants: 10
      });
      
      // Refresh trek data
      if (onBatchesUpdated) {
        onBatchesUpdated();
      }
    } catch (err) {
      console.error('Error adding batch:', err);
      setError(err.response?.data?.message || 'Failed to add batch');
      toast.error('Failed to add batch');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (batch) => {
    setDeleteModal({
      isOpen: true,
      batchId: batch._id,
      startDate: formatDate(batch.startDate)
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      batchId: null,
      startDate: ''
    });
  };

  const confirmDelete = async () => {
    try {
      await removeBatch(trek._id, deleteModal.batchId);
      toast.success('Batch removed successfully');
      
      // Refresh trek data
      if (onBatchesUpdated) {
        onBatchesUpdated();
      }
      closeDeleteModal();
    } catch (error) {
      console.error('Error removing batch:', error);
      toast.error('Failed to remove batch');
    }
  };

  const handleRemoveBatch = (batchId) => {
    const batch = trek.batches.find(b => b._id === batchId);
    if (batch) {
      openDeleteModal(batch);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="px-4 py-2">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Manage Batches</h2>
      
      {/* Add Batch Form */}
      <form onSubmit={handleAddBatch}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              name="startDate"
              id="startDate"
              value={newBatch.startDate}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date (Optional)
            </label>
            <input
              type="date"
              name="endDate"
              id="endDate"
              value={newBatch.endDate}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price (INR) *
            </label>
            <input
              type="number"
              name="price"
              id="price"
              value={newBatch.price}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-1">
              Max Participants
            </label>
            <input
              type="number"
              name="maxParticipants"
              id="maxParticipants"
              value={newBatch.maxParticipants}
              onChange={handleInputChange}
              min="1"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Batch'}
        </button>
      </form>

      {/* Batches List */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Current Batches</h3>
        
        {trek.batches && trek.batches.length > 0 ? (
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participants
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trek.batches.map((batch) => (
                  <tr key={batch._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(batch.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {batch.endDate ? formatDate(batch.endDate) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{batch.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {batch.currentParticipants} / {batch.maxParticipants}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/admin/treks/${trek._id}/batches/${batch._id}/performance`}
                          className="text-emerald-600 hover:text-emerald-900"
                        >
                          View Performance
                        </Link>
                        <button
                          onClick={() => handleRemoveBatch(batch._id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 border border-gray-200 rounded-md">
            No batches available. Add a batch to enable this trek.
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        title="Remove Batch"
        footer={
          <>
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={confirmDelete}
            >
              Remove
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={closeDeleteModal}
            >
              Cancel
            </button>
          </>
        }
      >
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <p className="text-sm text-gray-500">
              Are you sure you want to remove the batch starting on <span className="font-semibold">{deleteModal.startDate}</span>? This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default BatchManager; 