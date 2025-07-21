import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaCog, FaImage, FaSave, FaTimes, FaEye, FaEyeSlash, FaHome, FaBlog, FaUmbrellaBeach, FaHiking, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { getSettings, updateSettings, uploadImage as uploadImageAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showLandingPageModal, setShowLandingPageModal] = useState(false);
  const [showBlogPageModal, setShowBlogPageModal] = useState(false);
  const [showWeekendGetawayModal, setShowWeekendGetawayModal] = useState(false);
  const [showAddStatModal, setShowAddStatModal] = useState(false);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showEditStatModal, setShowEditStatModal] = useState(false);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [bannerConfig, setBannerConfig] = useState({
    isActive: false,
    title: '',
    subtitle: '',
    image: '',
    header: '',
    discountText: '',
    showOverlay: true
  });
  const [landingPageConfig, setLandingPageConfig] = useState({
    heroImage: '',
    heroTitle: '',
    heroSubtitle: ''
  });
  const [blogPageConfig, setBlogPageConfig] = useState({
    heroImage: '',
    heroTitle: '',
    heroSubtitle: ''
  });
  const [weekendGetawayConfig, setWeekendGetawayConfig] = useState({
    heroImage: '',
    heroTitle: '',
    heroSubtitle: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [landingPageImageFile, setLandingPageImageFile] = useState(null);
  const [blogPageImageFile, setBlogPageImageFile] = useState(null);
  const [weekendGetawayImageFile, setWeekendGetawayImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newCompanyLogoFile, setNewCompanyLogoFile] = useState(null);
  const [editingCompanyLogoFile, setEditingCompanyLogoFile] = useState(null);
  
  // About page management states
  const [aboutPageConfig, setAboutPageConfig] = useState({
    stats: [],
    companyProfiles: []
  });
  const [editingStat, setEditingStat] = useState(null);
  const [editingCompany, setEditingCompany] = useState(null);
  const [newStat, setNewStat] = useState({ value: '', label: '', isActive: true });
  const [newCompany, setNewCompany] = useState({ 
    company: '', 
    logo: '🏢', 
    logoImage: '', 
    description: '', 
    details: '', 
    isActive: true 
  });

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
      setLandingPageConfig(data.landingPage || {
        heroImage: '',
        heroTitle: 'Discover Your Next Adventure',
        heroSubtitle: 'Explore breathtaking trails and create unforgettable memories with Bengaluru Trekkers'
      });
      setBlogPageConfig(data.blogPage || {
        heroImage: '',
        heroTitle: 'Adventure Stories',
        heroSubtitle: 'Discover amazing trekking experiences and travel tales'
      });
      setWeekendGetawayConfig(data.weekendGetawayPage || {
        heroImage: '',
        heroTitle: 'Weekend Escapes',
        heroSubtitle: 'Discover curated short trips designed for maximum refreshment'
      });
      setAboutPageConfig(data.aboutPage || {
        stats: [],
        companyProfiles: []
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

  const handleLandingPageImageChange = (e) => {
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

      setLandingPageImageFile(file);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setLandingPageConfig(prev => ({ ...prev, heroImage: previewUrl }));
    }
  };

  const handleBlogPageImageChange = (e) => {
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

      setBlogPageImageFile(file);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setBlogPageConfig(prev => ({ ...prev, heroImage: previewUrl }));
    }
  };

  const handleWeekendGetawayImageChange = (e) => {
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

      setWeekendGetawayImageFile(file);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setWeekendGetawayConfig(prev => ({ ...prev, heroImage: previewUrl }));
    }
  };

  const handleNewCompanyLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
        return;
      }

      // Validate file size (2MB max for logos)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        toast.error('File size too large. Maximum size is 2MB.');
        return;
      }

      setNewCompanyLogoFile(file);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setNewCompany(prev => ({ ...prev, logoImage: previewUrl }));
    }
  };

  const handleEditingCompanyLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
        return;
      }

      // Validate file size (2MB max for logos)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        toast.error('File size too large. Maximum size is 2MB.');
        return;
      }

      setEditingCompanyLogoFile(file);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setEditingCompany(prev => ({ ...prev, logoImage: previewUrl }));
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

  const handleSaveLandingPage = async () => {
    try {
      let imageUrl = landingPageConfig.heroImage;

      // If there's a new image file, upload it first
      if (landingPageImageFile) {
        imageUrl = await uploadImage(landingPageImageFile);
        if (!imageUrl) {
          return;
        }
      }

      const updatedSettings = {
        landingPage: {
          ...landingPageConfig,
          heroImage: imageUrl
        }
      };

      await updateSettings(updatedSettings);
      
      toast.success('Landing page image updated successfully');
      setShowLandingPageModal(false);
      setLandingPageImageFile(null);
      
      // Refresh settings
      await fetchSettings();
    } catch (error) {
      console.error('Error saving landing page:', error);
      toast.error('Failed to save landing page configuration');
    }
  };

  const handleSaveBlogPage = async () => {
    try {
      let imageUrl = blogPageConfig.heroImage;

      // If there's a new image file, upload it first
      if (blogPageImageFile) {
        imageUrl = await uploadImage(blogPageImageFile);
        if (!imageUrl) {
          return;
        }
      }

      const updatedSettings = {
        blogPage: {
          ...blogPageConfig,
          heroImage: imageUrl
        }
      };

      await updateSettings(updatedSettings);
      
      toast.success('Blog page image updated successfully');
      setShowBlogPageModal(false);
      setBlogPageImageFile(null);
      
      // Refresh settings
      await fetchSettings();
    } catch (error) {
      console.error('Error saving blog page:', error);
      toast.error('Failed to save blog page configuration');
    }
  };

  const handleSaveWeekendGetaway = async () => {
    try {
      let imageUrl = weekendGetawayConfig.heroImage;

      // If there's a new image file, upload it first
      if (weekendGetawayImageFile) {
        imageUrl = await uploadImage(weekendGetawayImageFile);
        if (!imageUrl) {
          return;
        }
      }

      const updatedSettings = {
        weekendGetawayPage: {
          ...weekendGetawayConfig,
          heroImage: imageUrl
        }
      };

      await updateSettings(updatedSettings);
      
      toast.success('Weekend getaway page image updated successfully');
      setShowWeekendGetawayModal(false);
      setWeekendGetawayImageFile(null);
      
      // Refresh settings
      await fetchSettings();
    } catch (error) {
      console.error('Error saving weekend getaway page:', error);
      toast.error('Failed to save weekend getaway page configuration');
    }
  };

  const handleCloseModal = () => {
    setShowBannerModal(false);
    setImageFile(null);
    // Reset to current settings
    fetchSettings();
  };

  const handleCloseLandingPageModal = () => {
    setShowLandingPageModal(false);
    setLandingPageImageFile(null);
    // Reset to current settings
    fetchSettings();
  };

  const handleCloseBlogPageModal = () => {
    setShowBlogPageModal(false);
    setBlogPageImageFile(null);
    // Reset to current settings
    fetchSettings();
  };

  const handleCloseWeekendGetawayModal = () => {
    setShowWeekendGetawayModal(false);
    setWeekendGetawayImageFile(null);
    // Reset to current settings
    fetchSettings();
  };

  // About page management functions
  const addStat = () => {
    if (!newStat.value || !newStat.label) {
      toast.error('Please fill in all fields');
      return;
    }
    setAboutPageConfig(prev => ({
      ...prev,
      stats: [...prev.stats, { ...newStat }]
    }));
    setNewStat({ value: '', label: '', isActive: true });
    setShowAddStatModal(false);
  };

  const updateStat = (index) => {
    if (!editingStat.value || !editingStat.label) {
      toast.error('Please fill in all fields');
      return;
    }
    const updatedStats = [...aboutPageConfig.stats];
    updatedStats[index] = editingStat;
    setAboutPageConfig(prev => ({ ...prev, stats: updatedStats }));
    setEditingStat(null);
    setShowEditStatModal(false);
  };

  const deleteStat = (index) => {
    const updatedStats = aboutPageConfig.stats.filter((_, i) => i !== index);
    setAboutPageConfig(prev => ({ ...prev, stats: updatedStats }));
  };

  const toggleStatActive = (index) => {
    const updatedStats = [...aboutPageConfig.stats];
    updatedStats[index].isActive = !updatedStats[index].isActive;
    setAboutPageConfig(prev => ({ ...prev, stats: updatedStats }));
  };

  const addCompany = async () => {
    if (!newCompany.company || !newCompany.description || !newCompany.details) {
      toast.error('Please fill in all fields');
      return;
    }

    let logoImageUrl = newCompany.logoImage;

    // If there's a new logo file, upload it first
    if (newCompanyLogoFile) {
      logoImageUrl = await uploadImage(newCompanyLogoFile);
      if (!logoImageUrl) {
        return;
      }
    }

    const companyData = {
      ...newCompany,
      logoImage: logoImageUrl
    };

    setAboutPageConfig(prev => ({
      ...prev,
      companyProfiles: [...prev.companyProfiles, companyData]
    }));
    setNewCompany({ company: '', logo: '🏢', logoImage: '', description: '', details: '', isActive: true });
    setNewCompanyLogoFile(null);
    setShowAddCompanyModal(false);
  };

  const updateCompany = async (index) => {
    if (!editingCompany.company || !editingCompany.description || !editingCompany.details) {
      toast.error('Please fill in all fields');
      return;
    }

    let logoImageUrl = editingCompany.logoImage;

    // If there's a new logo file, upload it first
    if (editingCompanyLogoFile) {
      logoImageUrl = await uploadImage(editingCompanyLogoFile);
      if (!logoImageUrl) {
        return;
      }
    }

    const updatedCompanyData = {
      ...editingCompany,
      logoImage: logoImageUrl
    };

    const updatedCompanies = [...aboutPageConfig.companyProfiles];
    updatedCompanies[index] = updatedCompanyData;
    setAboutPageConfig(prev => ({ ...prev, companyProfiles: updatedCompanies }));
    setEditingCompany(null);
    setEditingCompanyLogoFile(null);
    setShowEditCompanyModal(false);
  };

  const deleteCompany = (index) => {
    const updatedCompanies = aboutPageConfig.companyProfiles.filter((_, i) => i !== index);
    setAboutPageConfig(prev => ({ ...prev, companyProfiles: updatedCompanies }));
  };

  const toggleCompanyActive = (index) => {
    const updatedCompanies = [...aboutPageConfig.companyProfiles];
    updatedCompanies[index].isActive = !updatedCompanies[index].isActive;
    setAboutPageConfig(prev => ({ ...prev, companyProfiles: updatedCompanies }));
  };

  const saveAboutPageSettings = async () => {
    try {
      const updatedSettings = {
        aboutPage: aboutPageConfig
      };
      await updateSettings(updatedSettings);
      toast.success('About page settings saved successfully!');
      await fetchSettings();
    } catch (error) {
      console.error('Error saving about page settings:', error);
      toast.error('Failed to save about page settings');
    }
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

      {/* Landing Page Image Configuration Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Landing Page Hero Image</h2>
            <p className="text-sm text-gray-600">Configure the hero image displayed on the landing page</p>
          </div>
          <FaHome className="text-emerald-600 text-xl" />
        </div>

        {/* Current Hero Image Status */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Current Hero Image</h3>
              <div className="flex items-center mt-2">
                {landingPageConfig.heroImage ? (
                  <>
                    <FaEye className="text-green-500 mr-2" />
                    <span className="text-green-700 font-medium">Active</span>
                  </>
                ) : (
                  <>
                    <FaEyeSlash className="text-gray-400 mr-2" />
                    <span className="text-gray-600 font-medium">No image set</span>
                  </>
                )}
              </div>
            </div>
            
            {landingPageConfig.heroImage && (
              <div className="flex-shrink-0">
                <img
                  src={landingPageConfig.heroImage}
                  alt="Current hero image"
                  className="w-32 h-20 object-cover rounded-md border border-gray-200"
                />
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowLandingPageModal(true)}
          className="bg-emerald-600 text-white py-3 px-6 rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2"
        >
          <FaImage className="text-sm" />
          <span>Update Hero Image</span>
        </button>
      </div>

      {/* Blog Page Image Configuration Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Blog Page Hero Image</h2>
            <p className="text-sm text-gray-600">Configure the hero image displayed on the blog listing page</p>
          </div>
          <FaBlog className="text-emerald-600 text-xl" />
        </div>

        {/* Current Hero Image Status */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Current Hero Image</h3>
              <div className="flex items-center mt-2">
                {blogPageConfig.heroImage ? (
                  <>
                    <FaEye className="text-green-500 mr-2" />
                    <span className="text-green-700 font-medium">Active</span>
                  </>
                ) : (
                  <>
                    <FaEyeSlash className="text-gray-400 mr-2" />
                    <span className="text-gray-600 font-medium">No image set</span>
                  </>
                )}
              </div>
            </div>
            
            {blogPageConfig.heroImage && (
              <div className="flex-shrink-0">
                <img
                  src={blogPageConfig.heroImage}
                  alt="Current blog hero image"
                  className="w-32 h-20 object-cover rounded-md border border-gray-200"
                />
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowBlogPageModal(true)}
          className="bg-emerald-600 text-white py-3 px-6 rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2"
        >
          <FaImage className="text-sm" />
          <span>Update Hero Image</span>
        </button>
      </div>

      {/* Weekend Getaway Page Image Configuration Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Weekend Getaway Page Hero Image</h2>
            <p className="text-sm text-gray-600">Configure the hero image displayed on the weekend getaway page</p>
          </div>
          <FaUmbrellaBeach className="text-emerald-600 text-xl" />
        </div>

        {/* Current Hero Image Status */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Current Hero Image</h3>
              <div className="flex items-center mt-2">
                {weekendGetawayConfig.heroImage ? (
                  <>
                    <FaEye className="text-green-500 mr-2" />
                    <span className="text-green-700 font-medium">Active</span>
                  </>
                ) : (
                  <>
                    <FaEyeSlash className="text-gray-400 mr-2" />
                    <span className="text-gray-600 font-medium">No image set</span>
                  </>
                )}
              </div>
            </div>
            
            {weekendGetawayConfig.heroImage && (
              <div className="flex-shrink-0">
                <img
                  src={weekendGetawayConfig.heroImage}
                  alt="Current weekend getaway hero image"
                  className="w-32 h-20 object-cover rounded-md border border-gray-200"
                />
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowWeekendGetawayModal(true)}
          className="bg-emerald-600 text-white py-3 px-6 rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2"
        >
          <FaImage className="text-sm" />
          <span>Update Hero Image</span>
        </button>
      </div>

      {/* About Page Management Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">About Page Management</h2>
            <p className="text-sm text-gray-600">Manage statistics and company profiles displayed on the About page</p>
          </div>
          <FaHiking className="text-emerald-600 text-xl" />
        </div>

        {/* Stats Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Statistics</h3>
            <button
              onClick={() => setShowAddStatModal(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2 text-sm"
            >
              <FaPlus className="h-3 w-3" />
              Add Stat
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aboutPageConfig.stats.map((stat, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStatActive(index)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {stat.isActive ? <FaEye className="h-4 w-4" /> : <FaEyeSlash className="h-4 w-4" />}
                    </button>
                    <span className={`font-semibold ${stat.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                      {stat.value}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingStat({ ...stat, index });
                        setShowEditStatModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaEdit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteStat(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className={`text-sm ${stat.isActive ? 'text-gray-700' : 'text-gray-400'}`}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Company Profiles Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Company Profiles</h3>
            <button
              onClick={() => setShowAddCompanyModal(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2 text-sm"
            >
              <FaPlus className="h-3 w-3" />
              Add Company
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aboutPageConfig.companyProfiles.map((company, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleCompanyActive(index)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {company.isActive ? <FaEye className="h-4 w-4" /> : <FaEyeSlash className="h-4 w-4" />}
                    </button>
                    {company.logoImage ? (
                      <img
                        src={company.logoImage}
                        alt={`${company.company} logo`}
                        className="w-8 h-8 object-contain rounded"
                      />
                    ) : (
                      <span className="text-2xl">{company.logo}</span>
                    )}
                    <span className={`font-semibold ${company.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                      {company.company}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingCompany({ ...company, index });
                        setShowEditCompanyModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaEdit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteCompany(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className={`text-sm mb-2 ${company.isActive ? 'text-gray-700' : 'text-gray-400'}`}>
                  {company.description}
                </p>
                <div className="bg-emerald-50 rounded p-2">
                  <p className={`text-xs font-semibold ${company.isActive ? 'text-emerald-700' : 'text-gray-400'}`}>
                    {company.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveAboutPageSettings}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <FaSave className="h-4 w-4" />
            Save About Page Settings
          </button>
        </div>
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

      {/* Landing Page Image Configuration Modal */}
      <Modal
        isOpen={showLandingPageModal}
        onClose={handleCloseLandingPageModal}
        title="Update Landing Page Hero Image"
        size="medium"
      >
        <div className="space-y-6">
          {/* Hero Image Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Hero Image Preview</h3>
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="relative h-64 bg-gradient-to-br from-emerald-500 to-blue-600">
                {landingPageConfig.heroImage ? (
                  <img
                    src={landingPageConfig.heroImage}
                    alt="Hero"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-blue-600"></div>
                )}
                <div className="absolute inset-0 bg-black opacity-30"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <h2 className="text-3xl font-bold mb-2">
                      {landingPageConfig.heroTitle || 'Discover Your Next Adventure'}
                    </h2>
                    <p className="text-lg opacity-90">
                      {landingPageConfig.heroSubtitle || 'Explore breathtaking trails and create unforgettable memories'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Image Upload Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hero Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLandingPageImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              />
              {uploadingImage && (
                <div className="mt-2 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2"></div>
                  <span className="text-sm text-gray-600">Uploading image...</span>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Recommended size: 1920x1080px or higher. Max file size: 5MB
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hero Title
                </label>
                <input
                  type="text"
                  value={landingPageConfig.heroTitle || ''}
                  onChange={(e) => setLandingPageConfig(prev => ({ ...prev, heroTitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Discover Your Next Adventure"
                  maxLength={100}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum 100 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hero Subtitle
                </label>
                <textarea
                  value={landingPageConfig.heroSubtitle || ''}
                  onChange={(e) => setLandingPageConfig(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Explore breathtaking trails and create unforgettable memories"
                  maxLength={200}
                  rows={3}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum 200 characters
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleCloseLandingPageModal}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <FaTimes className="text-sm" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSaveLandingPage}
              disabled={uploadingImage}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <FaSave className="text-sm" />
              <span>Save Image</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Blog Page Image Configuration Modal */}
      <Modal
        isOpen={showBlogPageModal}
        onClose={handleCloseBlogPageModal}
        title="Update Blog Page Hero Image"
        size="medium"
      >
        <div className="space-y-6">
          {/* Hero Image Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Blog Page Hero Image Preview</h3>
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="relative h-64 bg-gradient-to-br from-emerald-500 to-blue-600">
                {blogPageConfig.heroImage ? (
                  <img
                    src={blogPageConfig.heroImage}
                    alt="Blog Hero"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-blue-600"></div>
                )}
                <div className="absolute inset-0 bg-black opacity-30"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <h2 className="text-3xl font-bold mb-2">
                      {blogPageConfig.heroTitle || 'Adventure Stories'}
                    </h2>
                    <p className="text-lg opacity-90">
                      {blogPageConfig.heroSubtitle || 'Discover amazing trekking experiences and travel tales'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Image Upload Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hero Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleBlogPageImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              />
              {uploadingImage && (
                <div className="mt-2 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2"></div>
                  <span className="text-sm text-gray-600">Uploading image...</span>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Recommended size: 1920x1080px or higher. Max file size: 5MB
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hero Title
                </label>
                <input
                  type="text"
                  value={blogPageConfig.heroTitle || ''}
                  onChange={(e) => setBlogPageConfig(prev => ({ ...prev, heroTitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Adventure Stories"
                  maxLength={100}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum 100 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hero Subtitle
                </label>
                <textarea
                  value={blogPageConfig.heroSubtitle || ''}
                  onChange={(e) => setBlogPageConfig(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Discover amazing trekking experiences and travel tales"
                  maxLength={200}
                  rows={3}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum 200 characters
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleCloseBlogPageModal}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <FaTimes className="text-sm" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSaveBlogPage}
              disabled={uploadingImage}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <FaSave className="text-sm" />
              <span>Save Image</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Weekend Getaway Page Image Configuration Modal */}
      <Modal
        isOpen={showWeekendGetawayModal}
        onClose={handleCloseWeekendGetawayModal}
        title="Update Weekend Getaway Page Hero Image"
        size="medium"
      >
        <div className="space-y-6">
          {/* Hero Image Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Weekend Getaway Hero Image Preview</h3>
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="relative h-64 bg-gradient-to-br from-emerald-500 to-blue-600">
                {weekendGetawayConfig.heroImage ? (
                  <img
                    src={weekendGetawayConfig.heroImage}
                    alt="Weekend Getaway Hero"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-blue-600"></div>
                )}
                <div className="absolute inset-0 bg-black opacity-30"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <h2 className="text-3xl font-bold mb-2">
                      {weekendGetawayConfig.heroTitle || 'Weekend Escapes'}
                    </h2>
                    <p className="text-lg opacity-90">
                      {weekendGetawayConfig.heroSubtitle || 'Discover curated short trips designed for maximum refreshment'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Image Upload Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hero Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleWeekendGetawayImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              />
              {uploadingImage && (
                <div className="mt-2 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2"></div>
                  <span className="text-sm text-gray-600">Uploading image...</span>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Recommended size: 1920x1080px or higher. Max file size: 5MB
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hero Title
                </label>
                <input
                  type="text"
                  value={weekendGetawayConfig.heroTitle || ''}
                  onChange={(e) => setWeekendGetawayConfig(prev => ({ ...prev, heroTitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Weekend Escapes"
                  maxLength={100}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum 100 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hero Subtitle
                </label>
                <textarea
                  value={weekendGetawayConfig.heroSubtitle || ''}
                  onChange={(e) => setWeekendGetawayConfig(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Discover curated short trips designed for maximum refreshment"
                  maxLength={200}
                  rows={3}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum 200 characters
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleCloseWeekendGetawayModal}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <FaTimes className="text-sm" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSaveWeekendGetaway}
              disabled={uploadingImage}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <FaSave className="text-sm" />
              <span>Save Image</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Stat Modal */}
      <Modal
        isOpen={showAddStatModal}
        onClose={() => setShowAddStatModal(false)}
        title="Add New Stat"
        size="medium"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
            <input
              type="text"
              value={newStat.value}
              onChange={(e) => setNewStat(prev => ({ ...prev, value: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., 500+"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
            <input
              type="text"
              value={newStat.label}
              onChange={(e) => setNewStat(prev => ({ ...prev, label: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Treks Completed"
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowAddStatModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <FaTimes className="text-sm" />
            <span>Cancel</span>
          </button>
          <button
            onClick={addStat}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2"
          >
            <FaSave className="text-sm" />
            <span>Add Stat</span>
          </button>
        </div>
      </Modal>

      {/* Add Company Modal */}
      <Modal
        isOpen={showAddCompanyModal}
        onClose={() => setShowAddCompanyModal(false)}
        title="Add New Company"
        size="large"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              type="text"
              value={newCompany.company}
              onChange={(e) => setNewCompany(prev => ({ ...prev, company: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Infosys"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
            <div className="space-y-2">
              {/* Logo Preview */}
              <div className="flex items-center gap-3">
                {newCompany.logoImage ? (
                  <img
                    src={newCompany.logoImage}
                    alt="Logo preview"
                    className="w-12 h-12 object-contain border rounded-lg bg-white"
                  />
                ) : (
                  <span className="text-3xl">{newCompany.logo}</span>
                )}
                <div className="text-sm text-gray-600">
                  {newCompany.logoImage ? 'Uploaded logo will be used' : 'Emoji will be used as placeholder'}
                </div>
              </div>
              
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Logo Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleNewCompanyLogoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                />
                {uploadingImage && (
                  <div className="mt-2 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2"></div>
                    <span className="text-sm text-gray-600">Uploading logo...</span>
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Recommended size: 200x200px. Max file size: 2MB. Leave empty to use emoji.
                </p>
              </div>
              
              {/* Emoji Fallback */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emoji (Fallback)</label>
                <input
                  type="text"
                  value={newCompany.logo}
                  onChange={(e) => setNewCompany(prev => ({ ...prev, logo: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="🏢"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Used as fallback if no logo image is uploaded
                </p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={newCompany.description}
              onChange={(e) => setNewCompany(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Team building trek to Kudremukh"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
            <input
              type="text"
              value={newCompany.details}
              onChange={(e) => setNewCompany(prev => ({ ...prev, details: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., 50+ employees, 3-day adventure"
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowAddCompanyModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <FaTimes className="text-sm" />
            <span>Cancel</span>
          </button>
          <button
            onClick={addCompany}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2"
          >
            <FaSave className="text-sm" />
            <span>Add Company</span>
          </button>
        </div>
      </Modal>

      {/* Edit Stat Modal */}
      <Modal
        isOpen={showEditStatModal}
        onClose={() => {
          setShowEditStatModal(false);
          setEditingStat(null);
        }}
        title="Edit Stat"
        size="medium"
      >
        {editingStat && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
              <input
                type="text"
                value={editingStat.value}
                onChange={(e) => setEditingStat(prev => ({ ...prev, value: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
              <input
                type="text"
                value={editingStat.label}
                onChange={(e) => setEditingStat(prev => ({ ...prev, label: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              setShowEditStatModal(false);
              setEditingStat(null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <FaTimes className="text-sm" />
            <span>Cancel</span>
          </button>
          <button
            onClick={() => editingStat && updateStat(editingStat.index)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2"
          >
            <FaSave className="text-sm" />
            <span>Update Stat</span>
          </button>
        </div>
      </Modal>

      {/* Edit Company Modal */}
      <Modal
        isOpen={showEditCompanyModal}
        onClose={() => {
          setShowEditCompanyModal(false);
          setEditingCompany(null);
          setEditingCompanyLogoFile(null);
        }}
        title="Edit Company"
        size="medium"
      >
        {editingCompany && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={editingCompany.company}
                onChange={(e) => setEditingCompany(prev => ({ ...prev, company: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
              <div className="space-y-2">
                {/* Logo Preview */}
                <div className="flex items-center gap-3">
                  {editingCompany.logoImage ? (
                    <img
                      src={editingCompany.logoImage}
                      alt="Logo preview"
                      className="w-12 h-12 object-contain border rounded-lg bg-white"
                    />
                  ) : (
                    <span className="text-3xl">{editingCompany.logo}</span>
                  )}
                  <div className="text-sm text-gray-600">
                    {editingCompany.logoImage ? 'Uploaded logo will be used' : 'Emoji will be used as placeholder'}
                  </div>
                </div>
                
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Logo Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditingCompanyLogoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {uploadingImage && (
                    <div className="mt-2 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2"></div>
                      <span className="text-sm text-gray-600">Uploading logo...</span>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Recommended size: 200x200px. Max file size: 2MB. Leave empty to use emoji.
                  </p>
                </div>
                
                {/* Emoji Fallback */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emoji (Fallback)</label>
                  <input
                    type="text"
                    value={editingCompany.logo}
                    onChange={(e) => setEditingCompany(prev => ({ ...prev, logo: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Used as fallback if no logo image is uploaded
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={editingCompany.description}
                onChange={(e) => setEditingCompany(prev => ({ ...prev, description: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
              <input
                type="text"
                value={editingCompany.details}
                onChange={(e) => setEditingCompany(prev => ({ ...prev, details: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              setShowEditCompanyModal(false);
              setEditingCompany(null);
              setEditingCompanyLogoFile(null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <FaTimes className="text-sm" />
            <span>Cancel</span>
          </button>
          <button
            onClick={() => editingCompany && updateCompany(editingCompany.index)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center space-x-2"
          >
            <FaSave className="text-sm" />
            <span>Update Company</span>
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default AdminSettings; 