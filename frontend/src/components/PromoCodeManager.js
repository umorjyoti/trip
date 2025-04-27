import React, { useState, useEffect } from 'react';
import { getAllPromoCodes, createPromoCode, updatePromoCode, deletePromoCode, getTreks } from '../services/api';
import { toast } from 'react-toastify';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';

function PromoCodeManager() {
  const [promoCodes, setPromoCodes] = useState([]);
  const [treks, setTreks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPromo, setCurrentPromo] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
    minOrderValue: '',
    applicableTreks: [],
    isActive: true
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, promoId: null });

  useEffect(() => {
    fetchPromoCodes();
    fetchTreks();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      const data = await getAllPromoCodes();
      setPromoCodes(data);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast.error('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  const fetchTreks = async () => {
    try {
      const data = await getTreks();
      setTreks(data);
    } catch (error) {
      console.error('Error fetching treks:', error);
      toast.error('Failed to load treks');
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
      code: '',
      discountType: 'percentage',
      discountValue: '',
      maxUses: '',
      validFrom: '',
      validUntil: '',
      minOrderValue: '',
      applicableTreks: [],
      isActive: true
    });
    setEditMode(false);
    setCurrentPromo(null);
  };

  const openCreateForm = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEditForm = (promoCode) => {
    setCurrentPromo(promoCode);
    setFormData({
      code: promoCode.code,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
      maxUses: promoCode.maxUses || '',
      validFrom: new Date(promoCode.validFrom).toISOString().split('T')[0],
      validUntil: new Date(promoCode.validUntil).toISOString().split('T')[0],
      minOrderValue: promoCode.minOrderValue || '',
      applicableTreks: promoCode.applicableTreks.map(trek => trek._id || trek),
      isActive: promoCode.isActive
    });
    setEditMode(true);
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const formattedData = {
        ...formData,
        discountValue: Number(formData.discountValue),
        maxUses: formData.maxUses ? Number(formData.maxUses) : null,
        minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : 0
      };
      
      if (editMode) {
        await updatePromoCode(currentPromo._id, formattedData);
        toast.success('Promo code updated successfully');
      } else {
        await createPromoCode(formattedData);
        toast.success('Promo code created successfully');
      }
      
      fetchPromoCodes();
      setFormOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving promo code:', error);
      toast.error(error.response?.data?.message || 'Failed to save promo code');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (promoId) => {
    const promoCode = promoCodes.find(p => p._id === promoId);
    setDeleteModal({
      isOpen: true,
      promoId,
      promoCode: promoCode?.code
    });
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deletePromoCode(deleteModal.promoId);
      toast.success('Promo code deleted successfully');
      fetchPromoCodes();
      setDeleteModal({ isOpen: false, promoId: null });
    } catch (error) {
      console.error('Error deleting promo code:', error);
      toast.error('Failed to delete promo code');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Promo Codes</h2>
        <button
          onClick={openCreateForm}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          Create Promo Code
        </button>
      </div>
      
      {loading && !formOpen ? (
        <div className="flex justify-center my-8">
          <LoadingSpinner />
        </div>
      ) : promoCodes.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center text-gray-500">
          No promo codes found. Create your first promo code to get started.
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {promoCodes.map(promo => (
              <li key={promo._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-emerald-600 truncate">
                        {promo.code}
                      </p>
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        promo.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {promo.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditForm(promo)}
                        className="text-emerald-600 hover:text-emerald-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(promo._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {promo.discountType === 'percentage' ? `${promo.discountValue}% off` : `$${promo.discountValue} off`}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        {promo.maxUses ? `${promo.usedCount}/${promo.maxUses} uses` : `${promo.usedCount} uses`}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        Valid: {formatDate(promo.validFrom)} - {formatDate(promo.validUntil)}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Create/Edit Form Modal */}
      {formOpen && (
        <Modal
          title={editMode ? 'Edit Promo Code' : 'Create Promo Code'}
          onClose={() => {
            setFormOpen(false);
            resetForm();
          }}
          
        >
          <>
          <form className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Promo Code
              </label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                disabled={editMode}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="SUMMER2023"
              />
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
                  placeholder={formData.discountType === 'percentage' ? '10' : '5.00'}
                  min="0"
                  step={formData.discountType === 'percentage' ? '1' : '0.01'}
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
                <label htmlFor="maxUses" className="block text-sm font-medium text-gray-700">
                  Maximum Uses (leave empty for unlimited)
                </label>
                <input
                  type="number"
                  id="maxUses"
                  name="maxUses"
                  value={formData.maxUses}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="100"
                  min="1"
                />
              </div>
              
              <div>
                <label htmlFor="minOrderValue" className="block text-sm font-medium text-gray-700">
                  Minimum Order Value
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="minOrderValue"
                    name="minOrderValue"
                    value={formData.minOrderValue}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-7 pr-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="validFrom" className="block text-sm font-medium text-gray-700">
                  Valid From
                </label>
                <input
                  type="date"
                  id="validFrom"
                  name="validFrom"
                  value={formData.validFrom}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700">
                  Valid Until
                </label>
                <input
                  type="date"
                  id="validUntil"
                  name="validUntil"
                  value={formData.validUntil}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Applicable Treks (leave empty for all treks)
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
                      {trek.name}
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
                {loading ? 'Saving...' : (editMode ? 'Update' : 'Create')}
              </button>
            </div>
          </>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <Modal
          title="Delete Promo Code"
          onClose={() => setDeleteModal({ isOpen: false, promoId: null })}
          footer={
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, promoId: null })}
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
            Are you sure you want to delete this promo code? This action cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}

export default PromoCodeManager; 