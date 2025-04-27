import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTicketById, addTicketResponse } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

function UserTicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const data = await getTicketById(id);
      setTicket(data);
    } catch (err) {
      console.error('Error fetching ticket:', err);
      setError('Failed to load ticket. Please try again later.');
      toast.error('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!response.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      setSubmitting(true);
      await addTicketResponse(id, response);
      toast.success('Response added successfully');
      setResponse('');
      fetchTicket(); // Refresh the ticket data
    } catch (err) {
      console.error('Error adding response:', err);
      toast.error('Failed to add response');
    } finally {
      setSubmitting(false);
    }
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

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <div className="mt-2">
                <Link to="/tickets" className="text-sm font-medium text-red-700 hover:text-red-600">
                  Go back to my tickets
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">Ticket not found.</p>
              <div className="mt-2">
                <Link to="/tickets" className="text-sm font-medium text-yellow-700 hover:text-yellow-600">
                  Go back to my tickets
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
          <Link to="/tickets" className="text-emerald-600 hover:text-emerald-700">
            Back to tickets
          </Link>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Ticket Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Details about your support ticket.</p>
            </div>
            <div className="flex items-center">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(ticket.status)}`}>
                {ticket.status}
              </span>
              <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeClass(ticket.priority)}`}>
                {ticket.priority} priority
              </span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Trek</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {ticket.booking?.trek?.name || 'Unknown Trek'}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(ticket.createdAt).toLocaleString()}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(ticket.updatedAt).toLocaleString()}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                {ticket.description}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Conversation</h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            {ticket.responses && ticket.responses.length > 0 ? (
              <div className="space-y-6">
                {ticket.responses.map((response, index) => (
                  <div key={index} className={`flex ${response.isAdmin ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-lg rounded-lg px-4 py-3 ${response.isAdmin ? 'bg-gray-100' : 'bg-emerald-100'}`}>
                      <div className="flex items-center mb-1">
                        <span className="font-medium text-sm">
                          {response.isAdmin ? 'Support Agent' : 'You'}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(response.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-line">{response.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No responses yet. Our support team will respond to your ticket soon.</p>
            )}

            {ticket.status !== 'closed' && (
              <form onSubmit={handleSubmitResponse} className="mt-6">
                <div>
                  <label htmlFor="response" className="block text-sm font-medium text-gray-700">
                    Add Response
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="response"
                      name="response"
                      rows={4}
                      className="shadow-sm focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    disabled={submitting}
                  >
                    {submitting ? 'Sending...' : 'Send Response'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserTicketDetail; 