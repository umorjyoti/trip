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
      
      // Skip existing booking check - directly create new booking
      
      // Generate a unique session ID for this booking attempt
      const sessionId = `session_${Date.now()}_${currentUser._id}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Map selected add-on IDs to { name, price } objects
      const validAddOns = trek.addOns
        .map((addOn, idx) => ({ ...addOn, key: getAddOnKey(addOn, idx) }))
        .filter(({ key, isEnabled }) => isEnabled && formData.addOns.includes(key))
        .map(({ _id, name, price }) => ({ _id, name, price }));

      // Calculate the frontend initial partial payment amount for backend validation
      let frontendInitialAmount = undefined;
      if (paymentMode === 'partial' && trek.partialPayment && trek.partialPayment.enabled) {
        if (trek.partialPayment.amountType === 'percentage') {
          frontendInitialAmount = Math.round((calculateTotalPrice() * trek.partialPayment.amount) / 100);
        } else {
          frontendInitialAmount = trek.partialPayment.amount * formData.numberOfParticipants;
        }
      }

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
        sessionId: sessionId, // Add session ID to prevent duplicate bookings
        frontendInitialAmount // Add for backend validation
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
        name: 'Trek Booking',
        description: `Trek Booking Payment${paymentMode === 'partial' ? ' (Partial)' : ''}${appliedCoupon ? ` (with ${appliedCoupon.promoCode.discountValue}% discount)` : ''}`,
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{trek.name}</h1>
              <p className="text-sm text-gray-500">Complete your booking</p>
            </div>
            <Link
              to={`/treks/${name}`}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              ← Back to Trek
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Batch Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Batch</h2>
            <div className="space-y-3">
              {trek.batches
                .filter((batch) => batch.status === "active")
                .map((batch) => {
                  const spotsLeft = batch.maxParticipants - batch.currentParticipants;
                  const isSelected = selectedBatch?._id === batch._id;
                  const isFull = spotsLeft <= 0;

                  return (
                    <div
                      key={batch._id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"
                      } ${isFull ? "opacity-50 cursor-not-allowed" : ""}`}
                      onClick={() => !isFull && handleBatchSelect(batch)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(batch.startDate).toLocaleDateString()} - {new Date(batch.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {isFull ? "Full" : `${spotsLeft} spots left`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₹{batch.price}</p>
                          <p className="text-sm text-gray-500">per person</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h2>
            
            {/* Participants */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Participants
              </label>
              <select
                value={formData.numberOfParticipants}
                onChange={handleParticipantsChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              >
                {[...Array(selectedBatch ? selectedBatch.maxParticipants - selectedBatch.currentParticipants : 0)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>

            {/* Contact Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.userDetails.name}
                  onChange={handleUserDetailsChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.userDetails.email}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                  disabled
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.userDetails.phone}
                  onChange={handleUserDetailsChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  placeholder="Enter 10-digit phone number"
                  pattern="[0-9]{10}"
                  maxLength="10"
                />
              </div>
            </div>
          </div>

          {/* Add-ons */}
          {trek.addOns && trek.addOns.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Optional Add-ons</h2>
              <div className="space-y-3">
                {trek.addOns
                  .filter((addOn) => addOn.isEnabled)
                  .map((addOn, idx) => {
                    const addOnKey = getAddOnKey(addOn, idx);
                    return (
                      <div key={addOnKey} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.addOns.includes(addOnKey)}
                          onChange={() => handleAddOnChange(addOnKey)}
                          className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <div className="ml-3 flex-1">
                          <label className="font-medium text-gray-900">
                            {addOn.name}
                          </label>
                          {addOn.description && (
                            <p className="text-sm text-gray-500">{addOn.description}</p>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900">₹{addOn.price}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Coupon Code */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Coupon Code</h2>
            <div className="flex space-x-3">
              <input
                type="text"
                value={couponCode}
                onChange={handleCouponCodeChange}
                placeholder="Enter coupon code"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500"
              >
                Apply
              </button>
            </div>
            {couponError && (
              <p className="mt-2 text-sm text-red-600">{couponError}</p>
            )}
            {appliedCoupon && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg flex justify-between items-center">
                <span className="text-sm text-green-700">
                  {appliedCoupon.promoCode.code} - {appliedCoupon.promoCode.discountType === 'percentage' 
                    ? `${appliedCoupon.promoCode.discountValue}% off` 
                    : `₹${appliedCoupon.promoCode.discountValue} off`}
                </span>
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

          {/* Payment Options */}
          {trek.partialPayment && trek.partialPayment.enabled && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Options</h2>
              <div className="space-y-3">
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMode"
                    value="full"
                    checked={paymentMode === 'full'}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                  />
                  <div className="ml-3">
                    <span className="font-medium text-gray-900">Pay in Full</span>
                    <p className="text-sm text-gray-500">Pay the complete amount now</p>
                  </div>
                </label>
                
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMode"
                    value="partial"
                    checked={paymentMode === 'partial'}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                  />
                  <div className="ml-3">
                    <span className="font-medium text-gray-900">Pay Partial Now</span>
                    <p className="text-sm text-gray-500">
                      Pay ₹{trek.partialPayment.amountType === 'percentage' 
                        ? Math.round((calculateTotalPrice() * trek.partialPayment.amount) / 100)
                        : trek.partialPayment.amount * formData.numberOfParticipants} now, balance due {trek.partialPayment.finalPaymentDueDays} days before trek
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Pricing Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Price ({formData.numberOfParticipants} × ₹{selectedBatch?.price})</span>
                <span className="font-medium">₹{calculateBasePrice().toFixed(2)}</span>
              </div>
              
              {getSelectedAddOns().length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Add-ons</span>
                  <span className="font-medium">₹{getSelectedAddOns().reduce((sum, { addOn }) => sum + (addOn.price * formData.numberOfParticipants), 0).toFixed(2)}</span>
                </div>
              )}
              
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedCoupon.promoCode.code})</span>
                  <span>-₹{(calculateBasePrice() * (appliedCoupon.promoCode.discountValue / 100)).toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">GST ({taxInfo.gstPercent}%)</span>
                <span className="font-medium">₹{(calculateDiscountedPrice(calculateBasePrice()) * (taxInfo.gstPercent / 100)).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Gateway Charges ({taxInfo.gatewayPercent}%)</span>
                <span className="font-medium">₹{(calculateDiscountedPrice(calculateBasePrice()) * (taxInfo.gatewayPercent / 100)).toFixed(2)}</span>
              </div>
              
              <div className="border-t pt-3 flex justify-between text-lg font-semibold">
                <span>Total Amount</span>
                <span>₹{calculateTotalPrice().toFixed(2)}</span>
              </div>
              
              {paymentMode === 'partial' && trek.partialPayment && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Initial Payment</span>
                    <span className="font-medium text-blue-700">₹{trek.partialPayment.amountType === 'percentage' 
                      ? Math.round((calculateTotalPrice() * trek.partialPayment.amount) / 100)
                      : trek.partialPayment.amount * formData.numberOfParticipants}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-blue-700">Remaining Balance</span>
                    <span className="font-medium text-blue-700">₹{(calculateTotalPrice() - (trek.partialPayment.amountType === 'percentage' 
                      ? Math.round((calculateTotalPrice() * trek.partialPayment.amount) / 100)
                      : trek.partialPayment.amount * formData.numberOfParticipants)).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Terms & Submit */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start mb-6">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="h-4 w-4 text-emerald-600 border-gray-300 rounded mt-1 focus:ring-emerald-500"
                required
              />
              <label className="ml-3 text-sm text-gray-700">
                I agree to the{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-500 underline">
                  Terms & Conditions
                </a>
                {' '}and{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-500 underline">
                  Privacy Policy
                </a>
              </label>
            </div>
            
            <button
              type="submit"
              disabled={processingPayment || !agreeToTerms}
              className={`w-full py-3 px-4 border border-transparent rounded-lg text-white font-medium focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${
                processingPayment || !agreeToTerms 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {processingPayment ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                paymentMode === 'partial' ? 'Pay Partial Amount' : 'Proceed to Payment'
              )}
            </button>
          </div>
        </form>

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
    </div>
  );
}

export default BookingPage;
