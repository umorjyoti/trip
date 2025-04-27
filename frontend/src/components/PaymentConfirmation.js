import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const PaymentConfirmation = ({ bookingId, amount }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto mt-8">
      <div className="text-center">
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />
        <h2 className="mt-4 text-2xl font-semibold text-gray-800">Payment Successful!</h2>
        <p className="mt-2 text-gray-600">
          Your payment of ₹{amount.toFixed(2)} has been successfully processed.
        </p>
        
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Booking ID:</span>
            <span className="font-medium">{bookingId}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Payment Status:</span>
            <span className="text-green-600 font-medium">Completed</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount Paid:</span>
            <span className="font-medium">₹{amount.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="mt-8 space-y-3">
          <Link 
            to={`/bookings/${bookingId}`} 
            className="block w-full py-3 px-4 text-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm"
          >
            View Booking Details
          </Link>
          <Link 
            to="/my-bookings" 
            className="block w-full py-3 px-4 text-center border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-md"
          >
            My Bookings
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmation; 