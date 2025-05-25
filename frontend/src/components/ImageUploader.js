import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaImage } from 'react-icons/fa';

const ImageUploader = ({ images = [], onChange }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedUrls = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        uploadedUrls.push(response.data.url);
      }

      onChange([...images, ...uploadedUrls]);
      toast.success('Images uploaded successfully!');
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageUrl, index) => {
    try {
      // Extract the key from the S3 URL
      const urlParts = imageUrl.split('.com/');
      if (urlParts.length !== 2) {
        throw new Error('Invalid S3 URL format');
      }
      
      // Get the key and decode it to handle special characters
      const key = decodeURIComponent(urlParts[1]);
      
      // Call the backend to delete the image
      await axios.delete(`/api/upload/${encodeURIComponent(key)}`);
      
      // Update the images array
      const newImages = images.filter((_, i) => i !== index);
      onChange(newImages);
      
      toast.success('Image deleted successfully!');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error(error.response?.data?.message || 'Failed to delete image. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Image Preview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((url, index) => (
          <div key={index} className="relative group aspect-square">
            <img
              src={url}
              alt={`Uploaded ${index + 1}`}
              className="w-full h-full object-cover rounded-lg shadow-sm"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button
                onClick={() => handleDeleteImage(url, index)}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
                title="Delete image"
              >
                <FaTrash className="w-4 h-4" />
              </button>
            </div>
            {index === 0 && (
              <div className="absolute top-2 left-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded">
                Cover
              </div>
            )}
          </div>
        ))}
        
        {/* Upload Button */}
        <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors duration-200">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          <div className="text-center p-4">
            <FaImage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <span className="text-sm text-gray-600">
              {uploading ? 'Uploading...' : 'Click to upload'}
            </span>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG up to 5MB
            </p>
          </div>
        </label>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-emerald-600 h-2.5 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader; 