import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { getTrekById, getAuthHeader, createBooking } from "../services/api";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";

function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [trek, setTrek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [razorpayKey, setRazorpayKey] = useState(null);
  const [formData, setFormData] = useState({
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
    participants: [
      {
        name: "",
        age: "",
        gender: "",
        medicalConditions: "",
        specialRequests: "",
        addOns: [],
        customFieldResponses: [],
      },
    ],
    additionalNotes: "",
  });

  useEffect(() => {
    const fetchRazorpayKey = async () => {
      try {
        const response = await fetch("/api/payments/get-key", {
          headers: getAuthHeader()
        });
        const data = await response.json();
        
        if (!data.key) {
          throw new Error('Invalid API key received');
        }  
        setRazorpayKey(data.key);
      } catch (error) {
        console.error('Error fetching Razorpay key:', error);
        if (error.message === 'Please log in to proceed with booking') {
          navigate('/login', { state: { from: `/treks/${id}/book` } });
        } else {
          toast.error(error.message || 'Failed to initialize payment. Please try again.');
        }
      }
    };

    fetchRazorpayKey();
  }, [currentUser, id, navigate, getAuthHeader]);

  useEffect(() => {
    const fetchTrek = async () => {
      try {
        setLoading(true);
        const data = await getTrekById(id);
        setTrek(data);

        // Initialize custom fields for the first participant
        if (data.customFields && data.customFields.length > 0) {
          setFormData((prev) => ({
            ...prev,
            participants: prev.participants.map((participant) => ({
              ...participant,
              customFieldResponses: data.customFields.map((field) => ({
                fieldId: crypto.randomUUID(),
                fieldName: field.fieldName,
                fieldType: field.fieldType,
                value: field.fieldType === "checkbox" ? [] : "",
                options: field.options || [],
              })),
            })),
          }));
        }

        // Get the selected batch ID from location state
        const selectedBatchId = location.state?.selectedBatchId;

        // Find the selected batch or the first available batch
        const availableBatch = selectedBatchId
          ? data.batches.find((batch) => batch._id === selectedBatchId)
          : data.batches.find(
              (batch) => batch.currentParticipants < batch.maxParticipants
            );

        setSelectedBatch(availableBatch);
      } catch (err) {
        console.error("Error fetching trek:", err);
        setError("Failed to load trek details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTrek();
  }, [id, location.state]);

  const handleBatchSelect = (batch) => {
    setSelectedBatch(batch);
  };

  const handleEmergencyContactChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [name]: value,
      },
    }));
  };

  const handleParticipantChange = (index, e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.map((participant, i) =>
        i === index ? { ...participant, [name]: value } : participant
      ),
    }));
  };

  const handleCustomFieldChange = (participantIndex, fieldIndex, value) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.map((participant, i) => {
        if (i === participantIndex) {
          const updatedResponses = [...participant.customFieldResponses];
          updatedResponses[fieldIndex] = {
            ...updatedResponses[fieldIndex],
            value: value,
          };
          return {
            ...participant,
            customFieldResponses: updatedResponses,
          };
        }
        return participant;
      }),
    }));
  };

  const addParticipant = () => {
    setFormData((prev) => ({
      ...prev,
      participants: [
        ...prev.participants,
        {
          name: "",
          age: "",
          gender: "",
          medicalConditions: "",
          specialRequests: "",
          addOns: [],
          customFieldResponses: trek.customFields.map((field) => ({
            fieldId: crypto.randomUUID(),
            fieldName: field.fieldName,
            fieldType: field.fieldType,
            value: field.fieldType === "checkbox" ? [] : "",
            options: field.options || [],
          })),
        },
      ],
    }));
  };

  const removeParticipant = (index) => {
    if (formData.participants.length > 1) {
      setFormData((prev) => ({
        ...prev,
        participants: prev.participants.filter((_, i) => i !== index),
      }));
    }
  };

  const handleAddOnChange = (participantIndex, addOnId) => {
    setFormData((prev) => {
      // Create a deep copy of the participants array
      const newParticipants = [...prev.participants].map((participant, idx) => {
        if (idx === participantIndex) {
          // Create a new participant object with the existing properties
          const updatedParticipant = { ...participant };

          // Initialize addOns array if it doesn't exist
          updatedParticipant.addOns = updatedParticipant.addOns || [];

          // Toggle the add-on in the array
          if (updatedParticipant.addOns.includes(addOnId)) {
            updatedParticipant.addOns = updatedParticipant.addOns.filter(
              (id) => id !== addOnId
            );
          } else {
            updatedParticipant.addOns = [...updatedParticipant.addOns, addOnId];
          }

          return updatedParticipant;
        }
        return participant; // Return other participants unchanged
      });

      return { ...prev, participants: newParticipants };
    });
  };

  const validateForm = () => {
    // Validate emergency contact
    if (
      !formData.emergencyContact.name ||
      !formData.emergencyContact.phone ||
      !formData.emergencyContact.relationship
    ) {
      toast.error("Please fill in all emergency contact details");
      return false;
    }

    // Validate participants
    for (let i = 0; i < formData.participants.length; i++) {
      const participant = formData.participants[i];

      // Basic participant info
      if (!participant.name || !participant.age || !participant.gender) {
        toast.error(
          `Please fill in all required fields for Participant ${i + 1}`
        );
        return false;
      }

      // Custom fields validation
      if (trek.customFields) {
        for (let j = 0; j < trek.customFields.length; j++) {
          const field = trek.customFields[j];
          const response = participant.customFieldResponses[j];

          if (field.isRequired) {
            if (
              field.fieldType === "checkbox" &&
              (!response.value || response.value.length === 0)
            ) {
              toast.error(
                `Please select at least one option for ${
                  field.fieldName
                } for Participant ${i + 1}`
              );
              return false;
            } else if (field.fieldType !== "checkbox" && !response.value) {
              toast.error(
                `Please fill in ${field.fieldName} for Participant ${i + 1}`
              );
              return false;
            }
          }
        }
      }
    }

    // Validate batch selection
    if (!selectedBatch) {
      toast.error("Please select a batch");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      toast.info("Please log in to book this trek");
      navigate("/login", { state: { from: `/treks/${id}/book` } });
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      // Add unique IDs to each participant
      const participantsWithIds = formData.participants.map((participant) => ({
        ...participant,
        _id: crypto.randomUUID(),
      }));

      const bookingData = {
        trekId: id,
        batchId: selectedBatch._id,
        participants: formData.participants.length,
        participantDetails: participantsWithIds,
        emergencyContact: formData.emergencyContact,
        additionalNotes: formData.additionalNotes,
        totalPrice: calculateTotalPrice(),
      };

      const booking = await createBooking(bookingData);
      
      // Create Razorpay order
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: booking.totalPrice,
          bookingId: booking._id,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || 'Failed to create payment order');
      }

      const { order } = await orderResponse.json();

      // Initialize Razorpay
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: 'Trek Booking',
        description: 'Trek Booking Payment',
        order_id: order.id,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: booking._id,
              }),
            });

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json();
              throw new Error(errorData.message || 'Payment verification failed');
            }

            toast.success('Payment successful!');
            navigate(`/booking-detail/${booking._id}`, { state: { paymentStatus: 'success' } });
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error(error.message || 'Payment verification failed. Please contact support.');
            navigate(`/booking-detail/${booking._id}`, { state: { paymentStatus: 'failure' } });
          }
        },
        prefill: {
          name: currentUser.name,
          email: currentUser.email,
          contact: formData.emergencyContact.phone,
        },
        theme: {
          color: '#059669', // emerald-600
        },
      };

      console.log("options", options, razorpayKey);

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      };
      document.body.appendChild(script);

    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error(error.message || "Failed to create booking");
    }
  };

  const calculateTotalPrice = () => {
    if (!selectedBatch) return 0;

    let total = selectedBatch.price * formData.participants.length;

    // Add prices for selected add-ons
    formData.participants.forEach((participant) => {
      participant.addOns.forEach((addOnId) => {
        const addOn = trek.addOns.find((a) => a._id === addOnId);
        if (addOn && addOn.isEnabled) {
          total += addOn.price;
        }
      });
    });

    return total;
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

  const renderCustomField = (field, participantIndex, fieldIndex) => {
    const response =
      formData.participants[participantIndex].customFieldResponses[fieldIndex];

    switch (field.fieldType) {
      case "text":
        return (
          <input
            type="text"
            value={response.value}
            onChange={(e) =>
              handleCustomFieldChange(
                participantIndex,
                fieldIndex,
                e.target.value
              )
            }
            placeholder={field.placeholder}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            required={field.isRequired}
            aria-required={field.isRequired}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={response.value}
            onChange={(e) =>
              handleCustomFieldChange(
                participantIndex,
                fieldIndex,
                e.target.value
              )
            }
            placeholder={field.placeholder}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            required={field.isRequired}
            aria-required={field.isRequired}
          />
        );

      case "select":
        return (
          <select
            value={response.value}
            onChange={(e) =>
              handleCustomFieldChange(
                participantIndex,
                fieldIndex,
                e.target.value
              )
            }
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            required={field.isRequired}
            aria-required={field.isRequired}
          >
            <option value="">Select {field.fieldName}</option>
            {field.options.map((option, i) => (
              <option key={i} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <div className="mt-2 space-y-2">
            {field.options.map((option, i) => {
              const checkboxId = `participant-${participantIndex}-field-${fieldIndex}-option-${i}`;
              return (
                <div key={checkboxId} className="flex items-center">
                  <input
                    type="checkbox"
                    id={checkboxId}
                    checked={response.value.includes(option)}
                    onChange={(e) => {
                      const newValue = e.target.checked
                        ? [...response.value, option]
                        : response.value.filter((v) => v !== option);
                      handleCustomFieldChange(
                        participantIndex,
                        fieldIndex,
                        newValue
                      );
                    }}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    aria-required={field.isRequired}
                  />
                  <label
                    htmlFor={checkboxId}
                    className="ml-2 block text-sm text-gray-700"
                  >
                    {option}
                  </label>
                </div>
              );
            })}
            {field.isRequired && response.value.length === 0 && (
              <p className="mt-1 text-sm text-red-600">
                Please select at least one option
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <div>
                <Link to="/" className="text-gray-400 hover:text-gray-500">
                  <svg
                    className="flex-shrink-0 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  <span className="sr-only">Home</span>
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="flex-shrink-0 h-5 w-5 text-gray-300"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
                <Link
                  to={`/treks/${id}`}
                  className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  {trek.name}
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="flex-shrink-0 h-5 w-5 text-gray-300"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
                <span className="ml-4 text-sm font-medium text-gray-500">
                  Book Now
                </span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Booking Details
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Please fill in your booking information
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Emergency Contact Section */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Emergency Contact Details
                </h4>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="emergencyName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="emergencyName"
                      value={formData.emergencyContact.name}
                      onChange={handleEmergencyContactChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="emergencyPhone"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="emergencyPhone"
                      value={formData.emergencyContact.phone}
                      onChange={handleEmergencyContactChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="emergencyRelationship"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Relationship
                    </label>
                    <input
                      type="text"
                      name="relationship"
                      id="emergencyRelationship"
                      value={formData.emergencyContact.relationship}
                      onChange={handleEmergencyContactChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Participants Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-medium text-gray-900">
                    Participants
                  </h4>
                  <button
                    type="button"
                    onClick={addParticipant}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-emerald-700 bg-emerald-100 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    Add Participant
                  </button>
                </div>
                <div className="space-y-6">
                  {formData.participants.map((participant, index) => (
                    <div
                      key={index}
                      className="bg-white shadow overflow-hidden sm:rounded-lg mb-6"
                    >
                      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Participant {index + 1}
                        </h3>
                        {formData.participants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeParticipant(index)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Remove Participant
                          </button>
                        )}
                      </div>

                      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor={`participantName-${index}`}
                              className="block text-sm font-medium text-gray-700"
                            >
                              Full Name
                            </label>
                            <input
                              type="text"
                              name="name"
                              id={`participantName-${index}`}
                              value={participant.name}
                              onChange={(e) =>
                                handleParticipantChange(index, e)
                              }
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`participantAge-${index}`}
                              className="block text-sm font-medium text-gray-700"
                            >
                              Age
                            </label>
                            <input
                              type="number"
                              name="age"
                              id={`participantAge-${index}`}
                              value={participant.age}
                              onChange={(e) =>
                                handleParticipantChange(index, e)
                              }
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`participantGender-${index}`}
                              className="block text-sm font-medium text-gray-700"
                            >
                              Gender
                            </label>
                            <select
                              name="gender"
                              id={`participantGender-${index}`}
                              value={participant.gender}
                              onChange={(e) =>
                                handleParticipantChange(index, e)
                              }
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                              required
                            >
                              <option value="">Select Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label
                              htmlFor={`participantMedical-${index}`}
                              className="block text-sm font-medium text-gray-700"
                            >
                              Medical Conditions
                            </label>
                            <textarea
                              name="medicalConditions"
                              id={`participantMedical-${index}`}
                              rows="2"
                              value={participant.medicalConditions}
                              onChange={(e) =>
                                handleParticipantChange(index, e)
                              }
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                              placeholder="Any medical conditions or allergies"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label
                              htmlFor={`participantRequests-${index}`}
                              className="block text-sm font-medium text-gray-700"
                            >
                              Special Requests
                            </label>
                            <textarea
                              name="specialRequests"
                              id={`participantRequests-${index}`}
                              rows="2"
                              value={participant.specialRequests}
                              onChange={(e) =>
                                handleParticipantChange(index, e)
                              }
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                              placeholder="Any special requests or requirements"
                            />
                          </div>
                        </div>

                        {/* Custom Fields */}
                        {trek.customFields && trek.customFields.length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-900 mb-3">
                              Additional Information
                            </h5>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              {trek.customFields.map((field, fieldIndex) => (
                                <div
                                  key={fieldIndex}
                                  className={
                                    field.fieldType === "checkbox"
                                      ? "sm:col-span-2"
                                      : ""
                                  }
                                >
                                  <label className="block text-sm font-medium text-gray-700">
                                    {field.fieldName}
                                    {field.isRequired && (
                                      <span className="text-red-500">*</span>
                                    )}
                                  </label>
                                  {field.description && (
                                    <p className="mt-1 text-sm text-gray-500">
                                      {field.description}
                                    </p>
                                  )}
                                  {renderCustomField(field, index, fieldIndex)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add-ons Section */}
                        {trek.addOns && trek.addOns.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-900 mb-4">
                              Optional Add-ons
                            </h4>
                            <div className="space-y-4">
                              {trek.addOns
                                .filter((addOn) => addOn.isEnabled)
                                .map((addOn) => (
                                  <div
                                    key={`${addOn._id}`} // Using a composite key for uniqueness
                                    className="relative flex items-start"
                                  >
                                    <div className="flex items-center h-5">
                                      <input
                                        id={`addon=${addOn._id}`} // Adding a unique ID to each input
                                        type="checkbox"
                                        checked={
                                          formData.participants?.[
                                            index
                                          ]?.addOns?.includes(addOn._id) ||
                                          false
                                        }
                                        onChange={() =>
                                          handleAddOnChange(index, addOn._id)
                                        }
                                        className="focus:ring-emerald-500 h-4 w-4 text-emerald-600 border-gray-300 rounded"
                                      />
                                    </div>
                                    <div className="ml-3 text-sm">
                                      <label
                                        htmlFor={`addon-${index}-${addOn._id}`}
                                        className="font-medium text-gray-700"
                                      >
                                        {addOn.name} - ₹{addOn.price}
                                      </label>
                                      {addOn.description && (
                                        <p className="text-gray-500">
                                          {addOn.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label
                  htmlFor="additionalNotes"
                  className="block text-sm font-medium text-gray-700"
                >
                  Additional Notes
                </label>
                <textarea
                  name="additionalNotes"
                  id="additionalNotes"
                  rows="3"
                  value={formData.additionalNotes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      additionalNotes: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Any additional information or special requirements"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Proceed to Payment
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Trek Information
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Trek Name
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {trek.name}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Price per Person
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    ₹{selectedBatch?.price?.toFixed(2) || "0.00"}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Number of Participants
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formData.participants.length}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Total Amount
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    ₹{calculateTotalPrice().toFixed(2)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Available Batches
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <div className="divide-y divide-gray-200">
                {trek.batches.map((batch) => {
                  const isFull =
                    batch.currentParticipants >= batch.maxParticipants;
                  const isSelected = selectedBatch?._id === batch._id;
                  const spotsLeft =
                    batch.maxParticipants - batch.currentParticipants;

                  return (
                    <div
                      key={batch._id}
                      className={`px-4 py-4 sm:px-6 cursor-pointer hover:bg-gray-50 ${
                        isSelected ? "bg-emerald-50" : ""
                      }`}
                      onClick={() => !isFull && handleBatchSelect(batch)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(batch.startDate).toLocaleDateString()} -{" "}
                            {new Date(batch.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {isFull ? "Full" : `${spotsLeft} spots left`}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {isSelected && (
                            <svg
                              className="h-5 w-5 text-emerald-500"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingPage;
