import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRegion, updateRegion, getRegions } from '../services/api';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaYoutube } from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';
import ImageUploader from './ImageUploader';
import SingleImageUploader from './SingleImageUploader';

function RegionForm({ region, onSave, isEditing = false }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    coverImage: '',
    images: [''],
    videos: [''],
    bestSeason: '',
    avgTrekDuration: 0,
    relatedRegions: [],
    isActive: true,
    trekSectionTitle: '',
    welcomeMessage: '',
    detailedDescription: '',
    descriptionImages: ['']
  });
  const [loading, setLoading] = useState(false);
  const [allRegions, setAllRegions] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Fetch all regions for the related regions dropdown
    const fetchRegions = async () => {
      try {
        const regions = await getRegions();
        setAllRegions(regions);
      } catch (error) {
        console.error('Error fetching regions:', error);
        toast.error('Failed to load regions');
      }
    };

    fetchRegions();

    // If editing, populate form with region data
    if (isEditing && region) {
      console.log('Populating form with region data:', region);
      setFormData({
        name: region.name || '',
        description: region.description || '',
        location: region.location || '',
        coverImage: region.coverImage || '',
        images: region.images?.length ? region.images : [''],
        videos: region.videos?.length ? region.videos : [''],
        bestSeason: region.bestSeason || '',
        avgTrekDuration: region.avgTrekDuration || 0,
        relatedRegions: region.relatedRegions?.map(r => typeof r === 'object' ? r._id : r) || [],
        isActive: region.isEnabled !== undefined ? region.isEnabled : true,
        trekSectionTitle: region.trekSectionTitle || '',
        welcomeMessage: region.welcomeMessage || '',
        detailedDescription: region.detailedDescription || '',
        descriptionImages: region.descriptionImages || ['']
      });
    }
  }, [isEditing, region]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    // Make cover image optional for now to test form submission
    // if (!formData.coverImage || !formData.coverImage.trim()) {
    //   newErrors.coverImage = 'Cover image is required';
    // }
    if (!formData.bestSeason.trim()) newErrors.bestSeason = 'Best season is required';
    if (!formData.avgTrekDuration || formData.avgTrekDuration <= 0) {
      newErrors.avgTrekDuration = 'Average trek duration must be greater than 0';
    }
    
    // Filter out empty image and video URLs
    const filteredImages = formData.images.filter(img => img.trim());
    // Make images optional since we now have coverImage
    // if (filteredImages.length === 0) {
    //   newErrors.images = 'At least one image is required';
    // }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const addImageField = () => {
    setFormData(prev => ({ ...prev, images: [...prev.images, ''] }));
  };

  const removeImageField = (index) => {
    if (formData.images.length <= 1) return;
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleVideoChange = (index, value) => {
    const newVideos = [...formData.videos];
    newVideos[index] = value;
    setFormData(prev => ({ ...prev, videos: newVideos }));
  };

  const addVideoField = () => {
    setFormData(prev => ({ ...prev, videos: [...prev.videos, ''] }));
  };

  const removeVideoField = (index) => {
    if (formData.videos.length <= 1) return;
    const newVideos = formData.videos.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, videos: newVideos }));
  };

  const handleRelatedRegionsChange = (e) => {
    const options = e.target.options;
    const selectedValues = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    setFormData(prev => ({ ...prev, relatedRegions: selectedValues }));
  };

  const handleArrayChange = (field, values) => {
    setFormData(prev => ({
      ...prev,
      [field]: values
    }));
  };

  const extractYouTubeId = (url) => {
    if (!url) return '';
    
    // Handle different YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : url;
  };

  const optimizeImageUrls = (urls) => {
    return urls.map(url => {
      // If it's already a small URL or not a URL at all, return as is
      if (!url || url.length < 1000 || !url.startsWith('http')) {
        return url;
      }
      
      // For very long data URLs, we should implement proper image upload
      // For now, just truncate to avoid the payload size issue
      if (url.length > 10000) {
        console.warn('Image URL is too large, consider implementing proper image upload');
        // Return the URL as is, but in a real app, you'd want to implement proper image upload
        return url;
      }
      
      return url;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent double submission
    if (loading) {
      return;
    }
    
    // Validate form
    if (!validate()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Create a clean copy of the data with proper formatting
      const cleanedData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        coverImage: formData.coverImage ? formData.coverImage.trim() : '',
        bestSeason: formData.bestSeason.trim(),
        avgTrekDuration: Number(formData.avgTrekDuration),
        
        // Handle arrays properly
        images: optimizeImageUrls(formData.images.filter(img => img.trim() !== '')),
        descriptionImages: optimizeImageUrls(formData.descriptionImages.filter(img => img.trim() !== '')),
        videos: formData.videos.filter(video => video.trim() !== ''),
        relatedRegions: formData.relatedRegions,
        
        // Handle the special fields
        isEnabled: formData.isActive, // Map isActive to isEnabled for API compatibility
        trekSectionTitle: formData.trekSectionTitle?.trim() || '',
        welcomeMessage: formData.welcomeMessage?.trim() || '',
        detailedDescription: formData.detailedDescription?.trim() || ''
      };
      
      if (onSave) {
        onSave(cleanedData);
      } else {
        // Fallback if no onSave callback provided
        let response;
        if (isEditing) {
          response = await updateRegion(region._id, cleanedData);
          toast.success('Region updated successfully');
        } else {
          response = await createRegion(cleanedData);
          toast.success('Region created successfully');
        }
        navigate('/admin/regions');
      }
    } catch (error) {
      console.error('Error saving region:', error);
      toast.error(error.response?.data?.message || 'Failed to save region');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {isEditing ? 'Edit Region' : 'Add New Region'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Region Name*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm ${
                  errors.name ? 'border-red-300' : ''
                }`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description*
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm ${
                  errors.description ? 'border-red-300' : ''
                }`}
                placeholder="Enter a brief description of the region..."
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location*
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm ${
                  errors.location ? 'border-red-300' : ''
                }`}
                placeholder="e.g., Himachal Pradesh, India"
              />
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
            </div>
            
            <div>
              <label htmlFor="bestSeason" className="block text-sm font-medium text-gray-700">
                Best Season*
              </label>
              <input
                type="text"
                id="bestSeason"
                name="bestSeason"
                value={formData.bestSeason}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm ${
                  errors.bestSeason ? 'border-red-300' : ''
                }`}
                placeholder="e.g., May to October"
              />
              {errors.bestSeason && <p className="mt-1 text-sm text-red-600">{errors.bestSeason}</p>}
            </div>
            
            <div>
              <label htmlFor="avgTrekDuration" className="block text-sm font-medium text-gray-700">
                Average Trek Duration (days)*
              </label>
              <input
                type="number"
                id="avgTrekDuration"
                name="avgTrekDuration"
                value={formData.avgTrekDuration}
                onChange={handleChange}
                min="1"
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm ${
                  errors.avgTrekDuration ? 'border-red-300' : ''
                }`}
              />
              {errors.avgTrekDuration && <p className="mt-1 text-sm text-red-600">{errors.avgTrekDuration}</p>}
            </div>
            
            <div>
              <label htmlFor="isActive" className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active (visible to users)</span>
              </label>
            </div>
          </div>
          
          {/* Images and Related Regions */}
          <div className="space-y-4">
            <div>
              <SingleImageUploader
                imageUrl={formData.coverImage}
                onChange={(url) => setFormData(prev => ({ ...prev, coverImage: url }))}
                label="Cover Image"
                maxSize={5}
              />
              {errors.coverImage && <p className="mt-1 text-sm text-red-600">{errors.coverImage}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Related Regions
              </label>
              <select
                multiple
                name="relatedRegions"
                value={formData.relatedRegions}
                onChange={handleRelatedRegionsChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                size="3"
              >
                {allRegions
                  .filter(r => r._id !== (region?._id || ''))
                  .map(r => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                    </option>
                  ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple regions</p>
            </div>
          </div>
        </div>
        
        {/* Trek Section Title */}
        <div className="form-group">
          <label htmlFor="trekSectionTitle" className="form-label">
            Trek Section Title
          </label>
          <input
            type="text"
            id="trekSectionTitle"
            name="trekSectionTitle"
            value={formData.trekSectionTitle || ''}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g. Backpacking Trips In Spiti"
          />
        </div>

        {/* Welcome Message */}
        <div className="form-group">
          <label htmlFor="welcomeMessage" className="form-label">
            Welcome Message
          </label>
          <input
            type="text"
            id="welcomeMessage"
            name="welcomeMessage"
            value={formData.welcomeMessage || ''}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g. Welcome to the land of Lamas!!"
          />
        </div>

        {/* Detailed Description */}
        <div className="form-group">
          <label htmlFor="detailedDescription" className="form-label">
            Detailed Description
          </label>
          <textarea
            id="detailedDescription"
            name="detailedDescription"
            value={formData.detailedDescription || ''}
            onChange={handleChange}
            rows="8"
            className="form-input"
            placeholder="Enter a detailed description for the trek section..."
          ></textarea>
          <p className="text-sm text-gray-500 mt-1">
            Use double line breaks to create paragraphs.
          </p>
        </div>

        {/* Description Images */}
        <div className="form-group">
          <label className="form-label">Description Section Images</label>
          <div className="mb-2">
            <p className="text-sm text-gray-500">
              These images will be displayed in the trek description section. Upload up to 4 images.
            </p>
          </div>
          <ImageUploader
            images={formData.descriptionImages || []}
            onChange={(urls) => handleArrayChange('descriptionImages', urls)}
            maxImages={4}
          />
        </div>

        {/* Gallery Images */}
        <div className="form-group">
          <label className="form-label">Gallery Images</label>
          <div className="mb-2">
            <p className="text-sm text-gray-500">
              These images will be displayed in the gallery section.
            </p>
          </div>
          <ImageUploader
            images={formData.images || []}
            onChange={(urls) => handleArrayChange('images', urls)}
          />
        </div>

        {/* Videos */}
        <div className="form-group">
          <label className="form-label">YouTube Videos</label>
          <div className="mb-2">
            <p className="text-sm text-gray-500">
              Add YouTube video URLs to display in the video carousel.
            </p>
          </div>
          <div className="space-y-2">
            {formData.videos.map((video, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={video}
                  onChange={(e) => handleVideoChange(index, e.target.value)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm form-input"
                  placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
                />
                <button
                  type="button"
                  onClick={() => removeVideoField(index)}
                  className="inline-flex items-center p-1.5 border border-transparent rounded-full text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  disabled={formData.videos.length <= 1}
                >
                  <FaTrash className="h-4 w-4" />
                </button>
                {video && (
                  <div className="h-10 w-10 overflow-hidden rounded-md flex-shrink-0 bg-red-100 flex items-center justify-center">
                    <FaYoutube className="h-6 w-6 text-red-600" />
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addVideoField}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-emerald-700 bg-emerald-100 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <FaPlus className="mr-1" /> Add Video
            </button>
          </div>
        </div>
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => navigate('/admin/regions')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            isEditing ? 'Update Region' : 'Create Region'
          )}
        </button>
      </div>
    </form>
  );
}

export default RegionForm; 