import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { getTrekById, getAuthHeader, createBooking, getRazorpayKey, createPaymentOrder, verifyPayment, validateCoupon } from "../services/api";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import { useAuth } from "../contexts/AuthContext";

function BookingPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [trek, setTrek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [razorpayKey, setRazorpayKey] = useState(null);
  const [taxInfo, setTaxInfo] = useState({
    gstPercent: 0,
    gatewayPercent: 0
  });
  const [formData, setFormData] = useState({
    numberOfParticipants: 1,
    addOns: [],
    userDetails: {
      name: currentUser?.name || "",
      email: currentUser?.email || "",
      phone: currentUser?.phone || "",
    }
  });
  const [paymentMode, setPaymentMode] = useState('full');

  // Add new state for coupon code
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);


  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Ensure body scrolling is restored when component unmounts or when payment processing ends
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Restore body scrolling when payment processing ends
  useEffect(() => {
    if (!processingPayment && !verifyingPayment) {
      document.body.style.overflow = 'auto';
    }
  }, [processingPayment, verifyingPayment]);

  useEffect(() => {
    const fetchRazorpayKey = async () => {
      try {
        const key = await getRazorpayKey();
        setRazorpayKey(key);
      } catch (error) {
        console.error('Error fetching Razorpay key:', error);
        if (error.message === 'Please log in to proceed with booking') {
          navigate('/login', { state: { from: `/treks/${name}/book` } });
        } else {
          toast.error(error.message || 'Failed to initialize payment. Please try again.');
        }
      }
    };

    fetchRazorpayKey();
  }, [currentUser, name, navigate]);

  useEffect(() => {
    const fetchTrek = async () => {
      try {
        setLoading(true);
        // Get trek ID from location state or fetch by slug
        const trekId = location?.state?.trekId;
        let data;
        
        if (trekId) {
          data = await getTrekById(trekId);
        } else {
          // Import getTrekBySlug and use it
          const { getTrekBySlug } = await import('../services/api');
          data = await getTrekBySlug(name);
        }
        
        setTrek(data);
        
        // Set tax information from API response
        setTaxInfo({
          gstPercent: data.gstPercent || 0,
          gatewayPercent: data.gatewayPercent || 0
        });

        // Get the selected batch ID from location state
        const selectedBatchId = location.state?.selectedBatchId;

        // Find the selected batch or the first available batch
        const availableBatch = selectedBatchId
          ? data.batches.find((batch) => batch._id === selectedBatchId)
          : data.batches.find(
              (batch) => batch.currentParticipants < batch.maxParticipants
            );

        setSelectedBatch(availableBatch);
      } catch (err) {
        console.error("Error fetching trek:", err);
        setError("Failed to load trek details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTrek();
  }, [name, location.state]);

  const handleBatchSelect = (batch) => {
    setSelectedBatch(batch);
  };

  const handleUserDetailsChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      userDetails: {
        ...prev.userDetails,
        [name]: value,
      },
    }));
  };

  const handleParticipantsChange = (e) => {
    const value = parseInt(e.target.value);
    if (selectedBatch && value > 0 && value <= (selectedBatch.maxParticipants - selectedBatch.currentParticipants)) {
      setFormData(prev => ({
        ...prev,
        numberOfParticipants: value
      }));
    }
  };

  // Helper to get a unique add-on key
  const getAddOnKey = (addOn, idx) => addOn._id || `${addOn.name || 'addon'}-${idx}`;

  const getSelectedAddOns = () => {
    if (!trek || !trek.addOns) return [];
    return trek.addOns
      .map((addOn, idx) => ({ addOn, key: getAddOnKey(addOn, idx) }))
      .filter(({ key }) => formData.addOns.includes(key));
  };

  const handleAddOnChange = (addOnKey) => {
    setFormData((prev) => {
      const newAddOns = prev.addOns.includes(addOnKey)
        ? prev.addOns.filter(id => id !== addOnKey)
        : [...prev.addOns, addOnKey];
      return {
        ...prev,
        addOns: newAddOns
      };
    });
  };

  const handleCouponCodeChange = (e) => {
    setCouponCode(e.target.value);
    setCouponError(null);
  };

  const handleApplyCoupon = async () => {
    if (!currentUser) {
      toast.info("Please log in to apply coupon");
      navigate("/login", { state: { from: `/treks/${name}/book` } });
      return;
    }

    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      // Calculate base price for order value
      const basePrice = calculateBasePrice();
      
      // Validate coupon with order value
      const trekId = location?.state?.trekId || trek?._id;
      const response = await validateCoupon(couponCode, trekId, basePrice);
      setAppliedCoupon(response);
      setCouponError(null);
    } catch (error) {
      setCouponError(error.message || "Invalid coupon code");
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
  };



  const validateForm = () => {
    // Validate user details
    if (!formData.userDetails.name || !formData.userDetails.email || !formData.userDetails.phone) {
      toast.error("Please fill in all user details");
      return false;
    }

    // Validate phone number format (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.userDetails.phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return false;
    }

    // Validate batch selection
    if (!selectedBatch) {
      toast.error("Please select a batch");
      return false;
    }

    // Validate terms agreement
    if (!agreeToTerms) {
      toast.error("Please agree to the Terms & Conditions to proceed");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      toast.info("Please log in to book this trek");
      navigate("/login", { state: { from: `/treks/${name}/book` } });
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setProcessingPayment(true);
      
      // Generate a unique session ID for this booking attempt
      const sessionId = `session_${Date.now()}_${currentUser._id}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Map selected add-on IDs to { name, price } objects
      const validAddOns = trek.addOns
        .map((addOn, idx) => ({ ...addOn, key: getAddOnKey(addOn, idx) }))
        .filter(({ key, isEnabled }) => isEnabled && formData.addOns.includes(key))
        .map(({ _id, name, price }) => ({ _id, name, price }));

      const bookingData = {
        trekId: location?.state?.trekId || trek?._id,
        batchId: selectedBatch._id,
        numberOfParticipants: formData.numberOfParticipants,
        addOns: validAddOns,
        userDetails: formData.userDetails,
        totalPrice: calculateTotalPrice(),
        paymentMode: paymentMode,
        couponCode: appliedCoupon?.promoCode || null,
        discountAmount: appliedCoupon ? calculateBasePrice() * (appliedCoupon.promoCode.discountValue / 100) : 0,
        originalPrice: calculateBasePrice(),
        sessionId: sessionId // Add session ID to prevent duplicate bookings
      };

      const booking = await createBooking(bookingData);
      
      // Calculate payment amount based on payment mode
      let paymentAmount = booking.totalPrice;
      if (paymentMode === 'partial' && booking.partialPaymentDetails) {
        paymentAmount = booking.partialPaymentDetails.initialAmount;
      }
      
      // Create Razorpay order using the API service
      const { order } = await createPaymentOrder(paymentAmount, booking._id);

      // Initialize Razorpay
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: 'Bengaluru Trekkers',
        description: `Bengaluru Trekkers Payment${paymentMode === 'partial' ? ' (Partial)' : ''}${appliedCoupon ? ` (with ${appliedCoupon.promoCode.discountValue}% discount)` : ''}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            setVerifyingPayment(true);
            // Razorpay closes the modal automatically; no need to call this.modal.hide()
            // Verify payment using the API service
            await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id,
            });
            toast.success('Payment successful! Please fill in participant details.');
            setVerifyingPayment(false);
            // Redirect to participant details page with necessary information
            navigate(`/booking/${booking._id}/participant-details`, { 
              state: { 
                paymentStatus: 'success',
                numberOfParticipants: formData.numberOfParticipants,
                addOns: formData.addOns,
                trekId: location?.state?.trekId || trek?._id,
                batchId: selectedBatch._id
              } 
            });
          } catch (error) {
            setVerifyingPayment(false);
            console.error('Payment verification error:', error);
            toast.error(error.message || 'Payment verification failed. Please contact support.');
            navigate(`/booking-detail/${booking._id}`, { state: { paymentStatus: 'failure' } });
          }
        },
        modal: {
          ondismiss: function() {
            toast.info('Payment cancelled. You can try again.');
            // Restore body scrolling when payment is dismissed
            document.body.style.overflow = 'auto';
          },
          escape: false,
        },
        prefill: {
          name: formData.userDetails.name,
          email: formData.userDetails.email,
          contact: formData.userDetails.phone,
        },
        theme: {
          color: '#059669',
        },
      };

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        setProcessingPayment(false);
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      };
      script.onerror = () => {
        setProcessingPayment(false);
        toast.error('Failed to load payment system. Please try again.');
      };
      document.body.appendChild(script);

    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error(error.message || "Failed to create booking");
      setProcessingPayment(false);
      // Restore body scrolling on error
      document.body.style.overflow = 'auto';
    }
  };

  const calculateBasePrice = () => {
    if (!selectedBatch) return 0;
    let basePrice = selectedBatch.price * formData.numberOfParticipants;
    getSelectedAddOns().forEach(({ addOn }) => {
      if (addOn.isEnabled) {
        basePrice += addOn.price * formData.numberOfParticipants;
      }
    });
    return basePrice;
  };

  const calculateDiscountedPrice = (basePrice) => {
    if (!appliedCoupon || !appliedCoupon.promoCode) return basePrice;
    const { discountType, discountValue } = appliedCoupon.promoCode;
    if (discountType === 'percentage') {
      return basePrice * (1 - discountValue / 100);
    } else if (discountType === 'fixed') {
      return Math.max(0, basePrice - discountValue);
    }
    return basePrice;
  };

  const calculateTotalPrice = () => {
    const basePrice = calculateBasePrice();
    const discountedPrice = calculateDiscountedPrice(basePrice);
    const gstAmount = discountedPrice * (taxInfo.gstPercent / 100);
    const gatewayCharges = discountedPrice * (taxInfo.gatewayPercent / 100);
    return discountedPrice + gstAmount + gatewayCharges;
  };

  const calculateInitialPayment = () => {
    if (!trek.partialPayment || !trek.partialPayment.enabled) return 0;
    
    if (trek.partialPayment.amountType === 'percentage') {
      return Math.round((calculateTotalPrice() * trek.partialPayment.amount) / 100);
    } else {
      // For fixed amount, multiply by number of participants
      return trek.partialPayment.amount * formData.numberOfParticipants;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Payment processing modal
  if (processingPayment) {
    return (
      <Modal
        title="Preparing Payment"
        isOpen={processingPayment}
        onClose={() => {}} // No close functionality during payment processing
        size="small"
      >
        <div className="flex flex-col items-center space-y-4 py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          <p className="text-sm text-gray-600 text-center">
            Please wait while we set up your payment gateway...
          </p>
        </div>
      </Modal>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <div>
                <Link to="/" className="text-gray-400 hover:text-gray-500">
                  <svg
                    className="flex-shrink-0 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  <span className="sr-only">Home</span>
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="flex-shrink-0 h-5 w-5 text-gray-300"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
                <Link
                  to={`/treks/${name}`}
                  state={{ trekId: trek._id, trekName: trek.name }}
                  className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  {trek.name}
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="flex-shrink-0 h-5 w-5 text-gray-300"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
                <span className="ml-4 text-sm font-medium text-gray-500">
                  Book Now
                </span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Booking Details
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Please fill in your booking information
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Number of Participants */}
              <div>
                <label
                  htmlFor="numberOfParticipants"
                  className="block text-sm font-medium text-gray-700"
                >
                  Number of Participants
                </label>
                <select
                  id="numberOfParticipants"
                  name="numberOfParticipants"
                  value={formData.numberOfParticipants}
                  onChange={handleParticipantsChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  required
                >
                  {[...Array(selectedBatch ? selectedBatch.maxParticipants - selectedBatch.currentParticipants : 0)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>

              {/* User Details Section */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Your Details
                </h4>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="userName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="userName"
                      value={formData.userDetails.name}
                      onChange={handleUserDetailsChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      required
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="userEmail"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="userEmail"
                      value={formData.userDetails.email}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 cursor-not-allowed sm:text-sm"
                      disabled
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="userPhone"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="userPhone"
                      value={formData.userDetails.phone}
                      onChange={handleUserDetailsChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      required
                      placeholder="Enter 10-digit phone number"
                      pattern="[0-9]{10}"
                      maxLength="10"
                    />
                  </div>
                </div>
              </div>

              {/* Add-ons Section */}
              {trek.addOns && trek.addOns.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Optional Add-ons
                  </h4>
                  <div className="space-y-4">
                    {trek.addOns
                      .filter((addOn) => addOn.isEnabled)
                      .map((addOn, idx) => {
                        const addOnKey = getAddOnKey(addOn, idx);
                        return (
                          <div
                            key={addOnKey}
                            className="relative flex items-start"
                          >
                            <div className="flex items-center h-5">
                              <input
                                id={`addon-${addOnKey}`}
                                type="checkbox"
                                checked={formData.addOns.includes(addOnKey)}
                                onChange={() => handleAddOnChange(addOnKey)}
                                className="focus:ring-emerald-500 h-4 w-4 text-emerald-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label
                                htmlFor={`addon-${addOnKey}`}
                                className="font-medium text-gray-700"
                              >
                                {addOn.name} - ₹{addOn.price}
                              </label>
                              {addOn.description && (
                                <p className="text-gray-500">
                                  {addOn.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Add Coupon Code Section before the Proceed to Payment button */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Apply Coupon Code
                </h4>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={handleCouponCodeChange}
                    placeholder="Enter coupon code"
                    className="flex-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="mt-2 text-sm text-red-600">{couponError}</p>
                )}
                {appliedCoupon && (
                  <div className="mt-2 p-2 bg-green-50 rounded-md flex justify-between items-center">
                    <p className="text-sm text-green-700">
                      Coupon applied: {appliedCoupon.promoCode.code} (
                      {appliedCoupon.promoCode.discountType === 'percentage'
                        ? `${appliedCoupon.promoCode.discountValue}% off`
                        : `₹${appliedCoupon.promoCode.discountValue} off`}
                      )
                    </p>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Partial Payment Options */}
              {trek.partialPayment && trek.partialPayment.enabled && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Payment Options
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="payment_full"
                        name="paymentMode"
                        value="full"
                        checked={paymentMode === 'full'}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                      />
                      <label htmlFor="payment_full" className="ml-2 block text-sm text-gray-900">
                        <span className="font-medium">Pay in Full</span>
                        <span className="text-gray-500 ml-2">- Pay the complete amount now</span>
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="payment_partial"
                        name="paymentMode"
                        value="partial"
                        checked={paymentMode === 'partial'}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                      />
                      <label htmlFor="payment_partial" className="ml-2 block text-sm text-gray-900">
                        <span className="font-medium">Pay Partial Now & Pay Later</span>
                        <span className="text-gray-500 ml-2">
                          - Pay ₹{calculateInitialPayment()} now, balance due {trek.partialPayment.finalPaymentDueDays} days before trek
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Terms & Conditions Checkbox */}
              <div className="mt-6 mb-4">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="agreeToTerms"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded mt-1"
                    required
                  />
                  <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-900">
                    I agree to the{' '}
                    <a 
                      href="/terms" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-500 underline"
                    >
                      Terms & Conditions
                    </a>
                    {' '}and{' '}
                    <a 
                      href="/privacy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-500 underline"
                    >
                      Privacy Policy
                    </a>
                    {' '}*
                  </label>
                </div>
                {!agreeToTerms && (
                  <p className="mt-1 text-sm text-red-600">
                    You must agree to the Terms & Conditions to proceed with the booking.
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={processingPayment || !agreeToTerms}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${
                    processingPayment || !agreeToTerms ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {processingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Loading Payment...
                    </>
                  ) : (
                    paymentMode === 'partial' ? 'Pay Partial Amount' : 'Proceed to Payment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Trek Information
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Trek Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {trek.name}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Price per Person</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    ₹{selectedBatch?.price?.toFixed(2) || "0.00"}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Number of Participants</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formData.numberOfParticipants}
                  </dd>
                </div>
                {formData.addOns.length > 0 && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Add-ons</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <ul className="space-y-1">
                        {getSelectedAddOns().map(({ addOn, key }) => (
                          <li key={key}>
                            {addOn.name} - ₹{(addOn.price * formData.numberOfParticipants).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Base Amount</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {appliedCoupon && appliedCoupon.promoCode ? (
                      <div>
                        <span className="line-through text-gray-500">
                          ₹{calculateBasePrice().toFixed(2)}
                        </span>
                        <span className="ml-2">
                          ₹{calculateDiscountedPrice(calculateBasePrice()).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span>₹{calculateBasePrice().toFixed(2)}</span>
                    )}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">GST ({taxInfo.gstPercent}%)</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    ₹{(calculateDiscountedPrice(calculateBasePrice()) * (taxInfo.gstPercent / 100)).toFixed(2)}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Payment Gateway Charges ({taxInfo.gatewayPercent}%)</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    ₹{(calculateDiscountedPrice(calculateBasePrice()) * (taxInfo.gatewayPercent / 100)).toFixed(2)}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 font-semibold">
                  <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    ₹{calculateTotalPrice().toFixed(2)}
                  </dd>
                </div>
                
                {/* Partial Payment Breakdown */}
                {paymentMode === 'partial' && trek.partialPayment && trek.partialPayment.enabled && (
                  <>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Initial Payment</dt>
                      <dd className="mt-1 text-sm text-emerald-600 font-medium sm:mt-0 sm:col-span-2">
                        ₹{calculateInitialPayment()}
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Remaining Balance</dt>
                      <dd className="mt-1 text-sm text-gray-800 font-medium sm:mt-0 sm:col-span-2">
                        ₹{(calculateTotalPrice() - calculateInitialPayment()).toFixed(2)}
                      </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {selectedBatch && (() => {
                          const dueDate = new Date(selectedBatch.startDate);
                          dueDate.setDate(dueDate.getDate() - trek.partialPayment.finalPaymentDueDays);
                          return dueDate.toLocaleDateString();
                        })()}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Available Batches
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <div className="divide-y divide-gray-200">
                {trek.batches.sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).map((batch) => {
                  const isFull =
                    batch.currentParticipants >= batch.maxParticipants;
                  const isSelected = selectedBatch?._id === batch._id;
                  const spotsLeft =
                    batch.maxParticipants - batch.currentParticipants;

                  return (
                    <div
                      key={batch._id}
                      className={`px-4 py-4 sm:px-6 cursor-pointer hover:bg-gray-50 ${
                        isSelected ? "bg-emerald-50" : ""
                      }`}
                      onClick={() => !isFull && handleBatchSelect(batch)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(batch.startDate).toLocaleDateString()} -{" "}
                            {new Date(batch.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {isFull ? "Full" : `${spotsLeft} spots left`}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {isSelected && (
                            <svg
                              className="h-5 w-5 text-emerald-500"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      {verifyingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4">
            <LoadingSpinner />
            <p className="text-lg font-medium text-gray-900">Verifying Payment...</p>
            <p className="text-sm text-gray-600">Please wait while we verify your payment</p>
          </div>
        </div>
      )}


    </div>
  );
}

export default BookingPage;
