import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getBookingById,
  updateBooking,
  cancelBooking,
  cancelParticipant,
  restoreParticipant,
  updateBookingStatus,
  addParticipant,
  updateParticipant,
  adminCancelBooking,
} from "../services/api";
import { toast } from "react-toastify";
import {
  FaCalendarAlt,
  FaUsers,
  FaMoneyBillWave,
  FaMapMarkerAlt,
  FaUserFriends,
  FaPhoneAlt,
  FaEnvelope,
  FaHome,
  FaUser,
  FaExclamationTriangle,
  FaTrash,
  FaUndo,
  FaPlus,
  FaEdit,
} from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";
import AdminLayout from "../layouts/AdminLayout";
import Modal from "../components/Modal";

function BookingEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [formData, setFormData] = useState({
    specialRequirements: "",
    contactInfo: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
    },
  });
  const [participantForm, setParticipantForm] = useState({
    name: "",
    age: "",
    gender: "",
    medicalConditions: "",
    emergencyContact: {
      name: "",
      phone: "",
      relation: ""
    },
    customFields: {},
  });
  const [refundType, setRefundType] = useState('auto');
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const data = await getBookingById(id);
        if (!data) {
          throw new Error("Booking not found");
        }
        setBooking(data);
        setFormData({
          specialRequirements: data.specialRequirements || "",
          contactInfo: data.contactInfo || {},
          emergencyContact: data.emergencyContact || {},
        });
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError(err.response?.data?.message || "Failed to load booking details");
        toast.error("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateBooking(id, formData);
      toast.success("Booking updated successfully");
      navigate(`/admin/bookings/${id}`);
    } catch (err) {
      console.error("Error updating booking:", err);
      toast.error(err.response?.data?.message || "Failed to update booking");
    }
  };

  const calculateRefund = (booking, refundType = 'auto') => {
    if (!booking) return 0;
    const start = new Date(booking.batch?.startDate);
    const now = new Date();
    const total = booking.totalPrice;
    if (refundType === 'full') return total;
    const diffDays = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
    if (diffDays > 7) return Math.round(total * 0.9);
    if (diffDays >= 3) return Math.round(total * 0.5);
    return 0;
  };

  const handleAdminCancelBooking = async () => {
    setCancelLoading(true);
    try {
      await adminCancelBooking({
        bookingId: booking._id,
        refund: true,
        refundType,
      });
      toast.success('Booking cancelled and refund processed');
      setShowCancelModal(false);
      // Refresh booking data
      const updatedBooking = await getBookingById(id);
      setBooking(updatedBooking);
    } catch (err) {
      toast.error(err.message || 'Failed to cancel booking');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleRestoreBooking = async () => {
    try {
      await updateBookingStatus(id, "confirmed");
      toast.success("Booking restored successfully");
      setShowRestoreModal(false);
      navigate(`/admin/bookings/${id}`);
    } catch (err) {
      console.error("Error restoring booking:", err);
      toast.error(err.response?.data?.message || "Failed to restore booking");
    }
  };

  const handleCancelParticipant = async (participantId) => {
    try {
      await cancelParticipant(id, participantId);
      toast.success("Participant cancelled successfully");
      const updatedBooking = await getBookingById(id);
      setBooking(updatedBooking);
    } catch (err) {
      console.error("Error cancelling participant:", err);
      toast.error(
        err.response?.data?.message || "Failed to cancel participant"
      );
    }
  };

  const handleRestoreParticipant = async (participantId) => {
    try {
      await restoreParticipant(id, participantId);
      toast.success("Participant restored successfully");
      const updatedBooking = await getBookingById(id);
      setBooking(updatedBooking);
    } catch (err) {
      console.error("Error restoring participant:", err);
      toast.error(
        err.response?.data?.message || "Failed to restore participant"
      );
    }
  };

  const handleParticipantInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('customFields.')) {
      const fieldName = name.split('.')[1];
      setParticipantForm(prev => ({
        ...prev,
        customFields: {
          ...prev.customFields,
          [fieldName]: value
        }
      }));
    } else if (name.startsWith('emergencyContact.')) {
      const fieldName = name.split('.')[1];
      setParticipantForm(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [fieldName]: value
        }
      }));
    } else {
      setParticipantForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEditParticipant = (participant) => {
    setSelectedParticipant(participant);
    setParticipantForm({
      name: participant.name,
      age: participant.age,
      gender: participant.gender,
      medicalConditions: participant.medicalConditions || "",
      emergencyContact: participant.emergencyContact || {
        name: "",
        phone: "",
        relation: ""
      },
      customFields: participant.customFields || {},
    });
    setShowParticipantModal(true);
  };

  const handleAddParticipant = () => {
    setSelectedParticipant(null);
    setParticipantForm({
      name: "",
      age: "",
      gender: "",
      medicalConditions: "",
      emergencyContact: {
        name: "",
        phone: "",
        relation: ""
      },
      customFields: {},
    });
    setShowParticipantModal(true);
  };

  const handleSaveParticipant = async () => {
    try {
      if (selectedParticipant) {
        await updateParticipant(id, selectedParticipant._id, participantForm);
        toast.success("Participant updated successfully");
      } else {
        await addParticipant(id, participantForm);
        toast.success("Participant added successfully");
      }
      const updatedBooking = await getBookingById(id);
      setBooking(updatedBooking);
      setShowParticipantModal(false);
    } catch (err) {
      console.error("Error saving participant:", err);
      toast.error(err.response?.data?.message || "Failed to save participant");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Edit Booking
            </h1>
            <div className="flex space-x-4">
              {booking.status === "cancelled" ? (
                <button
                  onClick={() => setShowRestoreModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <FaUndo className="mr-2" />
                  Restore Booking
                </button>
              ) : (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <FaTrash className="mr-2" />
                  Cancel Booking
                </button>
              )}
              <button
                onClick={handleSave}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Save Changes
              </button>
              <button
                onClick={() => navigate(`/admin/bookings/${id}`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {/* Booking Status */}
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Booking #{booking._id}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
                    booking.status
                  )}`}
                >
                  {booking.status}
                </span>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Created on {formatDate(booking.createdAt)}
              </p>
            </div>

            {/* Trek Information */}
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">
                Trek Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-sm text-gray-600">
                  <FaMapMarkerAlt className="mr-2 text-emerald-500" />
                  <span>{booking.trek?.name || "N/A"}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FaCalendarAlt className="mr-2 text-emerald-500" />
                  <span>
                    {booking.batch?.startDate
                      ? formatDate(booking.batch.startDate)
                      : "N/A"}{" "}
                    -
                    {booking.batch?.endDate
                      ? formatDate(booking.batch.endDate)
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information Form */}
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">
                Contact Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    name="contactInfo.name"
                    value={formData.contactInfo.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="contactInfo.email"
                    value={formData.contactInfo.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="contactInfo.phone"
                    value={formData.contactInfo.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    name="contactInfo.address"
                    value={formData.contactInfo.address}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact Form */}
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">
                Emergency Contact
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    name="emergencyContact.name"
                    value={formData.emergencyContact.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Relationship
                  </label>
                  <input
                    type="text"
                    name="emergencyContact.relationship"
                    value={formData.emergencyContact.relationship}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="emergencyContact.phone"
                    value={formData.emergencyContact.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Special Requirements */}
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">
                Special Requirements
              </h4>
              <div>
                <textarea
                  name="specialRequirements"
                  value={formData.specialRequirements}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Enter any special requirements or notes..."
                />
              </div>
            </div>

            {/* Add Participant Button */}
            <div className="px-4 py-5 sm:px-6">
              <button
                onClick={handleAddParticipant}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <FaPlus className="mr-2" />
                Add Participant
              </button>
            </div>

            {/* Participants List */}
            <div className="px-4 py-5 sm:px-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Participants</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emergency Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medical Conditions</th>
                      {booking?.trek?.customFields?.map(field => (
                        <th key={field.name} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {field.label}
                        </th>
                      ))}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {booking?.participantDetails?.map((participant) => (
                      <tr key={participant._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{participant.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{participant.age}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{participant.gender}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {participant.emergencyContact ? (
                            <div>
                              <div className="font-medium">{participant.emergencyContact.name}</div>
                              <div className="text-xs text-gray-400">{participant.emergencyContact.phone}</div>
                              <div className="text-xs text-gray-400">{participant.emergencyContact.relation}</div>
                            </div>
                          ) : (
                            'Not provided'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{participant.medicalConditions || "None"}</td>
                        {booking?.trek?.customFields?.map(field => (
                          <td key={field.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {participant.customFields?.[field.name] || "N/A"}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            participant.isCancelled ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                          }`}>
                            {participant.isCancelled ? "Cancelled" : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditParticipant(participant)}
                              className="text-emerald-600 hover:text-emerald-900"
                            >
                              <FaEdit className="h-4 w-4" />
                            </button>
                            {participant.isCancelled ? (
                              <button
                                onClick={() => handleRestoreParticipant(participant._id)}
                                className="text-emerald-600 hover:text-emerald-900"
                              >
                                <FaUndo className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleCancelParticipant(participant._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FaTrash className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Participant Modal */}
      <Modal
        isOpen={showParticipantModal}
        onClose={() => setShowParticipantModal(false)}
        title={selectedParticipant ? "Edit Participant" : "Add Participant"}
      >
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={participantForm.name}
                onChange={handleParticipantInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Age</label>
              <input
                type="number"
                name="age"
                value={participantForm.age}
                onChange={handleParticipantInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                name="gender"
                value={participantForm.gender}
                onChange={handleParticipantInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Medical Conditions</label>
              <textarea
                name="medicalConditions"
                value={participantForm.medicalConditions}
                onChange={handleParticipantInputChange}
                rows={2}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
            
            {/* Emergency Contact Section */}
            <div className="border-t pt-4">
              <h4 className="text-lg font-medium text-gray-900 mb-3">Emergency Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Emergency Contact Name *</label>
                  <input
                    type="text"
                    name="emergencyContact.name"
                    value={participantForm.emergencyContact.name}
                    onChange={handleParticipantInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Emergency Contact Phone *</label>
                  <input
                    type="tel"
                    name="emergencyContact.phone"
                    value={participantForm.emergencyContact.phone}
                    onChange={handleParticipantInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Relation to Participant *</label>
                  <select
                    name="emergencyContact.relation"
                    value={participantForm.emergencyContact.relation}
                    onChange={handleParticipantInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    required
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
            
            {booking?.trek?.customFields?.map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                <input
                  type={field.type || "text"}
                  name={`customFields.${field.name}`}
                  value={participantForm.customFields[field.name] || ""}
                  onChange={handleParticipantInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  required={field.required}
                />
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => setShowParticipantModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveParticipant}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
            >
              {selectedParticipant ? "Update" : "Add"} Participant
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancel Booking Modal (Admin Refund) */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Booking"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to cancel this booking? This action cannot be undone.<br/>
            Refund to user: <span className="font-semibold">₹{calculateRefund(booking, refundType)}</span>
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <button
              className={`px-3 py-1 rounded ${refundType === 'auto' ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setRefundType('auto')}
              disabled={cancelLoading}
            >
              Auto Refund
            </button>
            <button
              className={`px-3 py-1 rounded ${refundType === 'full' ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setRefundType('full')}
              disabled={cancelLoading}
            >
              100% Refund
            </button>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowCancelModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={cancelLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleAdminCancelBooking}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              disabled={cancelLoading}
            >
              {cancelLoading ? 'Processing...' : 'Confirm Cancellation & Refund'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Restore Booking Modal */}
      <Modal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        title="Restore Booking"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to restore this booking?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowRestoreModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRestoreBooking}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
            >
              Confirm Restoration
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default BookingEditPage;
