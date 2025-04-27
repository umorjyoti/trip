import React, { useState } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-hot-toast';

function ImageUploader({ images = [], onChange, maxImages = 10 }) {
  const [imageUrls, setImageUrls] = useState(images);

  const handleImageChange = (index, value) => {
    const newImages = [...imageUrls];
    newImages[index] = value;
    setImageUrls(newImages);
    onChange(newImages.filter(url => url.trim() !== ''));
  };

  const addImageField = () => {
    if (maxImages && imageUrls.length >= maxImages) {
      return;
    }
    setImageUrls([...imageUrls, '']);
  };

  const removeImageField = (index) => {
    if (imageUrls.length <= 1) return;
    const newImages = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newImages);
    onChange(newImages.filter(url => url.trim() !== ''));
  };

  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className="flex-grow"></div>
        <button
          type="button"
          onClick={addImageField}
          disabled={maxImages && imageUrls.length >= maxImages}
          className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded ${
            maxImages && imageUrls.length >= maxImages
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500'
          }`}
        >
          <FaPlus className="mr-1" /> Add Image
        </button>
      </div>
      
      <div className="space-y-2">
        {imageUrls.map((image, index) => (
          <div key={index} className="flex items-center space-x-2">
            <input
              type="text"
              value={image}
              onChange={(e) => handleImageChange(index, e.target.value)}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm form-input"
              placeholder="https://example.com/image.jpg"
            />
            <button
              type="button"
              onClick={() => removeImageField(index)}
              className="inline-flex items-center p-1.5 border border-transparent rounded-full text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              disabled={imageUrls.length <= 1}
            >
              <FaTrash className="h-4 w-4" />
            </button>
            {image && (
              <div className="h-10 w-10 overflow-hidden rounded-md flex-shrink-0">
                <img 
                  src={image} 
                  alt={`Preview ${index + 1}`} 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/100?text=Error';
                  }}
                />
              </div>
            )}
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700">
                Or upload an image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  if (e.target.files && e.target.files[0]) {
                    const url = await handleFileUpload(e.target.files[0]);
                    if (url) {
                      handleImageChange(index, url);
                    }
                  }
                }}
                className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-emerald-50 file:text-emerald-700
                  hover:file:bg-emerald-100"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImageUploader; 