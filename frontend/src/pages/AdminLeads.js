import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLeads, updateLead, deleteLead, getAdmins, createLead, exportLeads } from '../services/api';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaFilter, FaSearch, FaUser, FaCalendarAlt, FaPhone, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
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
    closed: 0
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
          new: leadsData.filter(lead => lead.status === 'new').length,
          contacted: leadsData.filter(lead => lead.status === 'contacted').length,
          qualified: leadsData.filter(lead => lead.status === 'qualified').length,
          converted: leadsData.filter(lead => lead.status === 'converted').length,
          closed: leadsData.filter(lead => lead.status === 'closed').length
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
      setStats(prev => ({
        ...prev,
        [newStatus]: prev[newStatus] + 1,
        [leads.find(l => l._id === leadId).status]: prev[leads.find(l => l._id === leadId).status] - 1
      }));
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
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        [leads.find(l => l._id === leadId).status]: prev[leads.find(l => l._id === leadId).status] - 1
      }));
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
          updatedStats[lead.status]--;
          updatedStats[bulkUpdateStatus]++;
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
      
      // Get the filename from the response headers or use a default
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]
        : `leads-export.${fileType === 'excel' ? 'xlsx' : 'pdf'}`;

      // Create a blob from the response data
      const blob = new Blob([response.data], {
        type: fileType === 'excel' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'
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

      toast.success('Export completed successfully');
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
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Export
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <FaFilter className="mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
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

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 bg-white shadow rounded-lg p-4">
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Statuses</option>
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Converted">Converted</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                    Source
                  </label>
                  <select
                    id="source"
                    name="source"
                    value={filters.source}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Sources</option>
                    <option value="Trek Detail Page">Trek Detail Page</option>
                    <option value="Newsletter">Newsletter</option>
                    <option value="Referral">Referral</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex items-center">
                <div className="flex-1">
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="search"
                      id="search"
                      value={filters.search}
                      onChange={handleFilterChange}
                      className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Search by name, email or phone"
                    />
                  </div>
                </div>
                <div className="ml-4 flex space-x-2">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    Apply Filters
                  </button>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Additional Filters */}
        <div className="flex space-x-2 mb-4">
          <button
            type="button"
            onClick={() => setFilters(prev => ({ ...prev, requestCallback: !prev.requestCallback }))}
            className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
              filters.requestCallback
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FaPhone className="mr-2" />
            Call Requested
          </button>
          <button
            type="button"
            onClick={() => setFilters(prev => ({ ...prev, assignedToMe: !prev.assignedToMe }))}
            className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
              filters.assignedToMe
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FaUser className="mr-2" />
            Assigned to Me
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
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
                <p className="text-sm font-medium text-gray-500">Closed</p>
                <p className="text-lg font-semibold text-gray-900">{stats.closed}</p>
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
      {showEditModal && editingLead && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-semibold mb-4">Edit Lead</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editingLead.name || ''}
                    onChange={handleEditChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editingLead.email || ''}
                    onChange={handleEditChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={editingLead.phone || ''}
                    onChange={handleEditChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={editingLead.status || 'New'}
                    onChange={handleEditChange}
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
                  <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                  <select
                    name="assignedTo"
                    value={editingLead.assignedTo?._id || ''}
                    onChange={handleEditChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
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
                  <label className="block text-sm font-medium text-gray-700">Request Callback</label>
                  <select
                    name="requestCallback"
                    value={editingLead.requestCallback ? 'true' : 'false'}
                    onChange={(e) => handleEditChange({
                      target: {
                        name: 'requestCallback',
                        value: e.target.value === 'true'
                      }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  >
                    <option value="true">Requested</option>
                    <option value="false">Not Requested</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  name="notes"
                  value={editingLead.notes || ''}
                  onChange={handleEditChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && leadToDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Confirm Delete</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete the lead for <span className="font-medium text-gray-900">{leadToDelete.name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteLead(leadToDelete._id);
                  closeDeleteModal();
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-semibold mb-4">Create New Lead</h2>
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
          </div>
        </div>
      )}

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
      {showBulkUpdateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Bulk Update Status</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">
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
              <div className="mt-6 flex justify-end space-x-3">
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
          </div>
        </div>
      )}

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