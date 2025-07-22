import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import LoadingSpinner from './LoadingSpinner';
import Modal from './Modal';
import { getRazorpayKey, createPaymentOrder, createRemainingBalanceOrder, verifyPayment } from '../services/api';

function PaymentButton({ amount, bookingId, onSuccess, allowPartialPayment = false, isRemainingBalance = false }) {
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
        const key = await getRazorpayKey();
        setRazorpayKey(key);
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
      
      // Create order on backend using API service
      let orderData;
      if (isRemainingBalance) {
        orderData = await createRemainingBalanceOrder(bookingId);
      } else {
        orderData = await createPaymentOrder(amount, bookingId);
      }
      
      const order = orderData.order;
      const actualAmount = isRemainingBalance ? orderData.remainingAmount : amount;

      // Initialize Razorpay
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: 'Bengaluru Trekkers',
        description: isRemainingBalance ? 'Remaining Balance Payment' : 'Bengaluru Trekkers Payment',
        order_id: order.id,
        handler: async function (response) {
          try {
            setVerifyingPayment(true);
            // Verify payment on backend using API service
            const paymentData = await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              bookingId,
            });
            
            if (paymentData.payment.status === 'captured') {
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
        {loading ? 'Processing...' : !scriptLoaded ? 'Loading Payment System...' : !razorpayKey ? 'Initializing...' : isRemainingBalance ? 'Pay Remaining Balance' : 'Proceed to Payment'}
      </button>

      {/* Payment Verification Loading Overlay */}
      {verifyingPayment && (
        <Modal
          isOpen={verifyingPayment}
          onClose={() => setVerifyingPayment(false)}
          title="Verifying Payment..."
          size="small"
        >
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner />
            <p className="text-lg font-medium text-gray-900">Verifying Payment...</p>
            <p className="text-sm text-gray-600">Please wait while we verify your payment</p>
          </div>
        </Modal>
      )}
    </>
  );
}

export default PaymentButton; 