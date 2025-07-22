import React, { useState, useEffect } from 'react';
import { FaTimes, FaPhone, FaEnvelope, FaUser, FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa';
import { createLead, getEnquiryBannerSettings } from '../services/api';
import { toast } from 'react-toastify';
import Modal from './Modal';
import CustomDropdown from './CustomDropdown';

function EnquiryBanner({ trek, isOpen, onClose, onSuccess, source = 'Trek Detail Page' }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    tripType: 'Backpacking Trips',
    destination: trek?.regionName || '',
    keepUpdated: true,
    requestCall: false
  });
  const [loading, setLoading] = useState(false);
  const [bannerSettings, setBannerSettings] = useState(null);
  const [bannerLoading, setBannerLoading] = useState(true);
  const [isLocallyClosed, setIsLocallyClosed] = useState(false);
  const [showAutoPopup, setShowAutoPopup] = useState(false);

  // Fetch global banner settings
  useEffect(() => {
    const fetchBannerSettings = async () => {
      try {
        setBannerLoading(true);
        const data = await getEnquiryBannerSettings();
        setBannerSettings(data.enquiryBanner);
      } catch (error) {
        console.error('Error fetching banner settings:', error);
      } finally {
        setBannerLoading(false);
      }
    };

    fetchBannerSettings();
  }, []);

  // Handle automatic popup with 3-second delay
  useEffect(() => {
    if (bannerSettings?.isActive && !isOpen && !isLocallyClosed) {
      // Check if banner was already shown in this session
      const bannerShown = JSON.parse(sessionStorage.getItem('enquiryBannerShown') || 'false');
      
      if (!bannerShown) {
        // Add 3-second delay for automatic popup
        const timer = setTimeout(() => {
          setShowAutoPopup(true);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }
  }, [bannerSettings, isOpen, isLocallyClosed]);

  // Reset form when trek changes
  useEffect(() => {
    if (trek) {
      setFormData(prev => ({
        ...prev,
        destination: trek.regionName || ''
      }));
    }
  }, [trek]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast.error('Email is required');
      return;
    }
    
    setLoading(true);
    
    try {
      await createLead({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        notes: `Trip Type: ${formData.tripType}, Destination: ${formData.destination}`,
        trekId: trek?._id,
        source: source,
        requestCallback: formData.requestCall
      });
      
      toast.success('Thank you for your interest! Our team will contact you soon.');
      
      // Store in session storage that banner was shown for this session
      const bannerShown = JSON.parse(sessionStorage.getItem('enquiryBannerShown') || 'false');
      sessionStorage.setItem('enquiryBannerShown', 'true');
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      toast.error('Failed to submit your enquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check if banner should be shown automatically
  const shouldShowBanner = () => {
    if (!bannerSettings?.isActive) return false;
    
    // Check if banner was already shown in this session
    const bannerShown = JSON.parse(sessionStorage.getItem('enquiryBannerShown') || 'false');
    return !bannerShown;
  };

  // Determine if banner should be displayed automatically
  const shouldDisplayAuto = shouldShowBanner() && showAutoPopup && !isLocallyClosed;
  
  // If banner is not active, already shown, or still loading, don't render
  if (bannerLoading || (!isOpen && !shouldDisplayAuto)) {
    return null;
  }

  const handleClose = () => {
    // First, set session storage to true
    sessionStorage.setItem('enquiryBannerShown', 'true');
    
    // After 1 millisecond, close the banner
    setTimeout(() => {
      setIsLocallyClosed(true);
      setShowAutoPopup(false);
      onClose();
    }, 1);
  };

  return (
    <Modal
      isOpen={isOpen || shouldDisplayAuto}
      onClose={handleClose}
      title="Plan Your Next Trip"
      size="large"
      showBackdrop={source !== 'Landing Page'}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left Side - Banner Content */}
        <div className="relative h-64 lg:h-auto bg-gradient-to-br from-emerald-500 to-blue-600 p-6 flex flex-col justify-between">
          {bannerSettings?.image && (
            <img
              src={bannerSettings.image}
              alt="Banner"
              className={`absolute inset-0 w-full h-full object-cover ${bannerSettings.showOverlay !== false ? 'opacity-20' : 'opacity-100'}`}
            />
          )}
          
          <div className="relative z-10">
            {bannerSettings?.title && (
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                {bannerSettings.title}
              </h2>
            )}
            {bannerSettings?.subtitle && (
              <p className="text-white text-sm lg:text-base opacity-90">
                {bannerSettings.subtitle}
              </p>
            )}
          </div>
          
          <div className="relative z-10">
            {bannerSettings?.header && (
              <div className="text-3xl lg:text-4xl font-bold text-white mb-1">
                {bannerSettings.header}
              </div>
            )}
            {bannerSettings?.discountText && (
              <p className="text-white text-sm opacity-90">
                {bannerSettings.discountText}
              </p>
            )}
          </div>
        </div>
        
        {/* Right Side - Enquiry Form */}
        <div className="p-6 bg-white">
          <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="John"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="+91 94494 93112"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What kind of trip do you prefer? *
                </label>
                <CustomDropdown
                  options={[
                    "Backpacking Trips",
                    "Weekend Getaways", 
                    "Adventure Tours",
                    "Cultural Tours",
                    "Custom Tours"
                  ]}
                  value={formData.tripType}
                  onChange={(option) => {
                    setFormData(prev => ({
                      ...prev,
                      tripType: option
                    }));
                  }}
                  placeholder="Select trip type"
                  required
                  icon={FaCalendarAlt}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Where do you want to go?
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g., Ladakh, Meghalaya"
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="keepUpdated"
                  name="keepUpdated"
                  checked={formData.keepUpdated}
                  onChange={handleChange}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="keepUpdated" className="ml-2 block text-sm text-gray-700">
                  Keep me updated with offers, trips, and travel inspiration via email, SMS, and WhatsApp
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requestCall"
                  name="requestCall"
                  checked={formData.requestCall}
                  onChange={handleChange}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="requestCall" className="ml-2 block text-sm text-gray-700">
                  Request a call back from our team
                </label>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Submitting...' : "Let's Travel"}
              </button>
            </form>
          </div>
        </div>
      </Modal>
  );
}

export default EnquiryBanner; 