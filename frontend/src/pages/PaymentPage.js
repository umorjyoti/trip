import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getBookingById } from '../services/api';
import PaymentButton from '../components/PaymentButton';
import PaymentConfirmation from '../components/PaymentConfirmation';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    // Redirect if user is not logged in
    if (!currentUser) {
      navigate('/login', { state: { redirectTo: `/payment/${bookingId}` } });
      return;
    }

    // Fetch booking details
    const fetchBooking = async () => {
      try {
        const data = await getBookingById(bookingId);
        
        // Check if booking belongs to current user
        if (data.user !== currentUser._id) {
          toast.error("You don't have permission to view this booking");
          navigate('/my-bookings');
          return;
        }

        // Check if booking is already paid
        if (data.status === 'confirmed' || data.status === 'completed') {
          setPaymentSuccess(true);
        }
        
        setBooking(data);
      } catch (error) {
        console.error('Error fetching booking:', error);
        toast.error('Failed to load booking details');
        navigate('/my-bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, currentUser, navigate]);

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    // Reload booking data to get updated status
    getBookingById(bookingId)
      .then(data => setBooking(data))
      .catch(err => console.error('Error refreshing booking data:', err));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Booking Not Found</h2>
          <p className="text-gray-600">The booking you're looking for doesn't exist or you don't have permission to view it.</p>
          <button
            onClick={() => navigate('/my-bookings')}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to My Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {paymentSuccess ? (
        <PaymentConfirmation 
          bookingId={booking._id} 
          amount={booking.totalPrice} 
        />
      ) : (
        <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Complete Your Payment</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900">Booking Summary</h3>
            <div className="mt-4 border-t border-b border-gray-200 py-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Trek:</span>
                <span className="font-medium">{booking.trek?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Dates:</span>
                <span className="font-medium">
                  {booking.formattedDates?.startDate && booking.formattedDates?.endDate ? (
                    `${new Date(booking.formattedDates.startDate).toLocaleDateString()} - ${new Date(booking.formattedDates.endDate).toLocaleDateString()}`
                  ) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Participants:</span>
                <span className="font-medium">{booking.participants || 0}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Booking ID:</span>
                <span className="font-medium">{booking._id}</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <span className="text-gray-800 font-medium">Total Amount:</span>
                <span className="font-bold text-indigo-600">₹{booking.totalPrice}</span>
              </div>
            </div>
          </div>
          
          <PaymentButton 
            amount={booking.totalPrice} 
            bookingId={booking._id} 
            onSuccess={handlePaymentSuccess} 
          />
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Your booking is secure. You can pay now or later.</p>
            <button
              onClick={() => navigate('/my-bookings')}
              className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Return to My Bookings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage; 