import React, { useState } from 'react';
import { createLead } from '../services/api';
import { toast } from 'react-toastify';
import { FaEnvelope, FaPhone, FaUser, FaQuestionCircle } from 'react-icons/fa';

function LeadCaptureForm({ trekId, trekName, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    requestCall: false
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast.error('Email is required');
      return;
    }
    
    setLoading(true);
    
    try {
      await createLead({
        ...formData,
        trekId,
        source: 'Trek Detail Page'
      });
      
      toast.success('Thank you for your interest! Our team will contact you soon.');
      onClose();
    } catch (error) {
      console.error('Error submitting lead:', error);
      toast.error('Failed to submit your information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Get Trek Information</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">Close</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {trekName && (
        <div className="mb-4 p-3 bg-emerald-50 rounded-md">
          <p className="text-emerald-800">
            <span className="font-medium">Trek:</span> {trekName}
          </p>
        </div>
      )}
      
      <p className="text-gray-600 mb-6">
        Leave your details and our team will contact you with more information, special offers, and answers to any questions you may have.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Your Name
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaUser className="text-gray-400" />
            </div>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="John Doe"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaEnvelope className="text-gray-400" />
            </div>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="you@example.com"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaPhone className="text-gray-400" />
            </div>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="(123) 456-7890"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Questions or Comments
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute top-3 left-3 flex items-start pointer-events-none">
              <FaQuestionCircle className="text-gray-400" />
            </div>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Any specific questions about this trek?"
            ></textarea>
          </div>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="requestCall"
            name="requestCall"
            checked={formData.requestCall}
            onChange={(e) => setFormData({ ...formData, requestCall: e.target.checked })}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
          />
          <label htmlFor="requestCall" className="ml-2 block text-sm text-gray-700">
            Request a call back from our team
          </label>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
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
                Processing...
              </>
            ) : (
              'Get Information'
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>By submitting this form, you agree to our privacy policy and terms of service.</p>
      </div>
    </div>
  );
}

export default LeadCaptureForm; 