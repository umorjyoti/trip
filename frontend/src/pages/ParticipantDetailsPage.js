import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { updateParticipantDetails, getTrekByIdForAdmin, getBookingById } from "../services/api";
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
      if (!trekId) return;
      try {
        const trek = await getTrekByIdForAdmin(trekId);
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
      } catch (e) {}
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
      });
    }
  }, [bookingId]);

  const handleChange = (idx, e) => {
    const { name, value } = e.target;
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
    setEmergencyContact(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateParticipantDetails(bookingId, { 
        participants: participants,
        emergencyContact: emergencyContact, // Include single emergency contact
        pickupLocation: "To be confirmed", // Default value, can be updated later
        dropLocation: "To be confirmed", // Default value, can be updated later
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input name="name" value={p.name} onChange={e => handleChange(idx, e)} required placeholder="Full Name" className="border p-2 rounded w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input name="email" value={p.email} onChange={e => handleChange(idx, e)} required placeholder="Email" className="border p-2 rounded w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input name="phone" value={p.phone} onChange={e => handleChange(idx, e)} required placeholder="Phone" className="border p-2 rounded w-full" />
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
                className="border p-2 rounded w-full" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone *</label>
              <input 
                value={emergencyContact.phone} 
                onChange={e => handleEmergencyContactChange('phone', e.target.value)} 
                required 
                placeholder="Emergency Contact Phone" 
                className="border p-2 rounded w-full" 
              />
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