import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTreks, deleteTrek, toggleTrekStatus, getAllTreksWithCustomToggle, sendCustomTrekLink, updateTrek, removeBatch, addBatch, updateBatch, getAllRegions } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { PlusIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { FaEye, FaEyeSlash, FaEdit, FaTrash, FaChartLine, FaThList, FaThLarge, FaSearch } from 'react-icons/fa';


function AdminTrekList() {
  const [treks, setTreks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [trekToDelete, setTrekToDelete] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'enabled', 'disabled', 'with-bookings', 'most-booked'
  const [expandedTreks, setExpandedTreks] = useState(new Set());
  const [showCustomTreks, setShowCustomTreks] = useState(false);
  const [emailInputs, setEmailInputs] = useState({}); // { [trekId]: email }
  const [showEmailInput, setShowEmailInput] = useState({}); // { [trekId]: boolean }
  const [sending, setSending] = useState({}); // { [trekId]: boolean }
  // 1. Add state for editing trek and batch
  const [editingTrekId, setEditingTrekId] = useState(null);
  const [trekEditData, setTrekEditData] = useState({});
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [batchEditData, setBatchEditData] = useState({});
  const [newBatchData, setNewBatchData] = useState({ startDate: '', endDate: '', price: '', maxParticipants: 10 });
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchDeleteModal, setBatchDeleteModal] = useState({ isOpen: false, trekId: null, batchId: null, batchInfo: null });
  const DIFFICULTY_OPTIONS = ['Easy', 'Moderate', 'Difficult', 'Very Difficult'];
  const [regions, setRegions] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTreks();
    // Fetch regions for dropdown
    (async () => {
      try {
        const data = await getAllRegions();
        setRegions(data);
      } catch (err) {
        setRegions([]);
      }
    })();
  }, [showCustomTreks]);

  const fetchTreks = async () => {
    try {
      setLoading(true);
      const data = await getAllTreksWithCustomToggle(showCustomTreks);
      setTreks(data);
    } catch (err) {
      console.error('Error fetching treks:', err);
      setError('Failed to load treks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const response = await toggleTrekStatus(id, !currentStatus);
      setTreks(prevTreks => 
        prevTreks.map(trek => 
          trek._id === id ? { ...trek, isEnabled: !currentStatus } : trek
        )
      );
      toast.success(`Trek ${!currentStatus ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      console.error('Error toggling trek status:', error);
      toast.error('Failed to update trek status');
    }
  };

  const openDeleteModal = (trek) => {
    setTrekToDelete(trek);
    setDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setDeleteModal(false);
    setTrekToDelete(null);
  };

  const handleDeleteTrek = async () => {
    if (!trekToDelete) return;
    
    try {
      await deleteTrek(trekToDelete._id);
      setTreks(treks.filter(trek => trek._id !== trekToDelete._id));
      toast.success('Trek deleted successfully!');
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting trek:', error);
      toast.error('Failed to delete trek');
    }
  };

  // Helper to get region name from ID
  const getRegionName = (regionId, trek) => {
    // First try to use the regionName field from trek data
    if (trek && trek.regionName) {
      return trek.regionName;
    }
    // Fall back to regions lookup
    const region = regions.find(r => r._id === regionId);
    return region ? region.name : regionId;
  };

  // Filter and search treks
  const getFilteredAndSortedTreks = () => {
    let filteredTreks = [...treks];
    if (!showCustomTreks) {
      filteredTreks = filteredTreks.filter(trek => !trek.isCustom);
    }
    switch (filterStatus) {
      case 'enabled':
        filteredTreks = filteredTreks.filter(trek => trek.isEnabled);
        break;
      case 'disabled':
        filteredTreks = filteredTreks.filter(trek => !trek.isEnabled);
        break;
      case 'with-bookings':
        filteredTreks = filteredTreks.filter(trek => trek.bookings && trek.bookings.length > 0);
        break;
      case 'most-booked':
        filteredTreks = filteredTreks.filter(trek => trek.bookings && trek.bookings.length > 0)
          .sort((a, b) => (b.bookings?.length || 0) - (a.bookings?.length || 0));
        break;
      default:
        break;
    }
    // Search filter
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filteredTreks = filteredTreks.filter(trek =>
        trek.name.toLowerCase().includes(lower) ||
        getRegionName(trek.region, trek).toLowerCase().includes(lower) ||
        (trek.difficulty || '').toLowerCase().includes(lower)
      );
    }
    return filteredTreks;
  };

  const toggleTrekExpansion = (trekId) => {
    setExpandedTreks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trekId)) {
        newSet.delete(trekId);
      } else {
        newSet.add(trekId);
      }
      return newSet;
    });
  };

  // Helper to get custom trek link
  const getCustomTrekLink = (trek) => {
    const frontendUrl = process.env.REACT_APP_FRONTEND_URL || window.location.origin;
    return `${frontendUrl}/custom-trek/${trek._id}`;
  };

  // 2. Add handlers for trek edit
  const handleTrekEditChange = (e, trek) => {
    const { name, value } = e.target;
    setTrekEditData(prev => ({ ...prev, [name]: value }));
  };
  const startEditingTrek = (trek) => {
    setEditingTrekId(trek._id);
    setTrekEditData({
      name: trek.name,
      region: trek.region,
      difficulty: trek.difficulty,
      duration: trek.duration,
    });
  };
  const cancelEditingTrek = () => {
    setEditingTrekId(null);
    setTrekEditData({});
  };
  const saveTrekEdit = async (trek) => {
    try {
      setLoading(true);
      await updateTrek(trek._id, trekEditData);
      toast.success('Trek updated successfully!');
      fetchTreks();
      setEditingTrekId(null);
      setTrekEditData({});
    } catch (err) {
      toast.error('Failed to update trek');
    } finally {
      setLoading(false);
    }
  };

  // 3. Add handlers for batch edit
  const startEditingBatch = (batch) => {
    setEditingBatchId(batch._id);
    setBatchEditData({
      startDate: batch.startDate?.slice(0, 10),
      endDate: batch.endDate?.slice(0, 10) || '',
      price: batch.price,
      maxParticipants: batch.maxParticipants,
    });
  };
  const handleBatchEditChange = (e) => {
    const { name, value } = e.target;
    setBatchEditData(prev => ({ ...prev, [name]: value }));
  };
  const cancelEditingBatch = () => {
    setEditingBatchId(null);
    setBatchEditData({});
  };
  const saveBatchEdit = async (trekId, batchId) => {
    try {
      setBatchLoading(true);
      await updateBatch(trekId, batchId, batchEditData);
      toast.success('Batch updated successfully!');
      fetchTreks();
      setEditingBatchId(null);
      setBatchEditData({});
    } catch (err) {
      toast.error('Failed to update batch');
    } finally {
      setBatchLoading(false);
    }
  };
  const openBatchDeleteModal = (trekId, batchId, batchInfo) => {
    setBatchDeleteModal({
      isOpen: true,
      trekId,
      batchId,
      batchInfo
    });
  };

  const closeBatchDeleteModal = () => {
    setBatchDeleteModal({
      isOpen: false,
      trekId: null,
      batchId: null,
      batchInfo: null
    });
  };

  const confirmDeleteBatch = async () => {
    const { trekId, batchId } = batchDeleteModal;
    try {
      setBatchLoading(true);
      await removeBatch(trekId, batchId);
      toast.success('Batch deleted successfully!');
      fetchTreks();
      closeBatchDeleteModal();
    } catch (err) {
      toast.error('Failed to delete batch');
    } finally {
      setBatchLoading(false);
    }
  };

  // 4. Add handler for new batch creation
  const handleNewBatchChange = (e) => {
    const { name, value } = e.target;
    setNewBatchData(prev => ({ ...prev, [name]: value }));
  };
  const addNewBatch = async (trekId) => {
    try {
      setBatchLoading(true);
      await addBatch(trekId, newBatchData);
      toast.success('Batch added successfully!');
      fetchTreks();
      setNewBatchData({ startDate: '', endDate: '', price: '', maxParticipants: 10 });
    } catch (err) {
      toast.error('Failed to add batch');
    } finally {
      setBatchLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }



  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-extrabold text-gray-900">Manage Treks</h1>
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              placeholder="Search by name, region, difficulty..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1">
            <button
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <FaThList />
            </button>
            <button
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <FaThLarge />
            </button>
          </div>
          {/* Custom Trek Toggle and Filters */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Show:</label>
            <button
              onClick={() => setShowCustomTreks(false)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                !showCustomTreks
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Regular Treks
            </button>
            <button
              onClick={() => setShowCustomTreks(true)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                showCustomTreks
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Custom Treks
            </button>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
          >
            <option value="all">All Treks</option>
            <option value="enabled">Enabled Treks</option>
            <option value="disabled">Disabled Treks</option>
            <option value="with-bookings">Treks with Bookings</option>
            <option value="most-booked">Most Booked Treks</option>
          </select>
          <Link
            to="/admin/treks/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add New Trek
          </Link>
        </div>
      </div>

      {/* Trek List/Grid */}
      {viewMode === 'list' ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {getFilteredAndSortedTreks().length > 0 ? (
              getFilteredAndSortedTreks().map((trek) => (
                <li key={trek._id} className={`${!trek.isEnabled ? 'bg-gray-50' : ''}`}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between min-w-0">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="flex-shrink-0 h-12 w-12">
                          <img 
                            className={`h-12 w-12 rounded-md object-cover ${!trek.isEnabled ? 'opacity-50' : ''}`}
                            src={trek.images && trek.images.length > 0 ? trek.images[0] : 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'} 
                            alt={trek.name} 
                          />
                        </div>
                        <div className="ml-4 min-w-0 flex-1">
                          <div className={`text-sm font-medium ${!trek.isEnabled ? 'text-gray-500' : 'text-gray-900'} truncate`}> 
                            {trek.name}
                            {trek.isCustom && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                Custom
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {getRegionName(trek.region, trek)} • {trek.difficulty} • {trek.duration} days
                            {trek.bookings && trek.bookings.length > 0 && (
                              <span className="ml-2 text-emerald-600">
                                • {trek.bookings.length} {trek.bookings.length === 1 ? 'booking' : 'bookings'}
                              </span>
                            )}
                            {trek.isCustom && trek.customLinkExpiry && (
                              <span className="ml-2 text-orange-600">
                                • Expires {new Date(trek.customLinkExpiry).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-4">
                        <button
                          onClick={() => toggleTrekExpansion(trek._id)}
                          className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100"
                          title="Show Batches"
                        >
                          <ChevronDownIcon 
                            className={`w-4 h-4 sm:w-5 sm:h-5 transform transition-transform ${expandedTreks.has(trek._id) ? 'rotate-180' : ''}`}
                          />
                        </button>
                        <Link
                          to={`/admin/treks/${trek._id}/performance`}
                          className="p-1.5 sm:p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                          title="View Performance"
                        >
                          <FaChartLine className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(trek._id, trek.isEnabled)}
                          className={`p-1.5 sm:p-2 rounded-full ${
                            trek.isEnabled
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
                          title={trek.isEnabled ? 'Disable Trek' : 'Enable Trek'}
                        >
                          {trek.isEnabled ? <FaEye className="w-3 h-3 sm:w-4 sm:h-4" /> : <FaEyeSlash className="w-3 h-3 sm:w-4 sm:h-4" />}
                        </button>
                        {editingTrekId === trek._id ? (
                          <Link
                            to={`/admin/treks/edit/${trek._id}`}
                            className="p-1.5 sm:p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                            title="Edit Trek"
                          >
                            <FaEdit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Link>
                        ) : (
                          <button
                            onClick={() => startEditingTrek(trek)}
                            className="p-1.5 sm:p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                            title="Edit Trek"
                          >
                            <FaEdit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openDeleteModal(trek)}
                          className="p-1.5 sm:p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Expanded Batch Information */}
                    {expandedTreks.has(trek._id) && (
                      <div className="mt-4 border-t pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {/* Add New Batch Card */}
                          {editingBatchId === null && (
                            <div className="bg-white border border-dashed border-emerald-400 rounded-lg p-4 flex flex-col items-center justify-center shadow min-h-[220px]">
                              <h4 className="text-sm font-semibold mb-2">Add New Batch</h4>
                              <input type="date" name="startDate" value={newBatchData.startDate} onChange={handleNewBatchChange} className="mb-2 border px-2 py-1 rounded text-sm w-full" />
                              <input type="date" name="endDate" value={newBatchData.endDate} onChange={handleNewBatchChange} className="mb-2 border px-2 py-1 rounded text-sm w-full" />
                              <input type="number" name="price" value={newBatchData.price} onChange={handleNewBatchChange} placeholder="Price" className="mb-2 border px-2 py-1 rounded text-sm w-full" />
                              <input type="number" name="maxParticipants" value={newBatchData.maxParticipants} onChange={handleNewBatchChange} placeholder="Max Slots" className="mb-2 border px-2 py-1 rounded text-sm w-full" />
                              <button onClick={() => addNewBatch(trek._id)} className="w-full py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-xs font-medium mt-2" disabled={batchLoading}>Add</button>
                            </div>
                          )}
                          {/* Batch Cards */}
                          {trek.batches && trek.batches.length > 0 && [...trek.batches].sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).map((batch) => (
                            <div
                              key={batch._id}
                              className={`bg-gray-50 rounded-lg p-4 shadow flex flex-col justify-between min-h-[220px] relative border-2 border-transparent ${
                                editingBatchId === batch._id 
                                  ? 'cursor-default' 
                                  : 'cursor-pointer hover:border-emerald-500'
                              }`}
                              onClick={() => {
                                if (editingBatchId !== batch._id) {
                                  navigate(`/admin/treks/${trek._id}/performance?batchId=${batch._id}`);
                                }
                              }}
                            >
                              {/* Icon container with reserved space */}
                              <div className="absolute top-2 right-2 z-50 flex space-x-1">
                                <button 
                                  onClick={e => { 
                                    e.preventDefault();
                                    e.stopPropagation(); 
                                    startEditingBatch(batch); 
                                  }} 
                                  className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                  type="button"
                                  title="Edit Batch"
                                >
                                  <FaEdit className="w-4 h-4 text-blue-600" />
                                </button>
                                <button 
                                  onClick={e => { 
                                    e.preventDefault();
                                    e.stopPropagation(); 
                                    openBatchDeleteModal(trek._id, batch._id, {
                                      startDate: batch.startDate,
                                      endDate: batch.endDate,
                                      price: batch.price
                                    }); 
                                  }} 
                                  className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                                  type="button"
                                  title="Delete Batch"
                                >
                                  <FaTrash className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                              <div className="pt-8"> {/* Add top padding to avoid overlap */}
                                {editingBatchId === batch._id ? (
                                  <>
                                    <input type="date" name="startDate" value={batchEditData.startDate} onChange={handleBatchEditChange} className="mb-2 border px-2 py-1 rounded text-sm w-full" />
                                    <input type="date" name="endDate" value={batchEditData.endDate} onChange={handleBatchEditChange} className="mb-2 border px-2 py-1 rounded text-sm w-full" />
                                    <input type="number" name="price" value={batchEditData.price} onChange={handleBatchEditChange} className="mb-2 border px-2 py-1 rounded text-sm w-full" />
                                    <input type="number" name="maxParticipants" value={batchEditData.maxParticipants} onChange={handleBatchEditChange} className="mb-2 border px-2 py-1 rounded text-sm w-full" />
                                    <div className="flex space-x-2 mt-2">
                                      <button 
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          saveBatchEdit(trek._id, batch._id);
                                        }} 
                                        className="flex-1 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                                        disabled={batchLoading}
                                        type="button"
                                      >
                                        Save
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          cancelEditingBatch();
                                        }} 
                                        className="flex-1 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-gray-500"
                                        type="button"
                                      >
                                        Cancel
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          openBatchDeleteModal(trek._id, batch._id, {
                                            startDate: batch.startDate,
                                            endDate: batch.endDate,
                                            price: batch.price
                                          });
                                        }} 
                                        className="flex-1 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500" 
                                        disabled={batchLoading}
                                        type="button"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-1 truncate">{new Date(batch.startDate).toLocaleDateString('en-GB')} - {new Date(batch.endDate).toLocaleDateString('en-GB')}</h4>
                                    <div className="text-xs text-gray-500 mb-2">Price: <span className="font-semibold">₹{batch.price}</span></div>
                                    <div className="text-xs text-gray-500 mb-2">Slots: <span className="font-semibold">{batch.maxParticipants}</span></div>
                                    <div className="text-xs text-gray-500 mb-2">Available: <span className="font-semibold">{batch.maxParticipants - (batch.actualCurrentParticipants || batch.currentParticipants || 0)}</span></div>
                                    <div className="text-xs text-blue-700 font-semibold mt-auto">{batch.actualCurrentParticipants || batch.currentParticipants || 0} Bookings</div>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom Trek Link and Email Buttons */}
                    {trek.isCustom && (
                      <div className="mt-2 flex flex-col md:flex-row md:items-center gap-2">
                        {/* Copy Link Button */}
                        <button
                          className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 text-xs font-medium"
                          onClick={() => {
                            navigator.clipboard.writeText(getCustomTrekLink(trek));
                            toast.success('Custom trek link copied!');
                          }}
                        >
                          Copy Link
                        </button>
                        {/* Share via Email Button */}
                        <button
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-medium"
                          onClick={() => setShowEmailInput(prev => ({ ...prev, [trek._id]: !prev[trek._id] }))}
                        >
                          Share via Email
                        </button>
                        {/* Email Input and Send Button */}
                        {showEmailInput[trek._id] && (
                          <div className="flex flex-col md:flex-row md:items-center gap-2 mt-2">
                            <input
                              type="email"
                              placeholder="Enter email address"
                              className="border px-2 py-1 rounded text-sm"
                              value={emailInputs[trek._id] || ''}
                              onChange={e => setEmailInputs(prev => ({ ...prev, [trek._id]: e.target.value }))}
                              disabled={sending[trek._id]}
                              style={{ minWidth: 220 }}
                            />
                            <button
                              className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-xs font-medium"
                              disabled={sending[trek._id]}
                              onClick={async () => {
                                const email = emailInputs[trek._id];
                                if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                                  toast.error('Please enter a valid email address.');
                                  return;
                                }
                                setSending(prev => ({ ...prev, [trek._id]: true }));
                                try {
                                  await sendCustomTrekLink(trek._id, email);
                                  toast.success('Custom trek link sent!');
                                  setShowEmailInput(prev => ({ ...prev, [trek._id]: false }));
                                  setEmailInputs(prev => ({ ...prev, [trek._id]: '' }));
                                } catch (err) {
                                  toast.error('Failed to send email.');
                                } finally {
                                  setSending(prev => ({ ...prev, [trek._id]: false }));
                                }
                              }}
                            >
                              {sending[trek._id] ? 'Sending...' : 'Send'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-4 text-gray-500">No treks found.</li>
            )}
          </ul>
        </div>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {getFilteredAndSortedTreks().length > 0 ? (
            getFilteredAndSortedTreks().map((trek) => (
              <div key={trek._id} className={`bg-white shadow rounded-lg p-3 sm:p-4 flex flex-col min-w-0 ${!trek.isEnabled ? 'opacity-60' : ''}`}> 
                <img
                  className="h-32 sm:h-40 w-full object-cover rounded-md mb-3"
                  src={trek.images && trek.images.length > 0 ? trek.images[0] : 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'}
                  alt={trek.name}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-base sm:text-lg font-semibold text-gray-900 mb-1 flex items-center">
                    <span className="truncate">{trek.name}</span>
                    {trek.isCustom && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 flex-shrink-0">
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 mb-2 truncate">
                    {getRegionName(trek.region, trek)} • {trek.difficulty} • {trek.duration} days
                  </div>
                  {trek.bookings && trek.bookings.length > 0 && (
                    <div className="text-xs text-emerald-600 mb-1">
                      {trek.bookings.length} {trek.bookings.length === 1 ? 'booking' : 'bookings'}
                    </div>
                  )}
                  {trek.isCustom && trek.customLinkExpiry && (
                    <div className="text-xs text-orange-600 mb-1">
                      Expires {new Date(trek.customLinkExpiry).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end gap-1 sm:gap-2 mt-3">
                  <Link
                    to={`/admin/treks/${trek._id}/performance`}
                    className="p-1.5 sm:p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                    title="View Performance"
                  >
                    <FaChartLine className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Link>
                  <button
                    onClick={() => handleToggleStatus(trek._id, trek.isEnabled)}
                    className={`p-1.5 sm:p-2 rounded-full ${
                      trek.isEnabled
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                    }`}
                    title={trek.isEnabled ? 'Disable Trek' : 'Enable Trek'}
                  >
                    {trek.isEnabled ? <FaEye className="w-3 h-3 sm:w-4 sm:h-4" /> : <FaEyeSlash className="w-3 h-3 sm:w-4 sm:h-4" />}
                  </button>
                  <Link
                    to={`/admin/treks/edit/${trek._id}`}
                    className="p-1.5 sm:p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                    title="Edit Trek"
                  >
                    <FaEdit className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Link>
                  <button
                    onClick={() => openDeleteModal(trek)}
                    className="p-1.5 sm:p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                    title="Delete Trek"
                  >
                    <FaTrash className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500 col-span-full">No treks found.</div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal}
        onClose={closeDeleteModal}
        title="Delete Trek"
        size="small"
      >
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete "{trekToDelete?.name}"? This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            onClick={handleDeleteTrek}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={closeDeleteModal}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Batch Delete Confirmation Modal */}
      <Modal
        isOpen={batchDeleteModal.isOpen}
        onClose={closeBatchDeleteModal}
        title="Delete Batch"
        size="small"
      >
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete this batch?
              </p>
              {batchDeleteModal.batchInfo && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                  <p><strong>Date:</strong> {new Date(batchDeleteModal.batchInfo.startDate).toLocaleDateString()} - {new Date(batchDeleteModal.batchInfo.endDate).toLocaleDateString()}</p>
                  <p><strong>Price:</strong> ₹{batchDeleteModal.batchInfo.price}</p>
                </div>
              )}
              <p className="text-sm text-red-600 mt-2">
                This action cannot be undone and will remove all associated data.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={confirmDeleteBatch}
            disabled={batchLoading}
          >
            {batchLoading ? 'Deleting...' : 'Delete'}
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={closeBatchDeleteModal}
            disabled={batchLoading}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default AdminTrekList; 