import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaImage } from 'react-icons/fa';
import api from '../services/api';

const SingleImageUploader = ({ imageUrl = '', onChange, label = 'Upload Image', maxSize = 5 }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (in MB)
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onChange(response.data.url);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!imageUrl) return;

    try {
      // Extract the key from the S3 URL
      const urlParts = imageUrl.split('.com/');
      if (urlParts.length !== 2) {
        throw new Error('Invalid S3 URL format');
      }
      
      // Get the key and decode it to handle special characters
      const key = decodeURIComponent(urlParts[1]);
      
      // Call the backend to delete the image using the API service
      await api.delete(`/upload/${encodeURIComponent(key)}`);
      
      // Clear the image URL
      onChange('');
      
      toast.success('Image deleted successfully!');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error(error.response?.data?.message || 'Failed to delete image. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      {/* Image Preview */}
      {imageUrl && (
        <div className="relative group">
          <img
            src={imageUrl}
            alt="Uploaded image"
            className="w-full h-48 object-cover rounded-lg shadow-sm"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL';
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              onClick={handleDeleteImage}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
              title="Delete image"
            >
              <FaTrash className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Upload Button */}
      <label className={`block w-full border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ${
        imageUrl 
          ? 'border-gray-300 hover:border-emerald-500 hover:bg-emerald-50' 
          : 'border-gray-300 hover:border-emerald-500 hover:bg-emerald-50'
      }`}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />
        <div className="text-center p-6">
          <FaImage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <span className="text-sm text-gray-600">
            {uploading ? 'Uploading...' : imageUrl ? 'Click to change image' : 'Click to upload'}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG up to {maxSize}MB
          </p>
        </div>
      </label>

      {/* Upload Progress */}
      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-emerald-600 h-2.5 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
};

export default SingleImageUploader; 