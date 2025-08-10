import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLeads, updateLead, deleteLead, getAdmins, createLead, exportLeads } from '../services/api';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaFilter, FaSearch, FaUser, FaCalendarAlt, FaPhone, FaSort, FaSortUp, FaSortDown, FaEnvelope, FaQuestionCircle } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminLayout from '../components/AdminLayout';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import ExportModal from '../components/ExportModal';

function AdminLeads() {
  const { isAdmin, currentUser } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salesTeam, setSalesTeam] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [bulkUpdateStatus, setBulkUpdateStatus] = useState('New');
  const [showExportModal, setShowExportModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    source: '',
    startDate: '',
    endDate: '',
    search: '',
    requestCallback: false,
    assignedToMe: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'New',
    source: 'Other',
    notes: '',
    requestCallback: false
  });
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    qualified: 0,
    converted: 0,
    lost: 0
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const filterParams = {
          ...filters,
          assignedTo: filters.assignedToMe ? currentUser._id : ""
        };
        
        console.log('Sending filters to backend:', filterParams);
        
        const [leadsData, adminsData] = await Promise.all([
          getLeads(filterParams),
          isAdmin() ? getAdmins() : Promise.resolve([])
        ]);
        
        console.log('Received leads:', leadsData);
        
        setLeads(leadsData);
        setSalesTeam(adminsData);
        
        // Calculate stats
        const statsCounts = {
          total: leadsData.length,
          new: leadsData.filter(lead => lead.status === 'New').length,
          contacted: leadsData.filter(lead => lead.status === 'Contacted').length,
          qualified: leadsData.filter(lead => lead.status === 'Qualified').length,
          converted: leadsData.filter(lead => lead.status === 'Converted').length,
          lost: leadsData.filter(lead => lead.status === 'Lost').length
        };
        setStats(statsCounts);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching leads:', err);
        setError('Failed to load leads. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [filters, isAdmin, currentUser._id]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // The useEffect will trigger a refetch with the updated filters
  };

  const handleResetFilters = () => {
    setFilters({
      status: '',
      source: '',
      startDate: '',
      endDate: '',
      search: '',
      requestCallback: false,
      assignedToMe: false
    });
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await updateLead(leadId, { status: newStatus });
      
      // Update local state
      setLeads(leads.map(lead => 
        lead._id === leadId ? { ...lead, status: newStatus } : lead
      ));
      
      toast.success('Lead status updated successfully');
      
      // Update stats
      const updatedLead = leads.find(l => l._id === leadId);
      if (updatedLead) {
        setStats(prev => ({
          ...prev,
          [newStatus.toLowerCase()]: prev[newStatus.toLowerCase()] + 1,
          [updatedLead.status.toLowerCase()]: prev[updatedLead.status.toLowerCase()] - 1
        }));
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Failed to update lead status');
    }
  };

  const handleAssignLead = async (leadId, userId) => {
    try {
      await updateLead(leadId, { assignedTo: userId });
      
      // Update local state
      const updatedLeads = await getLeads(filters);
      setLeads(updatedLeads);
      
      toast.success('Lead assigned successfully');
    } catch (error) {
      console.error('Error assigning lead:', error);
      toast.error('Failed to assign lead');
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) {
      return;
    }
    
    try {
      await deleteLead(leadId);
      
      // Update local state
      setLeads(leads.filter(lead => lead._id !== leadId));
      
      toast.success('Lead deleted successfully');
      
      // Update stats
      const deletedLead = leads.find(l => l._id === leadId);
      if (deletedLead) {
        setStats(prev => ({
          ...prev,
          total: prev.total - 1,
          [deletedLead.status.toLowerCase()]: prev[deletedLead.status.toLowerCase()] - 1
        }));
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Failed to delete lead');
    }
  };

  const openEditModal = (lead) => {
    setEditingLead(lead);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setEditingLead(null);
    setShowEditModal(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await updateLead(editingLead._id, {
        name: editingLead.name,
        email: editingLead.email,
        phone: editingLead.phone,
        status: editingLead.status,
        notes: editingLead.notes,
        assignedTo: editingLead.assignedTo,
        requestCallback: editingLead.requestCallback
      });
      
      // Update local state
      const updatedLeads = await getLeads(filters);
      setLeads(updatedLeads);
      
      toast.success('Lead updated successfully');
      closeEditModal();
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingLead(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'Contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'Qualified':
        return 'bg-green-100 text-green-800';
      case 'Converted':
        return 'bg-emerald-100 text-emerald-800';
      case 'Lost':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openDeleteModal = (lead) => {
    setLeadToDelete(lead);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setLeadToDelete(null);
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      await createLead(newLead);
      setShowCreateModal(false);
      setNewLead({
        name: '',
        email: '',
        phone: '',
        status: 'New',
        source: 'Other',
        notes: '',
        requestCallback: false
      });
      toast.success('Lead created successfully');
      // Refresh the leads list
      const leadsData = await getLeads(filters);
      setLeads(leadsData);
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Failed to create lead');
    }
  };

  const handleNewLeadChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewLead(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectAllLeads = (e) => {
    if (e.target.checked) {
      setSelectedLeads(leads.map(lead => lead._id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId) => {
    setSelectedLeads(prev => {
      if (prev.includes(leadId)) {
        return prev.filter(id => id !== leadId);
      } else {
        return [...prev, leadId];
      }
    });
  };

  const handleBulkStatusUpdate = async () => {
    try {
      const promises = selectedLeads.map(leadId => 
        updateLead(leadId, { status: bulkUpdateStatus })
      );
      
      await Promise.all(promises);
      
      // Update local state
      setLeads(leads.map(lead => 
        selectedLeads.includes(lead._id) ? { ...lead, status: bulkUpdateStatus } : lead
      ));
      
      // Update stats
      const updatedStats = { ...stats };
      selectedLeads.forEach(leadId => {
        const lead = leads.find(l => l._id === leadId);
        if (lead) {
          updatedStats[lead.status.toLowerCase()]--;
          updatedStats[bulkUpdateStatus.toLowerCase()]++;
        }
      });
      setStats(updatedStats);
      
      // Clear selection
      setSelectedLeads([]);
      setShowBulkUpdateModal(false);
      
      toast.success(`Successfully updated ${selectedLeads.length} leads to ${bulkUpdateStatus}`);
    } catch (error) {
      console.error('Error updating leads:', error);
      toast.error('Failed to update some leads');
    }
  };

  const handleExport = async ({ fields, fileType, dateRange }) => {
    try {
      const response = await exportLeads({ fields, fileType, dateRange });
      
      if (fileType === 'pdf') {
        // For PDF: Open in new browser tab
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        
        // Clean up the URL object after a delay to ensure the PDF loads
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
        
        toast.success('PDF opened in new tab!');
      } else {
        // For Excel: Download as before
        const contentDisposition = response.headers['content-disposition'];
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1]
          : 'leads-export.xlsx';

        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success('Excel file downloaded successfully!');
      }
    } catch (error) {
      console.error('Error exporting leads:', error);
      toast.error(error.response?.data?.message || 'Failed to export leads');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <FaSort className="ml-1" />;
    }
    return sortConfig.direction === 'asc' ? (
      <FaSortUp className="ml-1" />
    ) : (
      <FaSortDown className="ml-1" />
    );
  };

  const sortedLeads = React.useMemo(() => {
    let sortableLeads = [...leads];
    if (sortConfig.key) {
      sortableLeads.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableLeads;
  }, [leads, sortConfig]);

  const paginatedLeads = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedLeads.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedLeads, currentPage]);

  const totalPages = Math.ceil(leads.length / itemsPerPage);

  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Sales Leads</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage and track potential customers who have expressed interest in your treks.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex space-x-4">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 ${
                showFilters
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FaFilter className="mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Export
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Create Lead
            </button>
          </div>
        </div>

        {/* Enhanced Filters Section */}
        {showFilters && (
          <div className="mt-6 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <FaFilter className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Filter Leads</h3>
                  <p className="text-sm text-gray-600">Refine your search to find specific leads</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Hide Filters
                </button>
              </div>
            </div>

            <form onSubmit={handleSearch} className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm placeholder-gray-500 transition-all duration-200"
                  placeholder="Search leads by name, email, or phone number..."
                />
              </div>

              {/* Main Filters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Status Filter */}
                <div className="space-y-2">
                  <label htmlFor="status" className="block text-sm font-semibold text-gray-700 flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Lead Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white transition-all duration-200"
                  >
                    <option value="">All Statuses</option>
                    <option value="New">🆕 New</option>
                    <option value="Contacted">📞 Contacted</option>
                    <option value="Qualified">✅ Qualified</option>
                    <option value="Converted">💰 Converted</option>
                    <option value="Lost">❌ Lost</option>
                  </select>
                </div>
                
                {/* Source Filter */}
                <div className="space-y-2">
                  <label htmlFor="source" className="block text-sm font-semibold text-gray-700 flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    Lead Source
                  </label>
                  <select
                    id="source"
                    name="source"
                    value={filters.source}
                    onChange={handleFilterChange}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white transition-all duration-200"
                  >
                    <option value="">All Sources</option>
                    <option value="Trek Detail Page">🏔️ Trek Detail Page</option>
                    <option value="Newsletter">📧 Newsletter</option>
                    <option value="Referral">👥 Referral</option>
                    <option value="Social Media">📱 Social Media</option>
                    <option value="Other">🔗 Other</option>
                  </select>
                </div>
                
                {/* Date Range */}
                <div className="space-y-2">
                  <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    From Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                    To Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white transition-all duration-200"
                  />
                </div>
              </div>

              {/* Quick Action Filters */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <FaFilter className="mr-2 text-emerald-600" />
                  Quick Filters
                </h4>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, requestCallback: !prev.requestCallback }))}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      filters.requestCallback
                        ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-200 shadow-sm'
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    <FaPhone className="mr-2" />
                    Call Requested
                    {filters.requestCallback && (
                      <span className="ml-2 bg-emerald-200 text-emerald-800 text-xs px-2 py-1 rounded-full">Active</span>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, assignedToMe: !prev.assignedToMe }))}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      filters.assignedToMe
                        ? 'bg-blue-100 text-blue-800 border-2 border-blue-200 shadow-sm'
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <FaUser className="mr-2" />
                    Assigned to Me
                    {filters.assignedToMe && (
                      <span className="ml-2 bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full">Active</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {filters.search || filters.status || filters.source || filters.startDate || filters.endDate || filters.requestCallback || filters.assignedToMe ? (
                    <span className="flex items-center">
                      <FaFilter className="mr-1" />
                      Filters applied
                    </span>
                  ) : (
                    <span>No filters applied</span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 shadow-sm"
                  >
                    <FaSearch className="mr-2" />
                    Apply Filters
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}



        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 mt-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gray-100 rounded-md p-3">
                <FaUser className="h-6 w-6 text-gray-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FaUser className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">New</p>
                <p className="text-lg font-semibold text-gray-900">{stats.new}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <FaPhone className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Contacted</p>
                <p className="text-lg font-semibold text-gray-900">{stats.contacted}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <FaUser className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Qualified</p>
                <p className="text-lg font-semibold text-gray-900">{stats.qualified}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <FaUser className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Converted</p>
                <p className="text-lg font-semibold text-gray-900">{stats.converted}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gray-100 rounded-md p-3">
                <FaUser className="h-6 w-6 text-gray-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Lost</p>
                <p className="text-lg font-semibold text-gray-900">{stats.lost}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="mt-6 bg-white shadow overflow-hidden rounded-lg">
          {loading ? (
            <div className="p-4 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="p-4 text-red-500">{error}</div>
          ) : leads.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No leads found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedLeads.length === leads.length}
                        onChange={handleSelectAllLeads}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                    </th>
                    <th 
                      scope="col" 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Lead
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        Status
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('assignedTo')}
                    >
                      <div className="flex items-center">
                        Assigned To
                        {getSortIcon('assignedTo')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center">
                        Created Date
                        {getSortIcon('createdAt')}
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Call Request
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedLeads.map((lead) => (
                    <tr key={lead._id}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead._id)}
                          onChange={() => handleSelectLead(lead._id)}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <FaUser className="text-emerald-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {lead.name || 'No Name'}
                            </div>
                            {lead.trekId && (
                              <div className="text-sm text-emerald-600 font-medium">
                                {lead.trekId.name}
                              </div>
                            )}
                            <div className="text-sm text-gray-500">
                              {lead.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              {lead.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                          className={`text-sm rounded-full px-3 py-1 font-medium ${getStatusColor(lead.status)}`}
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Converted">Converted</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <select
                          value={lead.assignedTo?._id || ''}
                          onChange={(e) => handleAssignLead(lead._id, e.target.value)}
                          className="text-sm border-gray-300 rounded-md"
                        >
                          <option value="">Unassigned</option>
                          {salesTeam.map(user => (
                            <option key={user._id} value={user._id}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lead.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          lead.requestCallback ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {lead.requestCallback ? 'Requested' : 'Not Requested'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/admin/leads/${lead._id}`}
                          className="text-emerald-600 hover:text-emerald-900 mr-3"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => openEditModal(lead)}
                          className="text-emerald-600 hover:text-emerald-900 mr-3"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => openDeleteModal(lead)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {leads.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, leads.length)}
                  </span>{' '}
                  of <span className="font-medium">{leads.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-emerald-50 border-emerald-500 text-emerald-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Lead Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={closeEditModal}
        title="Edit Lead"
        size="large"
      >
        <div className="space-y-4">
          <p className="text-gray-600 mb-6">
            Update the lead information below. All changes will be saved immediately.
          </p>
          
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  value={editingLead?.name || ''}
                  onChange={handleEditChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="John Doe"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  type="email"
                  id="edit-email"
                  name="email"
                  value={editingLead?.email || ''}
                  onChange={handleEditChange}
                  required
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="edit-phone"
                  name="phone"
                  value={editingLead?.phone || ''}
                  onChange={handleEditChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="(123) 456-7890"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="edit-status"
                name="status"
                value={editingLead?.status || 'New'}
                onChange={handleEditChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="edit-assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              <select
                id="edit-assignedTo"
                name="assignedTo"
                value={editingLead?.assignedTo?._id || ''}
                onChange={handleEditChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Unassigned</option>
                {salesTeam.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="edit-notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                  <FaQuestionCircle className="text-gray-400" />
                </div>
                <textarea
                  id="edit-notes"
                  name="notes"
                  value={editingLead?.notes || ''}
                  onChange={handleEditChange}
                  rows="3"
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Any additional notes about this lead?"
                ></textarea>
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="edit-requestCallback"
                name="requestCallback"
                checked={editingLead?.requestCallback || false}
                onChange={(e) => handleEditChange({
                  target: {
                    name: 'requestCallback',
                    value: e.target.checked
                  }
                })}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label htmlFor="edit-requestCallback" className="ml-2 block text-sm text-gray-700">
                Request a call back from our team
              </label>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={closeEditModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        title="Confirm Delete"
        size="small"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Are you sure you want to delete the lead for <span className="font-medium text-gray-900">{leadToDelete?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={closeDeleteModal}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                handleDeleteLead(leadToDelete._id);
                closeDeleteModal();
              }}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Lead Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Lead"
        size="large"
      >
        <form onSubmit={handleCreateLead}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={newLead.name}
                onChange={handleNewLeadChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={newLead.email}
                onChange={handleNewLeadChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                name="phone"
                value={newLead.phone}
                onChange={handleNewLeadChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={newLead.status}
                onChange={handleNewLeadChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Source</label>
              <select
                name="source"
                value={newLead.source}
                onChange={handleNewLeadChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              >
                <option value="Trek Detail Page">Trek Detail Page</option>
                <option value="Newsletter">Newsletter</option>
                <option value="Referral">Referral</option>
                <option value="Social Media">Social Media</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Request Callback</label>
              <input
                type="checkbox"
                name="requestCallback"
                checked={newLead.requestCallback}
                onChange={handleNewLeadChange}
                className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              value={newLead.notes}
              onChange={handleNewLeadChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700"
            >
              Create Lead
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Actions Dropdown */}
      {selectedLeads.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Bulk Actions ({selectedLeads.length})
              <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {showBulkActions && (
              <div className="origin-bottom-right absolute right-0 bottom-full mb-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowBulkActions(false);
                      setShowBulkUpdateModal(true);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk Update Modal */}
      <Modal
        isOpen={showBulkUpdateModal}
        onClose={() => setShowBulkUpdateModal(false)}
        title="Bulk Update Status"
        size="small"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            You are about to update {selectedLeads.length} leads. Please select the new status:
          </p>
          <select
            value={bulkUpdateStatus}
            onChange={(e) => setBulkUpdateStatus(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
          >
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowBulkUpdateModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBulkStatusUpdate}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Update
            </button>
          </div>
        </div>
      </Modal>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
      />
    </>
  );
}

export default AdminLeads; 