import React, { useState } from 'react';
import { createTicket } from '../services/api';
import { toast } from 'react-toastify';

function CreateTicketModal({ bookingId, onClose, onSuccess }) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!subject.trim() || !description.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await createTicket({
        bookingId,
        subject,
        description,
        priority
      });
      
      toast.success('Support ticket created successfully');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('Failed to create ticket. Please try again later.');
      toast.error('Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Create Support Ticket
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Please provide details about your issue and our support team will assist you.
                  </p>
                </div>

                {error && (
                  <div className="mt-2 bg-red-50 border-l-4 border-red-400 p-4">
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

                <form onSubmit={handleSubmit} className="mt-4">
                  <div className="mb-4">
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      className="mt-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateTicketModal; 