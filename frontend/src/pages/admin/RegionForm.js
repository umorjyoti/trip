import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createRegion, updateRegion, getRegionById } from '../../services/api';

const RegionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    status: 'active'
  });

  useEffect(() => {
    if (id) {
      fetchRegion();
    }
  }, [id]);

  const fetchRegion = async () => {
    try {
      setLoading(true);
      const region = await getRegionById(id);
      setFormData(region);
    } catch (err) {
      setError('Failed to fetch region details');
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
    try {
      setLoading(true);
      if (id) {
        await updateRegion(id, formData);
      } else {
        await createRegion(formData);
      }
      navigate('/admin/regions');
    } catch (err) {
      setError('Failed to save region');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {id ? 'Edit Region' : 'Create New Region'}
      </h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Image URL</label>
          <input
            type="text"
            name="image"
            value={formData.image}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/regions')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            {id ? 'Update' : 'Create'} Region
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegionForm; 