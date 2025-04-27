import React, { useState, useEffect } from 'react';
import { getLeads, updateLead, deleteLead } from '../../services/api';
import { toast } from 'react-toastify';
import { FaSearch, FaFilter, FaEnvelope, FaPhone, FaCalendarAlt, FaEllipsisH } from 'react-icons/fa';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';

const LeadsManagement = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    dateRange: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [statusOptions] = useState(['new', 'contacted', 'qualified', 'converted', 'lost']);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Fetch leads
  useEffect(() => {
    fetchLeads();
  }, [currentPage, filters, sortBy, sortOrder]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const queryParams = {
        page: currentPage,
        limit: 10,
        sortBy,
        sortOrder,
        ...filters
      };
      
      if (searchTerm) {
        queryParams.search = searchTerm;
      }
      
      const data = await getLeads(queryParams);
      console.log('API Response:', data); // Debug log
      
      // Handle different response formats
      if (Array.isArray(data)) {
        setLeads(data);
        setTotalPages(Math.ceil(data.length / 10) || 1);
      } else if (data && Array.isArray(data.leads)) {
        setLeads(data.leads);
        setTotalPages(data.totalPages || Math.ceil(data.leads.length / 10) || 1);
      } else if (data && typeof data === 'object') {
        // If data is an object but not in the expected format
        const extractedLeads = Object.values(data).filter(item => 
          item && typeof item === 'object' && item.name && item.email
        );
        console.log('Extracted leads:', extractedLeads);
        setLeads(extractedLeads);
        setTotalPages(Math.ceil(extractedLeads.length / 10) || 1);
      } else {
        console.error('Unexpected API response format:', data);
        setLeads([]);
        setError('Received unexpected data format from the server');
      }
      
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError('Failed to load leads. Please try again.');
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  // Format date without date-fns
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLeads();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      dateRange: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    if (!leadId) {
      console.error('Cannot update status: Lead ID is missing');
      toast.error('Cannot update lead status: Invalid lead ID');
      return;
    }
    
    try {
      console.log(`Updating lead ${leadId} status to ${newStatus}`);
      
      // Normalize status to lowercase for consistency
      const normalizedStatus = newStatus.toLowerCase();
      
      // Optimistically update the UI first for better UX
      setLeads(leads.map(lead => 
        lead._id === leadId ? { ...lead, status: normalizedStatus } : lead
      ));
      
      // Make the API call with normalized status
      const response = await updateLead(leadId, { status: normalizedStatus });
      console.log('Status update response:', response);
      
      // If the API call was successful, show success message
      toast.success('Lead status updated successfully');
      
      // If we have a selected lead and it's the one being updated, update that too
      if (selectedLead && selectedLead._id === leadId) {
        setSelectedLead({...selectedLead, status: normalizedStatus});
      }
      
      // Refresh leads to ensure we have the latest data
      fetchLeads();
      
    } catch (err) {
      console.error('Error updating lead status:', err);
      
      // Revert the optimistic update
      fetchLeads(); // Refresh to get the current state
      
      // Show error message
      toast.error(err.response?.data?.message || 'Failed to update lead status');
    }
  };

  const handleDeleteLead = async () => {
    if (!selectedLead) return;
    
    try {
      await deleteLead(selectedLead._id);
      setLeads(leads.filter(lead => lead._id !== selectedLead._id));
      setShowDeleteModal(false);
      setSelectedLead(null);
      toast.success('Lead deleted successfully');
    } catch (err) {
      console.error('Error deleting lead:', err);
      toast.error('Failed to delete lead');
    }
  };

  const openLeadDetails = (lead) => {
    setSelectedLead(lead);
    setShowLeadModal(true);
  };

  const confirmDelete = (lead) => {
    setSelectedLead(lead);
    setShowDeleteModal(true);
  };

  const toggleDropdown = (e, id) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return 'bg-gray-50 text-gray-700 border border-gray-200';
    
    // Normalize status to lowercase for comparison
    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case 'new':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'contacted':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'qualified':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'converted':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'lost':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  if (loading && leads.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-semibold text-gray-800">Leads Management</h1>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <form onSubmit={handleSearch} className="flex w-full md:w-auto">
              <input
                type="text"
                placeholder="Search leads..."
                className="px-4 py-2 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="bg-emerald-600 text-white px-4 py-2 rounded-r-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              >
                <FaSearch />
              </button>
            </form>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
            >
              <FaFilter className="text-gray-500" />
              <span>Filters</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="p-6 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Statuses</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                id="dateRange"
                name="dateRange"
                value={filters.dateRange}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">Last 3 Months</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {/* Debug info */}
        {/* {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 p-4 mb-6 rounded-lg text-xs">
            <p>Debug Info:</p>
            <p>Leads count: {leads?.length || 0}</p>
            <p>Loading: {loading ? 'true' : 'false'}</p>
            <p>Current page: {currentPage}</p>
            <p>Total pages: {totalPages}</p>
          </div>
        )} */}
        
        {leads.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No leads found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leads.map(lead => (
              <div 
                key={lead._id || `lead-${Math.random()}`} 
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                onClick={() => openLeadDetails(lead)}
              >
                <div className="p-5 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{lead.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusBadgeClass(lead.status)}`}>
                        {lead.status ? (lead.status.charAt(0).toUpperCase() + lead.status.slice(1)) : 'New'}
                      </span>
                    </div>
                    
                    <div className="relative">
                      <button
                        onClick={(e) => toggleDropdown(e, lead._id)}
                        className="p-2 text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none"
                      >
                        <FaEllipsisH />
                      </button>
                      
                      {activeDropdown === lead._id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openLeadDetails(lead);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              View Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDelete(lead);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-5 space-y-3">
                  <div className="flex items-center text-sm">
                    <FaEnvelope className="text-gray-400 mr-2 flex-shrink-0" />
                    <span className="text-gray-700 truncate">{lead.email}</span>
                  </div>
                  
                  {lead.phone && (
                    <div className="flex items-center text-sm">
                      <FaPhone className="text-gray-400 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{lead.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm">
                    <FaCalendarAlt className="text-gray-400 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{formatDate(lead.createdAt)}</span>
                  </div>
                  
                  {lead.trekName && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs font-medium text-gray-500 uppercase">Trek</span>
                      <p className="mt-1 text-sm text-gray-800">{lead.trekName}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 p-5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500 uppercase">Status</span>
                    <select
                      value={(lead.status || 'new').toLowerCase()}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(lead._id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`text-xs px-3 py-1 rounded-full ${getStatusBadgeClass(lead.status)}`}
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status.toLowerCase()}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-6 border-t border-gray-100">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
      
      {/* Lead Details Modal */}
      {showLeadModal && selectedLead && (
        <Modal
          isOpen={showLeadModal}
          onClose={() => setShowLeadModal(false)}
          title="Lead Details"
        >
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white text-2xl font-medium mr-4">
                {selectedLead.name ? selectedLead.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedLead.name}</h3>
                <div className="flex items-center mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedLead.status)}`}>
                    {selectedLead.status ? (selectedLead.status.charAt(0).toUpperCase() + selectedLead.status.slice(1)) : 'New'}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    Created on {formatDate(selectedLead.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="text-sm font-medium text-gray-500 uppercase mb-3">Contact Information</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <FaEnvelope className="mr-2" />
                      <span>Email</span>
                    </div>
                    <p className="text-gray-900">{selectedLead.email}</p>
                  </div>
                  
                  {selectedLead.phone && (
                    <div>
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <FaPhone className="mr-2" />
                        <span>Phone</span>
                      </div>
                      <p className="text-gray-900">{selectedLead.phone}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="text-sm font-medium text-gray-500 uppercase mb-3">Trek Information</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Trek Name</p>
                    <p className="text-gray-900">{selectedLead.trekName || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Source</p>
                    <p className="text-gray-900">{selectedLead.source || 'Direct'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {selectedLead.message && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 uppercase mb-3">Message</h4>
                <div className="bg-gray-50 rounded-xl p-5">
                  <p className="text-gray-700 whitespace-pre-line">{selectedLead.message}</p>
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 uppercase mb-3">Update Status</h4>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      handleStatusChange(selectedLead._id, status);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedLead.status && selectedLead.status.toLowerCase() === status.toLowerCase()
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowLeadModal(false)}
                className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 mr-2 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowLeadModal(false);
                  confirmDelete(selectedLead);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                Delete Lead
              </button>
            </div>
          </div>
        </Modal>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedLead && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Confirm Delete"
        >
          <div className="p-6">
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </div>
            </div>
            
            <p className="text-center text-gray-700 mb-6">
              Are you sure you want to delete the lead from <span className="font-semibold">{selectedLead.name}</span>? This action cannot be undone.
            </p>
            
            <div className="flex justify-center">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 mr-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLead}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LeadsManagement; 