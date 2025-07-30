import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  getTreks,
  createTrekSection,
  updateTrekSection,
  deleteTrekSection,
  getTrekSections,
} from "../services/api";
import { toast } from "react-toastify";
import Modal from "./Modal";
import { FaEdit, FaTrash, FaEye, FaEyeSlash, FaImage, FaMountain, FaPlus, FaSort, FaFilter, FaEye as FaPreview } from "react-icons/fa";
import ImageUploader from "./ImageUploader";
import TrekBannerSection from "./TrekBannerSection";

const TrekSectionManager = forwardRef(
  (
    {
      showModal: externalShowModal,
      setShowModal: setExternalShowModal,
      onSectionChange,
    },
    ref
  ) => {
    const [sections, setSections] = useState([]);
    const [allTreks, setAllTreks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [internalShowModal, setInternalShowModal] = useState(false);
    const [currentSection, setCurrentSection] = useState({
      title: "",
      type: "trek",
      treks: [],
      isActive: true,
      displayOrder: 0,
      // Banner fields
      bannerImage: "",
      overlayText: "",
      overlayColor: "#000000",
      overlayOpacity: 0.5,
      textColor: "#FFFFFF",
      linkToTrek: "",
      couponCode: "",
      discountPercentage: "",
      mobileOptimized: true,
    });
    const [isEditing, setIsEditing] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);
    const [filterType, setFilterType] = useState('all'); // 'all', 'trek', 'banner'
    const [showPreview, setShowPreview] = useState(false);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      handleEdit: (section) => {
        handleEdit(section);
      },
      confirmDelete: (sectionId) => {
        setDeleteConfirmation(sectionId);
      },
    }));

    // Use external modal state if provided
    useEffect(() => {
      if (externalShowModal !== undefined) {
        setInternalShowModal(externalShowModal);
      }
    }, [externalShowModal]);

    // Update external modal state if provided
    useEffect(() => {
      if (setExternalShowModal && internalShowModal !== externalShowModal) {
        setExternalShowModal(internalShowModal);
      }
    }, [internalShowModal, externalShowModal, setExternalShowModal]);

    useEffect(() => {
      fetchData();
    }, []);

    const fetchData = async () => {
      try {
        setLoading(true);
        const [sectionsData, treksData] = await Promise.all([
          getTrekSections(),
          getTreks({ limit: 100 }),
        ]);

        setSections(sectionsData);
        setAllTreks(treksData);
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    const handleInputChange = (e) => {
      const { name, value, type, checked } = e.target;
      setCurrentSection((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    };

    const handleTrekCheckboxChange = (trekId) => {
      setCurrentSection((prev) => {
        const treks = [...prev.treks];
        if (treks.includes(trekId)) {
          return { ...prev, treks: treks.filter((id) => id !== trekId) };
        } else {
          return { ...prev, treks: [...treks, trekId] };
        }
      });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      try {
        setLoading(true);

        if (isEditing) {
          await updateTrekSection(currentSection._id, currentSection);
          toast.success("Section updated successfully");
        } else {
          await createTrekSection(currentSection);
          toast.success("Section created successfully");
        }

        // Reset form and refresh data
        resetForm();
        fetchData();

        // Notify parent component
        if (onSectionChange) {
          onSectionChange();
        }
      } catch (err) {
        console.error("Error saving section:", err);
        toast.error("Failed to save section");
      } finally {
        setLoading(false);
        setInternalShowModal(false);
      }
    };

    const handleDelete = async (id) => {
      try {
        setLoading(true);
        await deleteTrekSection(id);
        toast.success("Section deleted successfully");
        fetchData();
        if (onSectionChange) {
          onSectionChange();
        }
      } catch (err) {
        console.error("Error deleting section:", err);
        toast.error("Failed to delete section");
      } finally {
        setLoading(false);
        setDeleteConfirmation(null);
      }
    };

    const handleToggleStatus = async (section) => {
      try {
        setLoading(true);
        await updateTrekSection(section._id, {
          ...section,
          isActive: !section.isActive,
        });
        toast.success(
          `Section ${!section.isActive ? "activated" : "deactivated"} successfully`
        );
        fetchData();
        if (onSectionChange) {
          onSectionChange();
        }
      } catch (err) {
        console.error("Error toggling section status:", err);
        toast.error("Failed to update section status");
      } finally {
        setLoading(false);
      }
    };

    const handleEdit = (section) => {
      setCurrentSection({
        _id: section._id,
        title: section.title,
        type: section.type || "trek",
        treks: section.treks?.map((t) => t._id) || [],
        isActive: section.isActive,
        displayOrder: section.displayOrder,
        // Banner fields
        bannerImage: section.bannerImage || "",
        overlayText: section.overlayText || "",
        overlayColor: section.overlayColor || "#000000",
        overlayOpacity: section.overlayOpacity || 0.5,
        textColor: section.textColor || "#FFFFFF",
        linkToTrek: section.linkToTrek?._id || "",
        couponCode: section.couponCode || "",
        discountPercentage: section.discountPercentage || "",
        mobileOptimized: section.mobileOptimized !== undefined ? section.mobileOptimized : true,
      });
      setIsEditing(true);
      setInternalShowModal(true);
    };

    const resetForm = () => {
      setCurrentSection({
        title: "",
        type: "trek",
        treks: [],
        isActive: true,
        displayOrder: 0,
        // Banner fields
        bannerImage: "",
        overlayText: "",
        overlayColor: "#000000",
        overlayOpacity: 0.5,
        textColor: "#FFFFFF",
        linkToTrek: "",
        couponCode: "",
        discountPercentage: "",
        mobileOptimized: true,
      });
      setIsEditing(false);
      setShowPreview(false);
    };

    const closeModal = () => {
      setInternalShowModal(false);
      resetForm();
    };

    // Create preview data for banner
    const getPreviewBanner = () => {
      if (currentSection.type !== 'banner') return null;
      
      const selectedTrek = allTreks.find(trek => trek._id === currentSection.linkToTrek);
      
      return {
        ...currentSection,
        linkToTrek: selectedTrek || { slug: 'preview-trek' }
      };
    };

    const filteredSections = sections.filter(section => {
      if (filterType === 'all') return true;
      return section.type === filterType;
    });

    if (loading && sections.length === 0) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Trek Sections & Banners</h2>
              <p className="text-gray-600 mt-1">Manage your homepage content sections and promotional banners</p>
            </div>
            <button
              onClick={() => setInternalShowModal(true)}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <FaPlus className="w-4 h-4 mr-2" />
              Add New Section
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <FaFilter className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filterType === 'all'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Sections
              </button>
              <button
                onClick={() => setFilterType('trek')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filterType === 'trek'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Trek Sections
              </button>
              <button
                onClick={() => setFilterType('banner')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filterType === 'banner'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Banner Sections
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Sections List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <FaSort className="w-3 h-3" />
                      <span>Order</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSections.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <FaMountain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No sections found</p>
                        <p className="text-sm">Create your first section to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSections.map((section) => (
                    <tr key={section._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                          <span className="text-sm font-semibold text-gray-700">
                            {section.displayOrder}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {section.type === 'banner' ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FaImage className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-900 capitalize">
                                Banner
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <FaMountain className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-900 capitalize">
                                Trek
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {section.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {section._id.slice(-8)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {section.type === 'trek' ? (
                          <div className="flex items-center space-x-2">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              {section.treks?.length || 0} trek{section.treks?.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-gray-900 font-medium truncate max-w-xs">
                              {section.overlayText}
                            </div>
                            {section.couponCode && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                {section.couponCode}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            section.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mr-1.5 ${
                            section.isActive ? "bg-green-400" : "bg-red-400"
                          }`} />
                          {section.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleStatus(section)}
                            className={`p-2 rounded-lg transition-colors ${
                              section.isActive
                                ? "text-red-600 hover:text-red-900 hover:bg-red-50"
                                : "text-green-600 hover:text-green-900 hover:bg-green-50"
                            }`}
                            title={section.isActive ? "Deactivate" : "Activate"}
                          >
                            {section.isActive ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleEdit(section)}
                            className="p-2 rounded-lg text-blue-600 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmation(section._id)}
                            className="p-2 rounded-lg text-red-600 hover:text-red-900 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enhanced Modal */}
        <Modal
          isOpen={internalShowModal}
          onClose={closeModal}
          title={isEditing ? "Edit Section" : "Add New Section"}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selector with Visual Enhancement */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Section Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentSection(prev => ({ ...prev, type: 'trek' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    currentSection.type === 'trek'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      currentSection.type === 'trek' ? 'bg-emerald-100' : 'bg-gray-100'
                    }`}>
                      <FaMountain className={`w-4 h-4 ${
                        currentSection.type === 'trek' ? 'text-emerald-600' : 'text-gray-500'
                      }`} />
                    </div>
                    <div className="text-left">
                      <div className={`font-medium ${
                        currentSection.type === 'trek' ? 'text-emerald-900' : 'text-gray-900'
                      }`}>
                        Trek Section
                      </div>
                      <div className="text-xs text-gray-500">Display multiple treks</div>
                    </div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setCurrentSection(prev => ({ ...prev, type: 'banner' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    currentSection.type === 'banner'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      currentSection.type === 'banner' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <FaImage className={`w-4 h-4 ${
                        currentSection.type === 'banner' ? 'text-blue-600' : 'text-gray-500'
                      }`} />
                    </div>
                    <div className="text-left">
                      <div className={`font-medium ${
                        currentSection.type === 'banner' ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        Banner Section
                      </div>
                      <div className="text-xs text-gray-500">Promotional banner</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={currentSection.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Enter section title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  name="displayOrder"
                  value={currentSection.displayOrder}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Trek Section Fields */}
            {currentSection.type === 'trek' && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                  <FaMountain className="w-5 h-5 mr-2" />
                  Trek Selection
                </h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select Treks *
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-white">
                    {allTreks.map((trek) => (
                      <div key={trek._id} className="flex items-center mb-3 last:mb-0">
                        <input
                          type="checkbox"
                          id={`trek-${trek._id}`}
                          checked={currentSection.treks.includes(trek._id)}
                          onChange={() => handleTrekCheckboxChange(trek._id)}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`trek-${trek._id}`}
                          className="ml-3 block text-sm text-gray-900 cursor-pointer flex-1"
                        >
                          <span className="font-medium">{trek.name}</span>
                          <span className="text-gray-500 ml-2">• {trek.regionName}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Banner Section Fields */}
            {currentSection.type === 'banner' && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <FaImage className="w-5 h-5 mr-2" />
                  Banner Configuration
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Banner Image *
                    </label>
                    <ImageUploader
                      images={currentSection.bannerImage ? [currentSection.bannerImage] : []}
                      onChange={(images) => setCurrentSection(prev => ({
                        ...prev,
                        bannerImage: images.length > 0 ? images[0] : ""
                      }))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Overlay Text *
                    </label>
                    <textarea
                      name="overlayText"
                      value={currentSection.overlayText}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Text to display over the banner image"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Link to Trek (Optional)
                    </label>
                    <select
                      name="linkToTrek"
                      value={currentSection.linkToTrek}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select a trek (optional)</option>
                      {allTreks.map((trek) => (
                        <option key={trek._id} value={trek._id}>
                          {trek.name} - {trek.regionName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Overlay Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          name="overlayColor"
                          value={currentSection.overlayColor}
                          onChange={handleInputChange}
                          className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <span className="text-sm text-gray-600">{currentSection.overlayColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Text Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          name="textColor"
                          value={currentSection.textColor}
                          onChange={handleInputChange}
                          className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <span className="text-sm text-gray-600">{currentSection.textColor}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Overlay Opacity: {currentSection.overlayOpacity}
                    </label>
                    <input
                      type="range"
                      name="overlayOpacity"
                      min="0"
                      max="1"
                      step="0.1"
                      value={currentSection.overlayOpacity}
                      onChange={handleInputChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Coupon Code
                      </label>
                      <input
                        type="text"
                        name="couponCode"
                        value={currentSection.couponCode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Optional coupon code"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Discount Percentage
                      </label>
                      <input
                        type="number"
                        name="discountPercentage"
                        value={currentSection.discountPercentage}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="0-100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="mobileOptimized"
                      checked={currentSection.mobileOptimized}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Mobile Optimized
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Live Preview for Banner */}
            {currentSection.type === 'banner' && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FaPreview className="w-5 h-5 mr-2 text-blue-600" />
                    Live Preview
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                </div>
                
                {showPreview && (
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="max-w-md mx-auto">
                      {getPreviewBanner() && (
                        <TrekBannerSection banner={getPreviewBanner()} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={closeModal}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
              >
                {loading ? "Saving..." : isEditing ? "Update Section" : "Create Section"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Enhanced Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteConfirmation}
          onClose={() => setDeleteConfirmation(null)}
          title="Confirm Delete"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <FaTrash className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Section</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700">
              Are you sure you want to delete this section? This will permanently remove it from your homepage.
            </p>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmation)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Deleting..." : "Delete Section"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
);

TrekSectionManager.displayName = "TrekSectionManager";

export default TrekSectionManager;
