import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBookingById } from '../services/api';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaUsers, FaMoneyBillWave, FaMapMarkerAlt, FaUserFriends, FaPhoneAlt, FaEnvelope, FaHome, FaUser, FaExclamationTriangle } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminLayout from '../layouts/AdminLayout';

function BookingViewPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const data = await getBookingById(id);
        if (!data) {
          throw new Error('Booking not found');
        }
        setBooking(data);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError(err.response?.data?.message || 'Failed to load booking details');
        toast.error('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Booking Details</h1>
            <div className="flex space-x-4">
              <Link
                to={`/admin/bookings/${id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Edit Booking
              </Link>
              <Link
                to="/admin/bookings"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Back to Bookings
              </Link>
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
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(booking.status)}`}>
                  {booking.status}
                </span>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Created on {formatDate(booking.createdAt)}
              </p>
            </div>

            {/* Trek Information */}
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">Trek Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-sm text-gray-600">
                  <FaMapMarkerAlt className="mr-2 text-emerald-500" />
                  <span>{booking.trek?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FaCalendarAlt className="mr-2 text-emerald-500" />
                  <span>
                    {booking.batch?.startDate ? formatDate(booking.batch.startDate) : 'N/A'} - 
                    {booking.batch?.endDate ? formatDate(booking.batch.endDate) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-sm text-gray-600">
                  <FaUser className="mr-2 text-emerald-500" />
                  <span>{booking.contactInfo?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FaEnvelope className="mr-2 text-emerald-500" />
                  <span>{booking.contactInfo?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FaPhoneAlt className="mr-2 text-emerald-500" />
                  <span>{booking.contactInfo?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FaHome className="mr-2 text-emerald-500" />
                  <span>{booking.contactInfo?.address || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">Emergency Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-sm text-gray-600">
                  <FaUser className="mr-2 text-emerald-500" />
                  <span>{booking.emergencyContact?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FaUserFriends className="mr-2 text-emerald-500" />
                  <span>{booking.emergencyContact?.relationship || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FaPhoneAlt className="mr-2 text-emerald-500" />
                  <span>{booking.emergencyContact?.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">Booking Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-sm text-gray-600">
                  <FaUsers className="mr-2 text-emerald-500" />
                  <span>{booking.participants} participants</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FaMoneyBillWave className="mr-2 text-emerald-500" />
                  <span>₹{booking.totalPrice?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>

            {/* Special Requirements */}
            {booking.specialRequirements && (
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4">Special Requirements</h4>
                <div className="flex items-start text-sm text-gray-600">
                  <FaExclamationTriangle className="mr-2 text-emerald-500 mt-1" />
                  <span>{booking.specialRequirements}</span>
                </div>
              </div>
            )}

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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {booking.participantDetails?.map((participant) => (
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{participant.medicalConditions || 'None'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            participant.isCancelled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {participant.isCancelled ? 'Cancelled' : 'Active'}
                          </span>
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
    </AdminLayout>
  );
}

export default BookingViewPage; 