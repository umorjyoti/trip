import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getBookingById } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import PaymentButton from '../components/PaymentButton';
import { FaCalendarAlt, FaUsers, FaMoneyBillWave, FaMapMarkerAlt, FaUserFriends, FaPhoneAlt } from 'react-icons/fa';

function BookingPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const bookingData = await getBookingById(id);
        setBooking(bookingData);
      } catch (error) {
        console.error('Error fetching booking:', error);
        setError('Failed to load booking details');
        toast.error('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !booking) {
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
              <p className="text-sm text-red-700">
                {error || 'Booking not found'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-emerald-600">
          <h3 className="text-lg leading-6 font-medium text-white">
            Booking Preview
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-emerald-100">
            Please review your booking details before proceeding to payment
          </p>
        </div>

        <div className="border-t border-gray-200">
          <dl>
            {/* Trek Information */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Trek Information</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-emerald-500" />
                    <span>{booking.trek?.name}</span>
                  </div>
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-2 text-emerald-500" />
                    <span>
                      {formatDate(booking.batch?.startDate)} - {formatDate(booking.batch?.endDate)}
                    </span>
                  </div>
                </div>
              </dd>
            </div>

            {/* Contact Information */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Contact Information</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <FaUserFriends className="mr-2 text-emerald-500" />
                    <span>{booking.contactInfo?.name}</span>
                  </div>
                  <div className="flex items-center">
                    <FaPhoneAlt className="mr-2 text-emerald-500" />
                    <span>{booking.contactInfo?.phone}</span>
                  </div>
                </div>
              </dd>
            </div>

            {/* Emergency Contact */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Emergency Contact</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <FaUserFriends className="mr-2 text-emerald-500" />
                    <span>{booking.emergencyContact?.name}</span>
                  </div>
                  <div className="flex items-center">
                    <FaPhoneAlt className="mr-2 text-emerald-500" />
                    <span>{booking.emergencyContact?.phone}</span>
                  </div>
                </div>
              </dd>
            </div>

            {/* Participants */}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Participants</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="space-y-4">
                  {booking.participantDetails?.map((participant, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-center">
                        <FaUsers className="mr-2 text-emerald-500" />
                        <span className="font-medium">{participant.name}</span>
                      </div>
                      <div className="ml-6 mt-1 text-sm text-gray-600">
                        <p>Age: {participant.age}</p>
                        <p>Gender: {participant.gender}</p>
                        {participant.medicalConditions && (
                          <p>Medical Conditions: {participant.medicalConditions}</p>
                        )}
                        {participant.emergencyContact && (
                          <div className="mt-2 p-2 bg-gray-50 rounded">
                            <p className="font-medium text-gray-700">Emergency Contact:</p>
                            <p>Name: {participant.emergencyContact.name}</p>
                            <p>Phone: {participant.emergencyContact.phone}</p>
                            <p>Relation: {participant.emergencyContact.relation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </dd>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Payment Summary</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Number of Participants:</span>
                    <span>{booking.participants}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price per Person:</span>
                    <span>{formatCurrency(booking.batch?.price)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-medium">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(booking.totalPrice)}</span>
                  </div>
                </div>
              </dd>
            </div>
          </dl>
        </div>

        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <div className="flex justify-end">
            <PaymentButton
              amount={booking.totalPrice}
              bookingId={booking._id}
              onSuccess={() => {
                toast.success('Payment successful!');
                navigate(`/booking-confirmation/${booking._id}`);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingPreview; 