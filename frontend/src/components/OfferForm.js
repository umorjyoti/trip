import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOfferById, updateOffer, createOffer, getAllTreks } from '../services/api';
import { toast } from 'react-toastify';
import { FaSave, FaTimes } from 'react-icons/fa';

function OfferForm({ offer: initialOffer, isEdit = false, onSuccess, onCancel }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [treks, setTreks] = useState([]);
  const [offer, setOffer] = useState(initialOffer || {
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    startDate: '',
    endDate: '',
    applicableTreks: [],
    isActive: true
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all treks for selection
        const treksData = await getAllTreks();
        setTreks(treksData);

        // If editing, fetch the offer details
        if (isEdit && id) {
          const offerData = await getOfferById(id);
          setOffer(offerData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOffer(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTrekSelection = (e) => {
    const selectedTrekIds = Array.from(e.target.selectedOptions, option => option.value);
    setOffer(prev => ({
      ...prev,
      applicableTreks: selectedTrekIds
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await updateOffer(id, offer);
        toast.success('Offer updated successfully');
      } else {
        await createOffer(offer);
        toast.success('Offer created successfully');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/admin/offers');
      }
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Failed to save offer');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !offer.name) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Offer' : 'Create New Offer'}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Offer Name */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Offer Name *
            </label>
            <input
              type="text"
              name="name"
              value={offer.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          {/* Description */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={offer.description || ''}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            ></textarea>
          </div>
          
          {/* Discount Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Type *
            </label>
            <select
              name="discountType"
              value={offer.discountType}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          
          {/* Discount Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Value *
            </label>
            <input
              type="number"
              name="discountValue"
              value={offer.discountValue}
              onChange={handleChange}
              min="0"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              name="startDate"
              value={offer.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : ''}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              type="date"
              name="endDate"
              value={offer.endDate ? new Date(offer.endDate).toISOString().split('T')[0] : ''}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          {/* Is Active */}
          <div className="col-span-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={offer.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Active
              </label>
            </div>
          </div>
          
          {/* Applicable Treks */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Applicable Treks *
</label>
            <select
              multiple
              name="applicableTreks"
              value={Array.isArray(offer.applicableTreks) 
                ? offer.applicableTreks.map(trek => typeof trek === 'object' ? trek._id : trek)
                : []}
              onChange={handleTrekSelection}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 h-48"
            >
              {treks.map(trek => (
                <option key={trek._id} value={trek._id}>
                  {trek.name} - {trek.region}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">Hold Ctrl (or Cmd) to select multiple treks</p>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel || (() => navigate('/admin/offers'))}
            className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center"
          >
            <FaTimes className="mr-2" />
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                Save Offer
              </>
            )}
          </button>
        </div>
      </form>
</div> 
  );
}

export default OfferForm; 