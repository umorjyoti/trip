import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaCog, FaImage, FaSave, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import { getSettings, updateSettings, uploadImage as uploadImageAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [bannerConfig, setBannerConfig] = useState({
    isActive: false,
    title: '',
    subtitle: '',
    image: '',
    header: '',
    discountText: '',
    showOverlay: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setBannerConfig(data.enquiryBanner || {
        isActive: false,
        title: '',
        subtitle: '',
        image: '',
        header: '',
        discountText: '',
        showOverlay: true
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error('File size too large. Maximum size is 5MB.');
        return;
      }

      setImageFile(file);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setBannerConfig(prev => ({ ...prev, image: previewUrl }));
    }
  };

  const uploadImage = async (file) => {
    try {
      setUploadingImage(true);
      const data = await uploadImageAPI(file);
      return data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveBanner = async () => {
    try {
      let imageUrl = bannerConfig.image;

      // If there's a new image file, upload it first
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          return;
        }
      }

      const updatedSettings = {
        enquiryBanner: {
          ...bannerConfig,
          image: imageUrl
        }
      };

      await updateSettings(updatedSettings);
      
      toast.success('Enquiry banner updated successfully');
      setShowBannerModal(false);
      setImageFile(null);
      
      // Refresh settings
      await fetchSettings();
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error('Failed to save banner configuration');
    }
  };

  const handleCloseModal = () => {
    setShowBannerModal(false);
    setImageFile(null);
    // Reset to current settings
    fetchSettings();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
        <p className="mt-2 text-gray-600">Configure system-wide settings and configurations</p>
      </div>

      {/* Enquiry Banner Configuration Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Enquiry Banner Configuration</h2>
            <p className="text-sm text-gray-600">Configure the global enquiry banner that appears on all trek pages</p>
          </div>
          <FaCog className="text-emerald-600 text-xl" />
        </div>

        {/* Current Banner Status */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Current Banner Status</h3>
              <div className="flex items-center mt-2">
                {bannerConfig.isActive ? (
                  <>
                    <FaEye className="text-green-500 mr-2" />
                    <span className="text-green-700 font-medium">Active</span>
                  </>
                ) : (
                  <>
                    <FaEyeSlash className="text-gray-400 mr-2" />
                    <span className="text-gray-600 font-medium">Inactive</span>
                  </>
                )}
              </div>
            </div>
            
            {bannerConfig.image && (
              <div className="flex-shrink-0">
                <img
                  src={bannerConfig.image}
                  alt="Current banner"
                  className="w-20 h-16 object-cover rounded-md border border-gray-200"
                />
              </div>
            )}
          </div>
          
          {bannerConfig.title && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                <strong>Title:</strong> {bannerConfig.title}
              </p>
              {bannerConfig.subtitle && (
                <p className="text-sm text-gray-600">
                  <strong>Subtitle:</strong> {bannerConfig.subtitle}
                </p>
              )}
              {bannerConfig.header && (
                <p className="text-sm text-gray-600">
                  <strong>Header:</strong> {bannerConfig.header}
                </p>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowBannerModal(true)}
          className="bg-emerald-600 text-white py-3 px-6 rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2"
        >
          <FaCog className="text-sm" />
          <span>Configure Banner</span>
        </button>
      </div>

      {/* Banner Configuration Modal */}
      <Modal
        isOpen={showBannerModal}
        onClose={handleCloseModal}
        title="Configure Global Enquiry Banner"
        size="large"
      >
        <div className="space-y-6">
          {/* Banner Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Banner Preview</h3>
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Left side - Banner content */}
                <div className="relative h-48 md:h-64 bg-gradient-to-br from-emerald-500 to-blue-600 p-6 flex flex-col justify-between">
                  {bannerConfig.image && (
                    <img
                      src={bannerConfig.image}
                      alt="Banner"
                      className={`absolute inset-0 w-full h-full object-cover ${bannerConfig.showOverlay ? 'opacity-20' : 'opacity-100'}`}
                    />
                  )}
                  
                  <div className="relative z-10">
                    {bannerConfig.title && (
                      <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                        {bannerConfig.title}
                      </h2>
                    )}
                    {bannerConfig.subtitle && (
                      <p className="text-white text-sm lg:text-base opacity-90">
                        {bannerConfig.subtitle}
                      </p>
                    )}
                  </div>
                  
                  <div className="relative z-10">
                    {bannerConfig.header && (
                      <div className="text-3xl lg:text-4xl font-bold text-white mb-1">
                        {bannerConfig.header}
                      </div>
                    )}
                    {bannerConfig.discountText && (
                      <p className="text-white text-sm opacity-90">
                        {bannerConfig.discountText}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Right side - Form placeholder */}
                <div className="h-48 md:h-64 bg-white p-6 flex flex-col justify-center">
                  <div className="text-center">
                    <FaImage className="text-gray-300 text-4xl mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Enquiry Form</p>
                    <p className="text-gray-400 text-xs">(Will appear on all trek pages)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Form */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isActive"
                checked={bannerConfig.isActive}
                onChange={(e) => setBannerConfig(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Enable enquiry banner across all trek pages
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="showOverlay"
                checked={bannerConfig.showOverlay}
                onChange={(e) => setBannerConfig(prev => ({ ...prev, showOverlay: e.target.checked }))}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="showOverlay" className="text-sm font-medium text-gray-700">
                Show dark overlay on banner image (for better text readability)
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banner Title
                </label>
                <input
                  type="text"
                  value={bannerConfig.title}
                  onChange={(e) => setBannerConfig(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., AZAADI LONG WEEKEND"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banner Subtitle
                </label>
                <input
                  type="text"
                  value={bannerConfig.subtitle}
                  onChange={(e) => setBannerConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Unplug, Unwind, Explore with Discounts up to"
                  maxLength={200}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Header
                </label>
                <input
                  type="text"
                  value={bannerConfig.header}
                  onChange={(e) => setBannerConfig(prev => ({ ...prev, header: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Special Offer"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Text
                </label>
                <input
                  type="text"
                  value={bannerConfig.discountText}
                  onChange={(e) => setBannerConfig(prev => ({ ...prev, discountText: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Special Offer - Limited Time"
                  maxLength={100}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banner Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              />
              {uploadingImage && (
                <div className="mt-2 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2"></div>
                  <span className="text-sm text-gray-600">Uploading image...</span>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Recommended size: 800x600px. Max file size: 5MB
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <FaTimes className="text-sm" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSaveBanner}
              disabled={uploadingImage}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <FaSave className="text-sm" />
              <span>Save Banner</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AdminSettings; 