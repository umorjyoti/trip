import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBlogRegion, updateBlogRegion, getBlogRegionById } from '../services/api';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaSave, FaTimes, FaGlobe, FaImage, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';
import ImageUploader from './ImageUploader';

function BlogRegionForm({ region, onSave, isEditing = false }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    isEnabled: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (region) {
      setFormData({
        name: region.name || '',
        description: region.description || '',
        image: region.image || '',
        isEnabled: region.isEnabled !== undefined ? region.isEnabled : true
      });
    }
  }, [region]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (urls) => {
    if (urls.length > 0) {
      setFormData(prev => ({ ...prev, image: urls[0] }));
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: '' }));
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Region name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Region name must be at least 2 characters long';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
    }
    
    if (!formData.image.trim()) {
      newErrors.image = 'Image is required';
    } else if (!/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(formData.image)) {
      newErrors.image = 'Please provide a valid image URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    try {
      setLoading(true);
      
      const regionData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        image: formData.image.trim(),
        isEnabled: formData.isEnabled
      };
      
      let response;
      if (isEditing) {
        response = await updateBlogRegion(region._id, regionData);
        toast.success('Blog region updated successfully');
      } else {
        response = await createBlogRegion(regionData);
        toast.success('Blog region created successfully');
      }
      
      if (onSave) {
        onSave(response);
      } else {
        navigate('/admin/blogs');
      }
    } catch (error) {
      console.error('Error saving blog region:', error);
      toast.error(error.response?.data?.message || 'Failed to save blog region');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Form Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <FaGlobe className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Blog Region' : 'Create New Blog Region'}
            </h2>
            <p className="text-gray-600 mt-1">
              {isEditing 
                ? 'Update the details of your blog region' 
                : 'Add a new region to help categorize your blog content'
              }
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-8">
        {/* Region Name */}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-base font-semibold text-gray-900">
            Region Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`block w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-base ${
                errors.name 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              placeholder="e.g., Himachal Pradesh, Ladakh, Uttarakhand"
            />
            {errors.name && (
              <div className="mt-2 flex items-center text-sm text-red-600">
                <FaTimes className="mr-1 h-4 w-4" />
                {errors.name}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Choose a descriptive name that users will easily recognize and associate with the region.
          </p>
        </div>
        
        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-base font-semibold text-gray-900">
            Description <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className={`block w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-base resize-none ${
                errors.description 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              placeholder="Describe what makes this region special for blog content. Include key attractions, culture, and what travelers can expect..."
            />
            {errors.description && (
              <div className="mt-2 flex items-center text-sm text-red-600">
                <FaTimes className="mr-1 h-4 w-4" />
                {errors.description}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Write a compelling description that highlights the unique aspects of this region and what makes it special for travelers.
          </p>
        </div>
        
        {/* Image */}
        <div className="space-y-2">
          <label className="block text-base font-semibold text-gray-900">
            Region Image <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-lg">
              <FaImage className="mr-2 h-4 w-4 text-gray-400" />
              Upload a high-quality image that represents this region for blog categorization
            </div>
            <ImageUploader
              images={formData.image ? [formData.image] : []}
              onChange={handleImageChange}
              maxImages={1}
            />
            {errors.image && (
              <div className="flex items-center text-sm text-red-600">
                <FaTimes className="mr-1 h-4 w-4" />
                {errors.image}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Choose an image that captures the essence of the region and will look great in blog listings.
          </p>
        </div>
        
        {/* Enabled Status */}
        <div className="space-y-3">
          <label className="block text-base font-semibold text-gray-900">
            Region Status
          </label>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <input
              id="isEnabled"
              name="isEnabled"
              type="checkbox"
              checked={formData.isEnabled}
              onChange={handleChange}
              className="h-5 w-5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded transition-all duration-200"
            />
            <div className="ml-3">
              <label htmlFor="isEnabled" className="text-base font-medium text-gray-900">
                Enable this region for blog categorization
              </label>
              <p className="text-sm text-gray-600 mt-1">
                {formData.isEnabled 
                  ? 'This region will be available for blog categorization and visible to users.'
                  : 'This region will be hidden from users and unavailable for blog categorization.'
                }
              </p>
            </div>
            <div className="ml-auto">
              {formData.isEnabled ? (
                <FaToggleOn className="h-6 w-6 text-emerald-600" />
              ) : (
                <FaToggleOff className="h-6 w-6 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Submit Buttons */}
      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-8 border-t border-gray-200">
        <button
          type="button"
          onClick={() => navigate('/admin/blogs')}
          className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
        >
          <FaTimes className="mr-2 h-4 w-4" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Saving...</span>
            </>
          ) : (
            <>
              <FaSave className="mr-2 h-4 w-4" />
              {isEditing ? 'Update Region' : 'Create Region'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default BlogRegionForm; 