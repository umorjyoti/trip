import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBookingById } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

function BookingConfirmation() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const data = await getBookingById(bookingId);
        setBooking(data);
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError('Failed to load booking details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

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

  if (!booking) {
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
              <p className="text-sm text-yellow-700">Booking not found. Please check your booking ID.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine if payment is needed based on status
  const needsPayment = booking.status === 'pending';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-emerald-50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h1>
              <p className="text-sm text-gray-500">Your booking has been successfully processed.</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Booking ID</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{booking._id}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Trek</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{booking.trek?.name || 'N/A'}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Dates</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Number of Participants</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{booking.participants}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Amount (INR)</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">₹{booking.totalAmount || booking.totalPrice}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                  booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {booking.status}
                </span>
              </dd>
            </div>
            {booking.specialRequirements && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Special Requirements</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{booking.specialRequirements}</dd>
              </div>
            )}
          </dl>
        </div>
        
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <div className="text-sm">
            <p className="font-medium text-gray-700 mb-2">What's Next?</p>
            <ul className="list-disc pl-5 text-gray-500 space-y-1">
              <li>You will receive a confirmation email with all the details.</li>
              <li>Our team will contact you with further instructions.</li>
              <li>You can view all your bookings in your profile.</li>
              {needsPayment && (
                <li className="text-indigo-600 font-medium">Please complete your payment to confirm your booking.</li>
              )}
            </ul>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {needsPayment && (
              <Link
                to={`/payment/${booking._id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Proceed to Payment
              </Link>
            )}
            <Link
              to="/my-bookings"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              View My Bookings
            </Link>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmation; 