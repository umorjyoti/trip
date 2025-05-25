import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getAuthHeader } from "../services/api";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";

function ParticipantDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trekDetails, setTrekDetails] = useState(null);
  const [formData, setFormData] = useState({
    participants: [],
    pickupLocation: '',
    dropLocation: '',
    additionalRequests: ''
  });

  // Get the state passed from the booking page
  const { numberOfParticipants, addOns, trekId, batchId } = location.state || {};

  useEffect(() => {
    const fetchTrekDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/treks/${trekId}`, {
          headers: getAuthHeader()
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch trek details');
        }

        const data = await response.json();
        setTrekDetails(data);

        // Initialize participant forms based on numberOfParticipants
        setFormData(prev => ({
          ...prev,
          participants: Array(numberOfParticipants).fill().map(() => ({
            name: '',
            age: '',
            gender: '',
            medicalConditions: '',
            specialRequests: '',
            customFieldResponses: data.customFields?.map(field => ({
              fieldId: field._id,
              fieldName: field.name,
              fieldType: field.type,
              value: '',
              options: field.options
            })) || []
          }))
        }));

      } catch (error) {
        console.error('Error fetching trek details:', error);
        setError(error.message);
        toast.error('Failed to load trek details');
      } finally {
        setLoading(false);
      }
    };

    if (trekId) {
      fetchTrekDetails();
    } else {
      setError('Missing trek information');
      setLoading(false);
    }
  }, [trekId, numberOfParticipants]);

  const handleParticipantChange = (index, field, value) => {
    setFormData(prev => {
      const newParticipants = [...prev.participants];
      if (field.includes('.')) {
        // Handle nested custom field changes
        const [customField, nestedField] = field.split('.');
        newParticipants[index] = {
          ...newParticipants[index],
          customFieldResponses: newParticipants[index].customFieldResponses.map(response =>
            response.fieldName === customField
              ? { ...response, value }
              : response
          )
        };
      } else {
        // Handle regular field changes
        newParticipants[index] = {
          ...newParticipants[index],
          [field]: value
        };
      }
      return { ...prev, participants: newParticipants };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all required fields
    const requiredFields = ['name', 'age', 'gender'];
    const missingFields = formData.participants.some(participant =>
      requiredFields.some(field => !participant[field])
    );

    if (missingFields) {
      toast.error('Please fill in all required fields for all participants');
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${id}/participants`, {
        method: 'PUT',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          participants: formData.participants,
          pickupLocation: formData.pickupLocation,
          dropLocation: formData.dropLocation,
          additionalRequests: formData.additionalRequests
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update participant details');
      }

      toast.success('Participant details saved successfully');
      navigate(`/booking-detail/${id}`);
    } catch (error) {
      console.error('Error saving participant details:', error);
      toast.error(error.message || 'Failed to save participant details');
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
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Participant Details
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Please fill in the details for all participants
          </p>
        </div>

        <form onSubmit={handleSubmit} className="border-t border-gray-200">
          <div className="px-4 py-5 sm:px-6 space-y-6">
            {formData.participants.map((participant, index) => (
              <div key={index} className="border-b border-gray-200 pb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Participant {index + 1}
                </h4>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor={`name-${index}`} className="block text-sm font-medium text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id={`name-${index}`}
                      value={participant.name}
                      onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label htmlFor={`age-${index}`} className="block text-sm font-medium text-gray-700">
                      Age <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id={`age-${index}`}
                      value={participant.age}
                      onChange={(e) => handleParticipantChange(index, 'age', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      required
                      min="1"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor={`gender-${index}`} className="block text-sm font-medium text-gray-700">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      id={`gender-${index}`}
                      value={participant.gender}
                      onChange={(e) => handleParticipantChange(index, 'gender', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor={`medical-${index}`} className="block text-sm font-medium text-gray-700">
                      Medical Conditions
                    </label>
                    <textarea
                      id={`medical-${index}`}
                      value={participant.medicalConditions}
                      onChange={(e) => handleParticipantChange(index, 'medicalConditions', e.target.value)}
                      rows="2"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      placeholder="List any medical conditions or allergies"
                    />
                  </div>

                  {participant.customFieldResponses?.map((field, fieldIndex) => (
                    <div key={fieldIndex} className="sm:col-span-6">
                      <label htmlFor={`custom-${index}-${fieldIndex}`} className="block text-sm font-medium text-gray-700">
                        {field.fieldName}
                      </label>
                      {field.fieldType === 'select' ? (
                        <select
                          id={`custom-${index}-${fieldIndex}`}
                          value={field.value}
                          onChange={(e) => handleParticipantChange(index, `${field.fieldName}.value`, e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        >
                          <option value="">Select {field.fieldName}</option>
                          {field.options.map((option, optIndex) => (
                            <option key={optIndex} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.fieldType}
                          id={`custom-${index}-${fieldIndex}`}
                          value={field.value}
                          onChange={(e) => handleParticipantChange(index, `${field.fieldName}.value`, e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="space-y-6">
              <div>
                <label htmlFor="pickupLocation" className="block text-sm font-medium text-gray-700">
                  Pickup Location
                </label>
                <input
                  type="text"
                  id="pickupLocation"
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, pickupLocation: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Enter pickup location"
                />
              </div>

              <div>
                <label htmlFor="dropLocation" className="block text-sm font-medium text-gray-700">
                  Drop Location
                </label>
                <input
                  type="text"
                  id="dropLocation"
                  value={formData.dropLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, dropLocation: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Enter drop location"
                />
              </div>

              <div>
                <label htmlFor="additionalRequests" className="block text-sm font-medium text-gray-700">
                  Additional Requests
                </label>
                <textarea
                  id="additionalRequests"
                  value={formData.additionalRequests}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalRequests: e.target.value }))}
                  rows="3"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Any additional requests or requirements"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Save Details
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ParticipantDetailsPage; 