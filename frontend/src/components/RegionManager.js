import React, { useState, useEffect } from 'react';
import { getRegions, createRegion, updateRegion, deleteRegion } from '../services/api';
import { toast } from 'react-toastify';
import Modal from './Modal';
import { useAuth } from '../contexts/AuthContext';

function RegionManager() {
  const { isAdmin } = useAuth();
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, regionId: null, regionName: '' });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin()) {
      setError('You do not have permission to manage regions. Admin privileges required.');
      return;
    }
    
    fetchRegions();
  }, [isAdmin]);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getRegions();
      setRegions(data);
    } catch (err) {
      console.error('Error fetching regions:', err);
      setError('Failed to load regions. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Region name is required');
      return;
    }
    
    try {
      setSubmitLoading(true);
      setError('');
      
      console.log('Submitting region data:', formData);
      
      if (editingId) {
        console.log('Updating region with ID:', editingId);
        const result = await updateRegion(editingId, formData);
        console.log('Update result:', result);
        toast.success('Region updated successfully');
      } else {
        console.log('Creating new region');
        const result = await createRegion(formData);
        console.log('Create result:', result);
        toast.success('Region created successfully');
      }
      
      setFormData({ name: '', description: '' });
      setEditingId(null);
      fetchRegions();
    } catch (err) {
      console.error('Error saving region:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.message || 'Failed to save region';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (region) => {
    setFormData({
      name: region.name,
      description: region.description || ''
    });
    setEditingId(region._id);
  };

  const openDeleteModal = (region) => {
    setDeleteModal({
      isOpen: true,
      regionId: region._id,
      regionName: region.name
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      regionId: null,
      regionName: ''
    });
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await deleteRegion(deleteModal.regionId);
      toast.success('Region deleted successfully');
      fetchRegions();
      closeDeleteModal();
    } catch (err) {
      console.error('Error deleting region:', err);
      toast.error('Failed to delete region');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '' });
    setEditingId(null);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Manage Regions</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Region Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              disabled={submitLoading}
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              disabled={submitLoading}
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            disabled={submitLoading}
          >
            {submitLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              editingId ? 'Update Region' : 'Add Region'
            )}
          </button>
          
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="ml-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={submitLoading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {regions.map(region => (
              <tr key={region._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{region.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{region.description || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(region)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteModal(region)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            
            {regions.length === 0 && (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                  No regions found. Add your first region above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        title="Delete Region"
        actions={
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
              Are you sure you want to delete the region <span className="font-semibold">{deleteModal.regionName}</span>? This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default RegionManager; 