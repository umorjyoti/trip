import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSupportTickets } from '../../services/api';
import { formatDate } from '../../utils/helpers';

const SupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: ''
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await getSupportTickets();
      setTickets(data);
    } catch (err) {
      setError('Failed to fetch support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = filters.status === 'all' || ticket.status === filters.status;
    const matchesPriority = filters.priority === 'all' || ticket.priority === filters.priority;
    const matchesSearch = ticket.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
                         ticket.user.name.toLowerCase().includes(filters.search.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <div className="flex space-x-4">
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search tickets..."
            className="px-4 py-2 border rounded-md"
          />
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            name="priority"
            value={filters.priority}
            onChange={handleFilterChange}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredTickets.map(ticket => (
            <li key={ticket._id}>
              <Link to={`/admin/support/${ticket._id}`} className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-emerald-600 truncate">
                        {ticket.subject}
                      </p>
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ticket.status === 'open' ? 'bg-red-100 text-red-800' :
                        ticket.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                        ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.status}
                      </span>
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="text-sm text-gray-500">
                        {formatDate(ticket.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {ticket.user.name}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        {ticket.user.email}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        {ticket.replies?.length || 0} replies
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SupportTickets; 