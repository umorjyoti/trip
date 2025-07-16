import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { deleteTrek, toggleTrekStatus } from '../services/api';
import { toast } from 'react-toastify';
import Modal from './Modal';
import TrekStatusModal from './TrekStatusModal';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function TrekList({ treks, onTrekDeleted, onTrekUpdated, onToggleStatus }) {
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, trekId: null, trekName: '' });
  const [statusModal, setStatusModal] = useState({ isOpen: false, trek: null });

  // Get region name from trek data
  const getRegionName = (trek) => {
    if (trek.regionName) {
      return trek.regionName;
    }
    if (trek.region && typeof trek.region === 'object' && trek.region.name) {
      return trek.region.name;
    }
    return 'Unknown Region';
  };

  const openDeleteModal = (trek) => {
    setDeleteModal({
      isOpen: true,
      trekId: trek._id,
      trekName: trek.name
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      trekId: null,
      trekName: ''
    });
  };

  const confirmDelete = async () => {
    try {
      await deleteTrek(deleteModal.trekId);
      toast.success('Trek deleted successfully');
      if (onTrekDeleted) {
        onTrekDeleted(deleteModal.trekId);
      }
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting trek:', error);
      toast.error('Failed to delete trek');
    }
  };

  const openStatusModal = (trek) => {
    setStatusModal({
      isOpen: true,
      trek
    });
  };

  const closeStatusModal = () => {
    setStatusModal({
      isOpen: false,
      trek: null
    });
  };

  const handleToggleStatus = async (trek) => {
    try {
      const updatedTrek = await toggleTrekStatus(trek._id);
      toast.success(`Trek ${updatedTrek.isEnabled ? 'enabled' : 'disabled'} successfully`);
      if (onTrekUpdated) {
        onTrekUpdated(updatedTrek);
      }
    } catch (error) {
      console.error('Error toggling trek status:', error);
      toast.error('Failed to update trek status');
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

  const getBatchesInfo = (trek) => {
    if (!trek.batches || trek.batches.length === 0) {
      return (
        <div className="text-yellow-600">
          No batches
          {trek.isEnabled && (
            <div className="text-xs text-red-500 mt-1">
              Trek enabled but no batches!
            </div>
          )}
        </div>
      );
    }
    
    const nextBatch = trek.batches.sort((a, b) => 
      new Date(a.startDate) - new Date(b.startDate)
    )[0];
    
    return (
      <div>
        <span className="font-medium">{trek.batches.length}</span> {trek.batches.length === 1 ? 'batch' : 'batches'}
        <div className="text-xs text-gray-500 mt-1">
          Next: {formatDate(nextBatch.startDate)}
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Region
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Difficulty
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Batches
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {treks.map((trek) => (
            <tr key={trek._id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{trek.name}</div>
                <div className="text-sm text-gray-500">{trek.duration} days</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{getRegionName(trek)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  trek.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                  trek.difficulty === 'Moderate' ? 'bg-blue-100 text-blue-800' :
                  trek.difficulty === 'Difficult' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {trek.difficulty}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {getBatchesInfo(trek)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => handleToggleStatus(trek)}
                  className={`p-2 rounded-full ${
                    trek.isEnabled
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                  title={trek.isEnabled ? 'Disable Trek' : 'Enable Trek'}
                >
                  {trek.isEnabled ? <FaEye /> : <FaEyeSlash />}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link
                  to={`/admin/treks/edit/${trek._id}`}
                  className="text-blue-600 hover:text-blue-900 mr-4"
                >
                  Edit
                </Link>
                <button
                  onClick={() => openDeleteModal(trek)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          
          {treks.length === 0 && (
            <tr>
              <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                No treks found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        title="Delete Trek"
        footer={
          <>
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={confirmDelete}
            >
              Delete
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
              Are you sure you want to delete the trek <span className="font-semibold">{deleteModal.trekName}</span>? This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default TrekList; 