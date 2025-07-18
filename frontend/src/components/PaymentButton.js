import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import LoadingSpinner from './LoadingSpinner';

function PaymentButton({ amount, bookingId, onSuccess, allowPartialPayment = false }) {
  const [loading, setLoading] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load Razorpay script when component mounts
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    // Fetch Razorpay key when component mounts
    const fetchRazorpayKey = async () => {
      try {
        // Get auth token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch('/payments/get-key', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch Razorpay key');
        }

        const data = await response.json();
        if (!data.key) {
          throw new Error('Invalid API key received');
        }
        
        setRazorpayKey(data.key);
      } catch (error) {
        console.error('Error fetching Razorpay key:', error);
        toast.error(error.message || 'Failed to initialize payment. Please try again.');
      }
    };

    fetchRazorpayKey();
  }, []);

  const handlePayment = async () => {
    if (!razorpayKey) {
      toast.error('Payment system is not ready. Please try again in a moment.');
      return;
    }

    if (!scriptLoaded) {
      toast.error('Payment system is still initializing. Please try again in a moment.');
      return;
    }

    try {
      setLoading(true);
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Create order on backend
      const response = await fetch('/payments/create-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount), // Send as integer rupees
          bookingId,
          partial_payment: allowPartialPayment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment order');
      }

      const { order } = await response.json();

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
            setVerifyingPayment(true);
            // Verify payment on backend
            const verifyResponse = await fetch('/payments/verify', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                bookingId,
              }),
            });

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json();
              throw new Error(errorData.message || 'Payment verification failed');
            }

            const { payment } = await verifyResponse.json();
            
            if (payment.status === 'captured') {
              toast.success('Payment successful!');
              onSuccess();
            } else {
              toast.warning('Payment is being processed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error(error.message || 'Payment verification failed. Please contact support.');
          } finally {
            setVerifyingPayment(false);
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#059669', // emerald-600
        },
        modal: {
          ondismiss: function() {
            toast.info('Payment cancelled');
          }
        },
        notes: {
          bookingId,
        },
        callback_url: `${window.location.origin}/payment/callback`,
      };
      console.log("options",options,razorpayKey)

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handlePayment}
        disabled={loading || !razorpayKey || !scriptLoaded}
        className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${loading || !razorpayKey || !scriptLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? 'Processing...' : !scriptLoaded ? 'Loading Payment System...' : !razorpayKey ? 'Initializing...' : 'Proceed to Payment'}
      </button>

      {/* Payment Verification Loading Overlay */}
      {verifyingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4">
            <LoadingSpinner />
            <p className="text-lg font-medium text-gray-900">Verifying Payment...</p>
            <p className="text-sm text-gray-600">Please wait while we verify your payment</p>
          </div>
        </div>
      )}
    </>
  );
}

export default PaymentButton; 