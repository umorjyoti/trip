import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { createPaymentOrder, createRemainingBalanceOrder, verifyPayment } from '../services/api';

function PaymentButton({ amount, bookingId, onSuccess, allowPartialPayment = false, isRemainingBalance = false }) {
  const [loading, setLoading] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    const fetchRazorpayKey = async () => {
      try {
        // Use the API service for consistency
        const { getRazorpayKey } = await import('../services/api');
        const key = await getRazorpayKey();
        setRazorpayKey(key);
      } catch (error) {
        console.error('Error fetching Razorpay key:', error);
        toast.error('Failed to initialize payment system');
      }
    };

    const loadRazorpayScript = () => {
      if (window.Razorpay) {
        setScriptLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => toast.error('Failed to load payment system');
      document.body.appendChild(script);
    };

    fetchRazorpayKey();
    loadRazorpayScript();
  }, []);

  // Poll for payment status after payment initiation
  useEffect(() => {
    if (!orderId || !paymentProcessing) return;

    const pollPaymentStatus = async () => {
      try {
        // Poll every 3 seconds for up to 2 minutes
        const maxAttempts = 40; // 2 minutes / 3 seconds
        let attempts = 0;

        const pollInterval = setInterval(async () => {
          attempts++;
          
          try {
            // Check if payment was processed via webhook
            // Use the authenticated API service instead of raw fetch
            const { getBookingById } = await import('../services/api');
            const bookingData = await getBookingById(bookingId);
            
            if (bookingData.success && bookingData.booking) {
              const booking = bookingData.booking;
              
              // Check if payment was completed via webhook
              if (booking.paymentDetails && 
                  (booking.status === 'payment_completed' || 
                   booking.status === 'payment_confirmed_partial')) {
                
                clearInterval(pollInterval);
                setPaymentProcessing(false);
                setOrderId(null);
                
                toast.success('Payment processed successfully!');
                onSuccess();
                return;
              }
            }
          } catch (error) {
            console.error('Error polling payment status:', error);
          }

          // Stop polling after max attempts
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setPaymentProcessing(false);
            setOrderId(null);
            toast.warning('Payment is being processed. Please check your booking status in a few minutes.');
          }
        }, 3000);

        return () => clearInterval(pollInterval);
      } catch (error) {
        console.error('Error setting up payment polling:', error);
        setPaymentProcessing(false);
        setOrderId(null);
      }
    };

    pollPaymentStatus();
  }, [orderId, paymentProcessing, bookingId, onSuccess]);

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

      // Store order ID for polling
      setOrderId(order.id);

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
            setPaymentProcessing(true); // Start polling for payment status
            
            // Show success message immediately
            toast.success('Payment submitted successfully! Processing your payment...');
            
            // Try to verify payment on backend (fallback)
            try {
              const paymentData = await verifyPayment({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                bookingId,
              });
              
              if (paymentData.payment.status === 'captured') {
                // Payment verified immediately - no need for polling
                setPaymentProcessing(false);
                setOrderId(null);
                toast.success('Payment successful!');
                onSuccess();
                return;
              }
            } catch (verifyError) {
              console.log('Payment verification failed, will rely on webhook:', verifyError.message);
              // Continue with polling - webhook should handle this
            }
            
            // If we reach here, payment is being processed via webhook
            // The polling useEffect will handle the rest
            
          } catch (error) {
            console.error('Payment processing error:', error);
            setPaymentProcessing(false);
            setOrderId(null);
            toast.error('Payment processing failed. Please contact support.');
          } finally {
            setVerifyingPayment(false);
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        modal: {
          ondismiss: function() {
            // If user dismisses modal, stop polling
            setPaymentProcessing(false);
            setOrderId(null);
            if (!verifyingPayment) {
              toast.info('Payment cancelled');
            }
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (error) {
      console.error('Error creating payment order:', error);
      toast.error(error.message || 'Failed to create payment order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading || verifyingPayment || !razorpayKey || !scriptLoaded}
      className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
        loading || verifyingPayment || !razorpayKey || !scriptLoaded
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
      }`}
    >
      {loading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Initializing...
        </span>
      ) : verifyingPayment ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing Payment...
        </span>
      ) : paymentProcessing ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Payment Processing...
        </span>
      ) : (
        `Pay ₹${amount}`
      )}
    </button>
  );
}

export default PaymentButton; 