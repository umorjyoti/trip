import React, { useState, useEffect } from 'react';
import { getAllOffers, createOffer, updateOffer, deleteOffer, getTreks } from '../services/api';
import { toast } from 'react-toastify';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';

function OfferManager() {
  const [offers, setOffers] = useState([]);
  const [treks, setTreks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    startDate: '',
    endDate: '',
    applicableTreks: [],
    isActive: true
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, offerId: null });

  useEffect(() => {
    fetchOffers();
    fetchTreks();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const data = await getAllOffers();
      setOffers(data);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const fetchTreks = async () => {
    try {
      setLoading(true);
      const data = await getTreks();
      console.log('Treks data received:', data);
      
      // Ensure data is an array before using filter
      const treksArray = Array.isArray(data) ? data : 
                        (data && Array.isArray(data.treks)) ? data.treks : [];
      
      // Now it's safe to use filter
      const enabledTreks = treksArray.filter(trek => trek.isEnabled);
      setTreks(enabledTreks);
    } catch (error) {
      console.error('Error fetching treks:', error);
      toast.error('Failed to load treks');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTrekCheckboxChange = (trekId) => {
    setFormData(prev => {
      const currentTreks = [...prev.applicableTreks];
      if (currentTreks.includes(trekId)) {
        return {
          ...prev,
          applicableTreks: currentTreks.filter(id => id !== trekId)
        };
      } else {
        return {
          ...prev,
          applicableTreks: [...currentTreks, trekId]
        };
      }
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      startDate: '',
      endDate: '',
      applicableTreks: [],
      isActive: true
    });
    setEditMode(false);
    setCurrentOffer(null);
  };

  const openCreateForm = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEditForm = (offer) => {
    setCurrentOffer(offer);
    setFormData({
      name: offer.name,
      description: offer.description,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      startDate: new Date(offer.startDate).toISOString().split('T')[0],
      endDate: new Date(offer.endDate).toISOString().split('T')[0],
      applicableTreks: offer.applicableTreks.map(trek => trek._id || trek),
      isActive: offer.isActive
    });
    setEditMode(true);
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.applicableTreks.length === 0) {
      toast.error('Please select at least one trek');
      return;
    }
    
    try {
      setLoading(true);
      
      const formattedData = {
        ...formData,
        discountValue: Number(formData.discountValue)
      };
      
      if (editMode) {
        await updateOffer(currentOffer._id, formattedData);
        toast.success('Offer updated successfully');
      } else {
        await createOffer(formattedData);
        toast.success('Offer created successfully');
      }
      
      fetchOffers();
      setFormOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error(error.response?.data?.message || 'Failed to save offer');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (offerId) => {
    const offer = offers.find(o => o._id === offerId);
    setDeleteModal({
      isOpen: true,
      offerId,
      offerName: offer.name
    });
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteOffer(deleteModal.offerId);
      toast.success('Offer deleted successfully');
      fetchOffers();
      setDeleteModal({ isOpen: false, offerId: null });
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('Failed to delete offer');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const calculateDiscountedPrice = (originalPrice, offer) => {
    if (offer.discountType === 'percentage') {
      return originalPrice - (originalPrice * offer.discountValue / 100);
    } else {
      return Math.max(0, originalPrice - offer.discountValue);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Limited-Time Offers</h2>
        <button
          onClick={openCreateForm}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          Create New Offer
        </button>
      </div>

      {loading && <LoadingSpinner />}

      {!loading && offers.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">No offers found. Create your first offer!</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {offers.map(offer => (
              <li key={offer._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-4 w-4 rounded-full ${offer.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <p className="ml-2 text-sm font-medium text-gray-900">{offer.name}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditForm(offer)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-emerald-700 bg-emerald-100 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(offer._id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {offer.description}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <span>
                        {formatDate(offer.startDate)} - {formatDate(offer.endDate)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Discount: {offer.discountType === 'percentage' ? `${offer.discountValue}%` : `$${offer.discountValue.toFixed(2)}`}
                    </p>
                    <div className="mt-1">
                      <p className="text-xs text-gray-500">Applied to:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {offer.applicableTreks.map(trek => (
                          <span key={trek._id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {trek.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Create/Edit Offer Modal */}
      {formOpen && (
        <Modal
          title={editMode ? 'Edit Offer' : 'Create New Offer'}
          onClose={() => {
            setFormOpen(false);
            resetForm();
          }}
          footer={
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          }
        >
          <>
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Offer Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Summer Sale"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="2"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Limited time summer discount on selected treks"
                required
              ></textarea>
            </div>
            
            <div>
              <label htmlFor="discountType" className="block text-sm font-medium text-gray-700">
                Discount Type
              </label>
              <select
                id="discountType"
                name="discountType"
                value={formData.discountType}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700">
                Discount Value
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                {formData.discountType === 'fixed' && (
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                )}
                <input
                  type="number"
                  id="discountValue"
                  name="discountValue"
                  value={formData.discountValue}
                  onChange={handleInputChange}
                  className={`block w-full border border-gray-300 rounded-md shadow-sm py-2 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm ${
                    formData.discountType === 'fixed' ? 'pl-7' : 'px-3'
                  }`}
                  placeholder={formData.discountType === 'percentage' ? '15' : '50.00'}
                  min="0"
                  step={formData.discountType === 'percentage' ? '1' : '0.01'}
                  required
                />
                {formData.discountType === 'percentage' && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">%</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Applicable Treks (select at least one)
              </label>
              <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2">
                {treks.map(trek => (
                  <div key={trek._id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`trek-${trek._id}`}
                      checked={formData.applicableTreks.includes(trek._id)}
                      onChange={() => handleTrekCheckboxChange(trek._id)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`trek-${trek._id}`} className="ml-2 block text-sm text-gray-900">
                      {trek.name} {trek.price !== undefined ? `- $${Number(trek.price).toFixed(2)}` : ''}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>
          </form>
          <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
            </>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <Modal
          title="Delete Offer"
          onClose={() => setDeleteModal({ isOpen: false, offerId: null })}
          footer={
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, offerId: null })}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          }
        >
          <p className="text-sm text-gray-500">
            Are you sure you want to delete the offer "{deleteModal.offerName}"? This action cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}

export default OfferManager; 