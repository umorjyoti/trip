import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { getTrekById, getAuthHeader, createBooking, getRazorpayKey, createPaymentOrder, verifyPayment } from "../services/api";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";

function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [trek, setTrek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  useEffect(() => {
    const fetchRazorpayKey = async () => {
      try {
        const key = await getRazorpayKey();
        setRazorpayKey(key);
      } catch (error) {
        console.error('Error fetching Razorpay key:', error);
        if (error.message === 'Please log in to proceed with booking') {
          navigate('/login', { state: { from: `/treks/${id}/book` } });
        } else {
          toast.error(error.message || 'Failed to initialize payment. Please try again.');
        }
      }
    };

    fetchRazorpayKey();
  }, [currentUser, id, navigate]);

  useEffect(() => {
    const fetchTrek = async () => {
      try {
        setLoading(true);
        const data = await getTrekById(id);
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
  }, [id, location.state]);

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

  const handleAddOnChange = (addOnId) => {
    setFormData((prev) => {
      const newAddOns = prev.addOns.includes(addOnId)
        ? prev.addOns.filter(id => id !== addOnId)
        : [...prev.addOns, addOnId];
      
      return {
        ...prev,
        addOns: newAddOns
      };
    });
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

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      toast.info("Please log in to book this trek");
      navigate("/login", { state: { from: `/treks/${id}/book` } });
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const bookingData = {
        trekId: id,
        batchId: selectedBatch._id,
        numberOfParticipants: formData.numberOfParticipants,
        addOns: formData.addOns,
        userDetails: formData.userDetails,
        totalPrice: calculateTotalPrice(),
      };

      const booking = await createBooking(bookingData);
      
      // Create Razorpay order using the API service
      const { order } = await createPaymentOrder(booking.totalPrice, booking._id);

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
            // Close Razorpay modal immediately
            if (this.modal) {
              this.modal.hide();
            }

            // Verify payment using the API service
            await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id,
            });

            toast.success('Payment successful! Please fill in participant details.');
            
            // Redirect to participant details page with necessary information
            navigate(`/booking/${booking._id}/participant-details`, { 
              state: { 
                paymentStatus: 'success',
                numberOfParticipants: formData.numberOfParticipants,
                addOns: formData.addOns,
                trekId: id,
                batchId: selectedBatch._id
              } 
            });
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error(error.message || 'Payment verification failed. Please contact support.');
            navigate(`/booking-detail/${booking._id}`, { state: { paymentStatus: 'failure' } });
          }
        },
        modal: {
          ondismiss: function() {
            toast.info('Payment cancelled. You can try again.');
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
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      };
      document.body.appendChild(script);

    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error(error.message || "Failed to create booking");
    }
  };

  const calculateTotalPrice = () => {
    if (!selectedBatch) return 0;

    // Calculate base price
    let basePrice = selectedBatch.price * formData.numberOfParticipants;

    // Add prices for selected add-ons
    formData.addOns.forEach((addOnId) => {
      const addOn = trek.addOns.find((a) => a._id === addOnId);
      if (addOn && addOn.isEnabled) {
        basePrice += addOn.price * formData.numberOfParticipants;
      }
    });

    // Calculate GST
    const gstAmount = basePrice * (taxInfo.gstPercent / 100);

    // Calculate payment gateway charges
    const gatewayCharges = basePrice * (taxInfo.gatewayPercent / 100);

    // Calculate total including GST and gateway charges
    const totalPrice = basePrice + gstAmount + gatewayCharges;

    return totalPrice;
  };

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
                  to={`/treks/${id}`}
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
                      .map((addOn) => (
                        <div
                          key={addOn._id}
                          className="relative flex items-start"
                        >
                          <div className="flex items-center h-5">
                            <input
                              id={`addon-${addOn._id}`}
                              type="checkbox"
                              checked={formData.addOns.includes(addOn._id)}
                              onChange={() => handleAddOnChange(addOn._id)}
                              className="focus:ring-emerald-500 h-4 w-4 text-emerald-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label
                              htmlFor={`addon-${addOn._id}`}
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
                      ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Proceed to Payment
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
                        {formData.addOns.map((addOnId) => {
                          const addOn = trek.addOns.find((a) => a._id === addOnId);
                          return addOn ? (
                            <li key={addOn._id}>
                              {addOn.name} - ₹{(addOn.price * formData.numberOfParticipants).toFixed(2)}
                            </li>
                          ) : null;
                        })}
                      </ul>
                    </dd>
                  </div>
                )}
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Base Amount</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    ₹{(selectedBatch?.price * formData.numberOfParticipants + 
                      formData.addOns.reduce((total, addOnId) => {
                        const addOn = trek.addOns.find((a) => a._id === addOnId);
                        return total + (addOn?.price || 0) * formData.numberOfParticipants;
                      }, 0)).toFixed(2)}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">GST ({taxInfo.gstPercent}%)</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    ₹{((selectedBatch?.price * formData.numberOfParticipants + 
                      formData.addOns.reduce((total, addOnId) => {
                        const addOn = trek.addOns.find((a) => a._id === addOnId);
                        return total + (addOn?.price || 0) * formData.numberOfParticipants;
                      }, 0)) * (taxInfo.gstPercent / 100)).toFixed(2)}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Payment Gateway Charges ({taxInfo.gatewayPercent}%)</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    ₹{((selectedBatch?.price * formData.numberOfParticipants + 
                      formData.addOns.reduce((total, addOnId) => {
                        const addOn = trek.addOns.find((a) => a._id === addOnId);
                        return total + (addOn?.price || 0) * formData.numberOfParticipants;
                      }, 0)) * (taxInfo.gatewayPercent / 100)).toFixed(2)}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 font-semibold">
                  <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    ₹{calculateTotalPrice().toFixed(2)}
                  </dd>
                </div>
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
                {trek.batches.map((batch) => {
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
    </div>
  );
}

export default BookingPage;
