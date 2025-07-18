import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getAllTickets, updateTicketStatus } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, open, in-progress, resolved, closed
  const [openMenu, setOpenMenu] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTickets: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10
  });
  const menuRef = useRef(null);

  useEffect(() => {
    fetchTickets();
  }, [currentPage, itemsPerPage, filter]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await getAllTickets(currentPage, itemsPerPage, filter);
      setTickets(Array.isArray(data.tickets) ? data.tickets : []);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load tickets. Please try again later.');
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await updateTicketStatus(ticketId, newStatus);
      toast.success(`Ticket status updated to ${newStatus}`);
      fetchTickets(); // Refresh the list
      setOpenMenu(null); // Close the menu
    } catch (err) {
      console.error('Error updating ticket status:', err);
      toast.error('Failed to update ticket status');
    }
  };

  const toggleMenu = (ticketId) => {
    setOpenMenu(openMenu === ticketId ? null : ticketId);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setOpenMenu(null); // Close any open menus when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    setOpenMenu(null);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to first page when changing filter
    setOpenMenu(null);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <p className="mt-2 text-sm text-gray-500">
          Manage customer support tickets
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-4">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  filter === 'all' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleFilterChange('open')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  filter === 'open' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => handleFilterChange('in-progress')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  filter === 'in-progress' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => handleFilterChange('resolved')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  filter === 'resolved' 
                    ? 'bg-green-100 text-green-800' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Resolved
              </button>
              <button
                onClick={() => handleFilterChange('closed')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  filter === 'closed' 
                    ? 'bg-gray-100 text-gray-800' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Closed
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket, Trek & Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject & Priority
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <tr key={ticket._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{ticket._id.substring(0, 8)}...
                        </div>
                        <div className="text-sm text-gray-500">
                          {ticket.booking?.trek?.name || 'Unknown Trek'}
                        </div>
                        <div className="text-sm text-gray-400">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {ticket.subject}
                        </div>
                        <div className="mt-1">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeClass(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {ticket.user?.name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {ticket.user?.email || 'No email'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="relative">
                          <button
                            onClick={() => toggleMenu(ticket._id)}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          
                          {openMenu === ticket._id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200" ref={menuRef}>
                              <div className="py-1">
                                <Link 
                                  to={`/admin/support/${ticket._id}`} 
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  View Details
                                </Link>
                                {ticket.status === 'open' && (
                                  <button
                                    onClick={() => handleStatusChange(ticket._id, 'in-progress')}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    Start Working
                                  </button>
                                )}
                                {ticket.status === 'in-progress' && (
                                  <button
                                    onClick={() => handleStatusChange(ticket._id, 'resolved')}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    Mark Resolved
                                  </button>
                                )}
                                {ticket.status === 'resolved' && (
                                  <button
                                    onClick={() => handleStatusChange(ticket._id, 'closed')}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    Close Ticket
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No tickets found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalTickets > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Show</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-sm text-gray-700">per page</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((pagination.currentPage - 1) * pagination.limit) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(pagination.currentPage * pagination.limit, pagination.totalTickets)}</span> of{' '}
                    <span className="font-medium">{pagination.totalTickets}</span> results
                  </div>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-emerald-50 border-emerald-500 text-emerald-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </div>
  );
}

export default AdminSupport; 