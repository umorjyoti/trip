import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllTickets, updateTicketStatus } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, open, in-progress, resolved, closed

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await getAllTickets();
      setTickets(Array.isArray(data) ? data : []);
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
    } catch (err) {
      console.error('Error updating ticket status:', err);
      toast.error('Failed to update ticket status');
    }
  };

  const filteredTickets = filter === 'all' 
    ? tickets 
    : tickets.filter(ticket => ticket.status === filter);

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
                onClick={() => setFilter('all')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  filter === 'all' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('open')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  filter === 'open' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => setFilter('in-progress')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  filter === 'in-progress' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setFilter('resolved')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  filter === 'resolved' 
                    ? 'bg-green-100 text-green-800' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Resolved
              </button>
              <button
                onClick={() => setFilter('closed')}
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
                    Ticket ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trek
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ticket._id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {ticket.subject}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ticket.booking?.trek?.name || 'Unknown Trek'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeClass(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link 
                          to={`/admin/support/${ticket._id}`} 
                          className="text-emerald-600 hover:text-emerald-900 mr-3"
                        >
                          View
                        </Link>
                        {ticket.status === 'open' && (
                          <button
                            onClick={() => handleStatusChange(ticket._id, 'in-progress')}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Start
                          </button>
                        )}
                        {ticket.status === 'in-progress' && (
                          <button
                            onClick={() => handleStatusChange(ticket._id, 'resolved')}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Resolve
                          </button>
                        )}
                        {ticket.status === 'resolved' && (
                          <button
                            onClick={() => handleStatusChange(ticket._id, 'closed')}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Close
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                      No tickets found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSupport; 