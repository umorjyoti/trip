import React, { useState } from 'react';
import { createTicket } from '../services/api';
import { toast } from 'react-toastify';
import Modal from './Modal';
import { FaTag, FaFlag, FaAlignLeft } from 'react-icons/fa';

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
      await createTicket({ bookingId, subject, description, priority });
      toast.success('Support ticket created successfully');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError('Failed to create ticket. Please try again later.');
      toast.error('Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create Support Ticket"
      isOpen={true}
      onClose={onClose}
      size="large"
    >
      <p className="text-gray-600 mb-6">
        Please provide details about your issue and our support team will assist you.
      </p>
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject <span className="text-red-500">*</span>
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaTag className="text-gray-400" />
            </div>
            <input
              type="text"
              id="subject"
              name="subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Subject of your issue"
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaFlag className="text-gray-400" />
            </div>
            <select
              id="priority"
              name="priority"
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute top-3 left-3 flex items-start pointer-events-none">
              <FaAlignLeft className="text-gray-400" />
            </div>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Describe your issue in detail"
              required
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              'Create Ticket'
            )}
          </button>
        </div>
      </form>
      <div className="mt-4 text-xs text-gray-500">
        <p>By submitting this form, you agree to our privacy policy and terms of service.</p>
      </div>
    </Modal>
  );
}

export default CreateTicketModal; 