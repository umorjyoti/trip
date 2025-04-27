import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrekById, createBooking } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

function Booking() {
  const { trekId, batchId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [trek, setTrek] = useState(null);
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    participants: 1,
    specialRequirements: ''
  });

  useEffect(() => {
    const fetchTrekAndBatch = async () => {
      try {
        setLoading(true);
        const trekData = await getTrekById(trekId);
        setTrek(trekData);
        
        // Find the selected batch
        const selectedBatch = trekData.batches.find(b => b._id === batchId);
        if (!selectedBatch) {
          throw new Error('Selected batch not found');
        }
        setBatch(selectedBatch);
      } catch (err) {
        console.error('Error fetching trek details:', err);
        setError('Failed to load trek details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrekAndBatch();
  }, [trekId, batchId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.participants < 1) {
      toast.error('Number of participants must be at least 1');
      return;
    }
    
    if (formData.participants > batch.maxParticipants - batch.currentParticipants) {
      toast.error(`Only ${batch.maxParticipants - batch.currentParticipants} spots available for this batch`);
      return;
    }
    
    try {
      setLoading(true);
      const bookingData = {
        trek: trekId,
        batch: batchId,
        participants: parseInt(formData.participants),
        specialRequirements: formData.specialRequirements,
        totalAmount: batch.price * parseInt(formData.participants)
      };
      
      const response = await createBooking(bookingData);
      toast.success('Booking created successfully!');
      navigate(`/booking-confirmation/${response._id}`);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!trek || !batch) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">Trek or batch not found. Please go back and try again.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const availableSpots = batch.maxParticipants - batch.currentParticipants;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Book Your Trek</h1>
        <p className="mt-2 text-sm text-gray-500">
          Complete the form below to book your spot on {trek.name}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Trek Summary */}
        <div className="md:col-span-1">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Trek Details</h2>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Trek Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{trek.name}</dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Region</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{trek.region?.name || 'N/A'}</dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Difficulty</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{trek.difficulty}</dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Duration</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{trek.duration} days</dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Batch Dates</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date(batch.startDate).toLocaleDateString()} - {new Date(batch.endDate).toLocaleDateString()}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Price per Person</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">${batch.price}</dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Available Spots</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{availableSpots}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        
        {/* Booking Form */}
        <div className="md:col-span-2">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Booking Information</h2>
              <p className="mt-1 text-sm text-gray-500">Please fill in the details for your booking</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="participants" className="block text-sm font-medium text-gray-700">
                      Number of Participants *
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="participants"
                        id="participants"
                        min="1"
                        max={availableSpots}
                        required
                        value={formData.participants}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {availableSpots <= 3 ? (
                        <span className="text-red-500">Only {availableSpots} spots left!</span>
                      ) : (
                        `Maximum ${availableSpots} participants allowed`
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="specialRequirements" className="block text-sm font-medium text-gray-700">
                      Special Requirements
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="specialRequirements"
                        name="specialRequirements"
                        rows="4"
                        value={formData.specialRequirements}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-emerald-500 focus:border-emerald-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Any dietary restrictions, medical conditions, or other special requirements"
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-lg font-medium text-gray-900">Booking Summary</h3>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-500">Price per person</p>
                        <p className="text-sm font-medium text-gray-900">${batch.price}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-500">Number of participants</p>
                        <p className="text-sm font-medium text-gray-900">{formData.participants}</p>
                      </div>
                      <div className="border-t border-gray-200 pt-2 flex justify-between">
                        <p className="text-base font-medium text-gray-900">Total Amount</p>
                        <p className="text-base font-medium text-gray-900">${batch.price * formData.participants}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate(`/treks/${trekId}`)}
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || availableSpots === 0}
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Processing...' : 'Confirm Booking'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Booking; 