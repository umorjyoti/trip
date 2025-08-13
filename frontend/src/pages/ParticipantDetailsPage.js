import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { updateParticipantDetails, getTrekByIdForAdmin, getTrekForParticipantDetails, getBookingById } from "../services/api";
import { toast } from "react-toastify";

function ParticipantDetailsPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const numberOfParticipants = location.state?.numberOfParticipants || 1;
  const addOns = location.state?.addOns || [];
  const trekId = location.state?.trekId;
  const batchId = location.state?.batchId;
  const [participants, setParticipants] = useState(
    Array.from({ length: numberOfParticipants }, () => ({
      name: "",
      email: "",
      phone: "",
      age: "",
      gender: "",
      allergies: "",
      extraComment: "",
      customFields: {}
    }))
  );
  // Single emergency contact for the entire booking
  const [emergencyContact, setEmergencyContact] = useState({
    name: "",
    phone: "",
    relation: ""
  });
  const [loading, setLoading] = useState(false);
  const [trekFields, setTrekFields] = useState([]);
  const [batch, setBatch] = useState(null);
  const [trek, setTrek] = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const [errors, setErrors] = useState({});

  // Validation functions
  const validateName = (name) => {
    if (!name.trim()) {
      return "Name is required";
    }
    if (name.trim().length < 2) {
      return "Name must be at least 2 characters long";
    }
    if (name.trim().length > 50) {
      return "Name must be less than 50 characters";
    }
    // Check for valid name format (letters, spaces, hyphens, apostrophes only)
    const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
    if (!nameRegex.test(name.trim())) {
      return "Name can only contain letters, spaces, hyphens, apostrophes, and periods";
    }
    return "";
  };

  const validateEmail = (email) => {
    if (!email.trim()) {
      return "Email is required";
    }
    // Comprehensive email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return "Please enter a valid email address";
    }
    if (email.trim().length > 100) {
      return "Email must be less than 100 characters";
    }
    return "";
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) {
      return "Phone number is required";
    }
    
    // Remove all non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's a valid Indian phone number (10 digits)
    if (cleanPhone.length !== 10) {
      return "Phone number must be 10 digits";
    }
    
    // Check if it starts with a valid Indian mobile prefix
    const validPrefixes = ['6', '7', '8', '9'];
    if (!validPrefixes.includes(cleanPhone.charAt(0))) {
      return "Phone number must start with 6, 7, 8, or 9";
    }
    
    // Check if it contains only digits
    if (!/^\d+$/.test(cleanPhone)) {
      return "Phone number can only contain digits";
    }
    
    return "";
  };

  const validateEmergencyContactName = (name) => {
    if (!name.trim()) {
      return "Emergency contact name is required";
    }
    if (name.trim().length < 2) {
      return "Emergency contact name must be at least 2 characters long";
    }
    if (name.trim().length > 50) {
      return "Emergency contact name must be less than 50 characters";
    }
    const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
    if (!nameRegex.test(name.trim())) {
      return "Emergency contact name can only contain letters, spaces, hyphens, apostrophes, and periods";
    }
    return "";
  };

  const validateEmergencyContactPhone = (phone) => {
    if (!phone.trim()) {
      return "Emergency contact phone is required";
    }
    
    // Remove all non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's a valid Indian phone number (10 digits)
    if (cleanPhone.length !== 10) {
      return "Emergency contact phone must be 10 digits";
    }
    
    // Check if it starts with a valid Indian mobile prefix
    const validPrefixes = ['6', '7', '8', '9'];
    if (!validPrefixes.includes(cleanPhone.charAt(0))) {
      return "Emergency contact phone must start with 6, 7, 8, or 9";
    }
    
    // Check if it contains only digits
    if (!/^\d+$/.test(cleanPhone)) {
      return "Emergency contact phone can only contain digits";
    }
    
    return "";
  };

  // Real-time validation handlers
  const handleNameChange = (idx, value) => {
    const nameError = validateName(value);
    setErrors(prev => ({
      ...prev,
      [`participant_${idx}_name`]: nameError
    }));
    
    setParticipants(prev => {
      const updated = [...prev];
      updated[idx].name = value;
      return updated;
    });
  };

  const handleEmailChange = (idx, value) => {
    const emailError = validateEmail(value);
    setErrors(prev => ({
      ...prev,
      [`participant_${idx}_email`]: emailError
    }));
    
    setParticipants(prev => {
      const updated = [...prev];
      updated[idx].email = value;
      return updated;
    });
  };

  const handlePhoneChange = (idx, value) => {
    // Filter out non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limitedValue = numericValue.slice(0, 10);
    
    const phoneError = validatePhone(limitedValue);
    setErrors(prev => ({
      ...prev,
      [`participant_${idx}_phone`]: phoneError
    }));
    
    setParticipants(prev => {
      const updated = [...prev];
      updated[idx].phone = limitedValue;
      return updated;
    });
  };

  const handleEmergencyContactNameChange = (value) => {
    const nameError = validateEmergencyContactName(value);
    setErrors(prev => ({
      ...prev,
      emergency_contact_name: nameError
    }));
    
    setEmergencyContact(prev => ({
      ...prev,
      name: value
    }));
  };

  const handleEmergencyContactPhoneChange = (value) => {
    // Filter out non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limitedValue = numericValue.slice(0, 10);
    
    const phoneError = validateEmergencyContactPhone(limitedValue);
    setErrors(prev => ({
      ...prev,
      emergency_contact_phone: phoneError
    }));
    
    setEmergencyContact(prev => ({
      ...prev,
      phone: limitedValue
    }));
  };

  // Ensure body scrolling is enabled when component mounts
  useEffect(() => {
    // Restore body scrolling in case it was locked by a modal from another page
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    
    // Cleanup function to ensure scrolling is restored when component unmounts
    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
    };
  }, []);

  useEffect(() => {
    const fetchTrekFields = async () => {
      if (!trekId) {
        return;
      }
      try {
        const trek = await getTrekForParticipantDetails(trekId);
        setTrek(trek);
        if (Array.isArray(trek.participantFields)) {
          setTrekFields(trek.participantFields);
          setParticipants(prev => prev.map(p => {
            const newFields = {};
            trek.participantFields.forEach(f => {
              newFields[f.name] = "";
            });
            return { 
              ...p, 
              ...newFields
            };
          }));
        }
        if (Array.isArray(trek.customFields)) {
          setCustomFields(trek.customFields);
          setParticipants(prev => prev.map(p => ({
            ...p,
            customFields: trek.customFields.reduce((acc, field) => {
              acc[field.fieldName] = "";
              return acc;
            }, {})
          })));
        }
        // Find batch info from trek.batches
        if (batchId && trek.batches) {
          const foundBatch = trek.batches.find(b => b._id === batchId);
          setBatch(foundBatch);
        }
      } catch (e) {
        console.error('Error fetching trek data from location state trekId:', e);
      }
    };
    fetchTrekFields();
    // eslint-disable-next-line
  }, [trekId, batchId]);

  // Fetch booking to get batch if not in trek, and set correct number of participant forms
  useEffect(() => {
    if (bookingId) {
      getBookingById(bookingId).then(data => {
        if (data && data.batch) setBatch(data.batch);
        if (data && data.trek) setTrek(data.trek);
        
        // Check if participant details already exist - redirect if they do
        if (data && data.participantDetails && data.participantDetails.length > 0) {
          toast.info("Participant details already exist for this booking");
          navigate(`/booking-confirmation/${bookingId}`);
          return;
        }
        
        // Ensure correct number of participant forms
        if (data && data.participants && participants.length !== data.participants) {
          setParticipants(Array.from({ length: data.participants }, (_, i) => participants[i] || {
            name: "",
            email: "",
            phone: "",
            age: "",
            gender: "",
            allergies: "",
            extraComment: "",
            customFields: {}
          }));
        }

        // If trekId is not available from location state, fetch trek data from the booking
        if (!trekId && data && data.trek && data.trek._id) {
          getTrekForParticipantDetails(data.trek._id).then(trekData => {
            setTrek(trekData);
            if (Array.isArray(trekData.participantFields)) {
              setTrekFields(trekData.participantFields);
              setParticipants(prev => prev.map(p => {
                const newFields = {};
                trekData.participantFields.forEach(f => {
                  newFields[f.name] = "";
                });
                return { 
                  ...p, 
                  ...newFields
                };
              }));
            }
            if (Array.isArray(trekData.customFields)) {
              setCustomFields(trekData.customFields);
              setParticipants(prev => prev.map(p => ({
                ...p,
                customFields: trekData.customFields.reduce((acc, field) => {
                  acc[field.fieldName] = "";
                  return acc;
                }, {})
              })));
            }
          }).catch(e => {
            console.error('Error fetching trek data:', e);
          });
        }
      });
    }
  }, [bookingId, navigate, trekId]);

  const handleChange = (idx, e) => {
    const { name, value } = e.target;
    
    // Handle special validation for name and email
    if (name === 'name') {
      handleNameChange(idx, value);
      return;
    }
    if (name === 'email') {
      handleEmailChange(idx, value);
      return;
    }
    if (name === 'phone') {
      handlePhoneChange(idx, value);
      return;
    }
    
    setParticipants((prev) => {
      const updated = [...prev];
      updated[idx][name] = value;
      return updated;
    });
  };

  const handleCustomFieldChange = (idx, fieldName, value) => {
    setParticipants(prev => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        customFields: {
          ...updated[idx].customFields,
          [fieldName]: value
        }
      };
      return updated;
    });
  };

  const handleEmergencyContactChange = (field, value) => {
    if (field === 'name') {
      handleEmergencyContactNameChange(value);
      return;
    }
    if (field === 'phone') {
      handleEmergencyContactPhoneChange(value);
      return;
    }
    
    setEmergencyContact(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate entire form before submission
  const validateForm = () => {
    const newErrors = {};
    
    // Validate all participants
    participants.forEach((participant, idx) => {
      const nameError = validateName(participant.name);
      if (nameError) {
        newErrors[`participant_${idx}_name`] = nameError;
      }
      
      const emailError = validateEmail(participant.email);
      if (emailError) {
        newErrors[`participant_${idx}_email`] = emailError;
      }

      const phoneError = validatePhone(participant.phone);
      if (phoneError) {
        newErrors[`participant_${idx}_phone`] = phoneError;
      }
    });
    
    // Validate emergency contact
    const emergencyNameError = validateEmergencyContactName(emergencyContact.name);
    if (emergencyNameError) {
      newErrors.emergency_contact_name = emergencyNameError;
    }

    const emergencyPhoneError = validateEmergencyContactPhone(emergencyContact.phone);
    if (emergencyPhoneError) {
      newErrors.emergency_contact_phone = emergencyPhoneError;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }
    
    setLoading(true);
    try {
      await updateParticipantDetails(bookingId, { 
        participants: participants,
        emergencyContact: emergencyContact, // Include single emergency contact

        additionalRequests: "" // Default empty value
      });
      toast.success("Participant details saved!");
      navigate(`/booking-confirmation/${bookingId}`);
    } catch (error) {
      toast.error(error.message || "Failed to save details");
    } finally {
      setLoading(false);
    }
  };

  // Helper for formatting date
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-6 text-emerald-700">Participant Details</h2>
      {/* Batch Info Card */}
      {batch && (
        <div className="bg-white rounded-xl shadow p-6 border border-emerald-100 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg font-bold text-emerald-800">Batch Information</span>
          </div>
          <div className="flex flex-wrap gap-6 text-gray-700">
            <div><strong>Start Date:</strong> {formatDate(batch.startDate)}</div>
            <div><strong>End Date:</strong> {formatDate(batch.endDate)}</div>
            <div><strong>Price per Person:</strong> ₹{batch.price}</div>
            <div><strong>Max Participants:</strong> {batch.maxParticipants}</div>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-10">
        {participants.map((p, idx) => (
          <div key={idx} className="border p-6 rounded-lg mb-6 bg-white shadow-sm">
            <h3 className="font-semibold mb-4 text-lg text-emerald-600">Participant {idx + 1}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input 
                  name="name" 
                  value={p.name} 
                  onChange={e => handleChange(idx, e)} 
                  required 
                  placeholder="Full Name" 
                  className={`border p-2 rounded w-full ${
                    errors[`participant_${idx}_name`] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-emerald-500 focus:ring-emerald-500'
                  }`}
                />
                {errors[`participant_${idx}_name`] && (
                  <p className="text-red-500 text-sm mt-1">{errors[`participant_${idx}_name`]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input 
                  name="email" 
                  value={p.email} 
                  onChange={e => handleChange(idx, e)} 
                  required 
                  placeholder="Email" 
                  type="email"
                  className={`border p-2 rounded w-full ${
                    errors[`participant_${idx}_email`] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-emerald-500 focus:ring-emerald-500'
                  }`}
                />
                {errors[`participant_${idx}_email`] && (
                  <p className="text-red-500 text-sm mt-1">{errors[`participant_${idx}_email`]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input 
                  name="phone" 
                  value={p.phone} 
                  onChange={e => handleChange(idx, e)} 
                  required 
                  placeholder="Phone" 
                  maxLength="10"
                  className={`border p-2 rounded w-full ${
                    errors[`participant_${idx}_phone`] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-emerald-500 focus:ring-emerald-500'
                  }`}
                />
                {errors[`participant_${idx}_phone`] && (
                  <p className="text-red-500 text-sm mt-1">{errors[`participant_${idx}_phone`]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input name="age" value={p.age} onChange={e => handleChange(idx, e)} required placeholder="Age" className="border p-2 rounded w-full" type="number" min="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select name="gender" value={p.gender} onChange={e => handleChange(idx, e)} required className="border p-2 rounded w-full">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {trekFields.map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label || field.name}</label>
                  <input
                    name={field.name}
                    value={p[field.name] || ""}
                    onChange={e => handleChange(idx, e)}
                    placeholder={field.label || field.name}
                    className="border p-2 rounded w-full"
                    type={field.type || "text"}
                    required={!!field.required}
                  />
                </div>
              ))}
              {customFields.map(field => (
                <div key={field.fieldName}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label || field.fieldName}</label>
                  {field.fieldType === 'select' && Array.isArray(field.options) ? (
                    <select
                      value={p.customFields?.[field.fieldName] || ""}
                      onChange={e => handleCustomFieldChange(idx, field.fieldName, e.target.value)}
                      required={!!field.isRequired}
                      className="border p-2 rounded w-full"
                    >
                      <option value="">Select</option>
                      {field.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.fieldType || "text"}
                      value={p.customFields?.[field.fieldName] || ""}
                      onChange={e => handleCustomFieldChange(idx, field.fieldName, e.target.value)}
                      required={!!field.isRequired}
                      placeholder={field.label || field.fieldName}
                      className="border p-2 rounded w-full"
                    />
                  )}
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                <textarea name="allergies" value={p.allergies} onChange={e => handleChange(idx, e)} placeholder="Any allergies?" className="border p-2 rounded w-full" rows={2} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Extra Comment</label>
                <textarea name="extraComment" value={p.extraComment} onChange={e => handleChange(idx, e)} placeholder="Any extra comment?" className="border p-2 rounded w-full" rows={2} />
              </div>
            </div>
            {addOns.length > 0 && (
              <div className="mt-4 text-sm text-gray-600">Add-on questions will appear here.</div>
            )}
          </div>
        ))}
        
        {/* Single Emergency Contact Section for All Participants */}
        <div className="border p-6 rounded-lg mb-6 bg-white shadow-sm">
          <h3 className="font-semibold mb-4 text-lg text-emerald-600">Emergency Contact (For All Participants)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name *</label>
              <input 
                value={emergencyContact.name} 
                onChange={e => handleEmergencyContactChange('name', e.target.value)} 
                required 
                placeholder="Emergency Contact Name" 
                className={`border p-2 rounded w-full ${
                  errors.emergency_contact_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-emerald-500 focus:ring-emerald-500'
                }`}
              />
              {errors.emergency_contact_name && (
                <p className="text-red-500 text-sm mt-1">{errors.emergency_contact_name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone *</label>
              <input 
                value={emergencyContact.phone} 
                onChange={e => handleEmergencyContactChange('phone', e.target.value)} 
                required 
                placeholder="Emergency Contact Phone" 
                maxLength="10"
                className={`border p-2 rounded w-full ${
                  errors.emergency_contact_phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'focus:border-emerald-500 focus:ring-emerald-500'
                }`}
              />
              {errors.emergency_contact_phone && (
                <p className="text-red-500 text-sm mt-1">{errors.emergency_contact_phone}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relation to Participants *</label>
              <select 
                value={emergencyContact.relation} 
                onChange={e => handleEmergencyContactChange('relation', e.target.value)} 
                required 
                className="border p-2 rounded w-full"
              >
                <option value="">Select Relation</option>
                <option value="Parent">Parent</option>
                <option value="Spouse">Spouse</option>
                <option value="Sibling">Sibling</option>
                <option value="Friend">Friend</option>
                <option value="Relative">Relative</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>
        
        <button type="submit" disabled={loading} className="bg-emerald-600 text-white px-8 py-3 rounded shadow hover:bg-emerald-700 text-lg font-semibold">
          {loading ? "Saving..." : "Continue to Preview"}
        </button>
      </form>
    </div>
  );
}

export default ParticipantDetailsPage; 