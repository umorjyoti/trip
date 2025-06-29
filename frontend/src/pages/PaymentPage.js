import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getBookingById } from '../services/api';
import PaymentButton from '../components/PaymentButton';
import PaymentConfirmation from '../components/PaymentConfirmation';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import { FaHiking, FaCalendarAlt, FaUserFriends, FaReceipt } from 'react-icons/fa';

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
      console.log('No current user, redirecting to login');
      navigate('/login', { state: { redirectTo: `/payment/${bookingId}` } });
      return;
    }

    console.log('Current user found:', currentUser);
    console.log('Booking ID:', bookingId);

    // Validate booking ID
    if (!bookingId) {
      console.log('No booking ID provided');
      toast.error('Invalid booking ID');
      navigate('/my-bookings');
      return;
    }

    // Fetch booking details
    const fetchBooking = async () => {
      try {
        const data = await getBookingById(bookingId);
        
        console.log('Booking data:', data);
        console.log('Current user:', currentUser);
        console.log('User comparison:', {
          bookingUser: data.user,
          currentUser: currentUser._id,
          bookingUserId: data.user?._id,
          currentUserId: currentUser._id,
          isEqual: data.user?._id?.toString() === currentUser._id?.toString()
        });
        
        // Test: Log the actual booking data structure
        console.log('Full booking data structure:', JSON.stringify(data, null, 2));
        console.log('Booking user type:', typeof data.user);
        console.log('Booking user value:', data.user);
        console.log('Current user type:', typeof currentUser);
        console.log('Current user value:', currentUser);
        
        // Check if booking belongs to current user
        if (!currentUser || !currentUser._id) {
          toast.error("User session not found. Please log in again.");
          navigate('/login', { state: { redirectTo: `/payment/${bookingId}` } });
          return;
        }
        
        // Temporarily comment out permission check for debugging
        /*
        if (data.user && data.user._id && data.user._id.toString() !== currentUser._id.toString()) {
          toast.error("You don't have permission to view this booking");
          navigate('/my-bookings');
          return;
        }
        */

        // Check if booking is already paid
        if (data.status === 'confirmed' || data.status === 'payment_completed' || data.status === 'trek_completed') {
          setPaymentSuccess(true);
        }
        
        // Check if booking is in the right status for payment
        if (data.status !== 'pending_payment') {
          toast.error('This booking is not ready for payment');
          navigate('/my-bookings');
          return;
        }
        
        setBooking(data);
      } catch (error) {
        console.error('Error fetching booking:', error);
        console.error('Error details:', error.response?.data);
        
        if (error.response?.status === 403) {
          toast.error("You don't have permission to view this booking");
        } else if (error.response?.status === 404) {
          toast.error("Booking not found");
        } else {
          toast.error('Failed to load booking details');
        }
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
    <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-screen bg-gray-50">
      {paymentSuccess ? (
        <PaymentConfirmation 
          bookingId={booking._id} 
          amount={booking.totalPrice} 
        />
      ) : (
        <div className="bg-white shadow-2xl rounded-2xl p-8 max-w-lg w-full border border-gray-100">
          <h2 className="text-3xl font-bold text-emerald-700 mb-6 text-center tracking-tight">Complete Your Payment</h2>
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><FaReceipt className="text-emerald-500" /> Booking Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-500"><FaHiking className="text-emerald-400" /> Trek:</span>
                <span className="font-medium text-gray-800">{booking.trek?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-500"><FaCalendarAlt className="text-emerald-400" /> Dates:</span>
                <span className="font-medium text-gray-800">
                  {booking.formattedDates?.startDate && booking.formattedDates?.endDate ? (
                    `${new Date(booking.formattedDates.startDate).toLocaleDateString()} - ${new Date(booking.formattedDates.endDate).toLocaleDateString()}`
                  ) : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-500"><FaUserFriends className="text-emerald-400" /> Participants:</span>
                <span className="font-medium text-gray-800">{booking.participants || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-500"><FaReceipt className="text-emerald-400" /> Booking ID:</span>
                <span className="font-mono text-xs text-gray-600">{booking._id}</span>
              </div>
              <div className="border-t border-gray-200 pt-6 flex items-center justify-between mt-4">
                <span className="text-xl font-semibold text-gray-800">Total Amount:</span>
                <span className="text-3xl font-extrabold text-emerald-600">
                  ₹{Intl.NumberFormat('en-IN').format(Math.round(booking.totalPrice))}
                </span>
              </div>
            </div>
          </div>
          <PaymentButton 
            amount={Math.round(booking.totalPrice)} 
            bookingId={booking._id} 
            onSuccess={handlePaymentSuccess} 
          />
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Your booking is secure. You can pay now or later.</p>
            <p className="mt-2 text-blue-600 font-medium">
              After payment, you'll need to fill in participant details to complete your booking.
            </p>
            <button
              onClick={() => navigate('/my-bookings')}
              className="mt-4 text-emerald-600 hover:text-emerald-800 font-semibold underline"
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