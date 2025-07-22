import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSupportTicketById, updateSupportTicket, addSupportTicketReply } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import CustomDropdown from '../../components/CustomDropdown';
import { FaFlag, FaCheckCircle } from 'react-icons/fa';

const SupportTicketDetails = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reply, setReply] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const data = await getSupportTicketById(id);
      setTicket(data);
    } catch (err) {
      setError('Failed to fetch ticket details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      await updateSupportTicket(id, { status: newStatus });
      setTicket(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      setError('Failed to update ticket status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      setUpdating(true);
      await updateSupportTicket(id, { priority: newPriority });
      setTicket(prev => ({ ...prev, priority: newPriority }));
    } catch (err) {
      setError('Failed to update ticket priority');
    } finally {
      setUpdating(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;

    try {
      setUpdating(true);
      await addSupportTicketReply(id, { message: reply });
      setReply('');
      await fetchTicket(); // Refresh ticket to get updated replies
    } catch (err) {
      setError('Failed to add reply');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          {error}
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          Ticket not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Support Ticket #{ticket.ticketId}</h1>
        <Link
          to="/admin/support"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Back to Tickets
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {ticket.subject}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Created by {ticket.user.name} on {formatDate(ticket.createdAt)}
              </p>
            </div>
            <div className="flex space-x-4">
              <div className="w-32">
                <CustomDropdown
                  options={[
                    { value: 'open', label: 'Open' },
                    { value: 'in-progress', label: 'In Progress' },
                    { value: 'resolved', label: 'Resolved' },
                    { value: 'closed', label: 'Closed' }
                  ]}
                  value={ticket.status}
                  onChange={(option) => handleStatusChange(option.value)}
                  placeholder="Status"
                  disabled={updating}
                  icon={FaCheckCircle}
                />
              </div>
              <div className="w-32">
                <CustomDropdown
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'urgent', label: 'Urgent' }
                  ]}
                  value={ticket.priority}
                  onChange={(option) => handlePriorityChange(option.value)}
                  placeholder="Priority"
                  disabled={updating}
                  icon={FaFlag}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">User</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {ticket.user.name} ({ticket.user.email})
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {ticket.description}
              </dd>
            </div>
          </dl>
        </div>

        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:px-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Replies</h4>
            <div className="space-y-4">
              {ticket.replies.map((reply, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {reply.user.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(reply.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">
                    {reply.message}
                  </p>
                </div>
              ))}
            </div>

            <form onSubmit={handleReplySubmit} className="mt-6">
              <div>
                <label htmlFor="reply" className="block text-sm font-medium text-gray-700">
                  Add Reply
                </label>
                <textarea
                  id="reply"
                  name="reply"
                  rows={4}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="Type your reply here..."
                />
              </div>
              <div className="mt-4">
                <button
                  type="submit"
                  disabled={updating || !reply.trim()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  {updating ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportTicketDetails; 