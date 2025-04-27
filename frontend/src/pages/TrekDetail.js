import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getTrekById,
  getActiveOffers,
  addToWishlist,
  removeFromWishlist,
  getUserWishlist,
  getTreksByRegion,
  getRegionById,
} from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import BookingForm from "../components/BookingForm";
import { toast } from "react-toastify";
import {
  FaClock,
  FaMapMarkerAlt,
  FaUsers,
  FaMountain,
  FaCalendarAlt,
  FaTag,
  FaInfoCircle,
  FaShare,
  FaHeart,
  FaRegHeart,
} from "react-icons/fa";
import LeadCaptureForm from "../components/LeadCaptureForm";
import TrekCard from "../components/TrekCard";
import TrekItinerary from "../components/TrekItinerary";
import TrekInclusionsExclusions from "../components/TrekInclusionsExclusions";
import ThingsToPack from '../components/ThingsToPack';
import TrekFAQs from '../components/TrekFAQs';

function TrekDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trek, setTrek] = useState(null);
  const [relatedTreks, setRelatedTreks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [activeOffers, setActiveOffers] = useState([]);
  const [discountedPrice, setDiscountedPrice] = useState(null);
  const [applicableOffer, setApplicableOffer] = useState(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [regionName, setRegionName] = useState('');

  // Check if trek is disabled
  const isTrekDisabled = trek && !trek.isEnabled;

  // Check if there are available batches
  const hasAvailableBatches =
    trek &&
    trek.batches &&
    trek.batches.length > 0 &&
    trek.batches.some(
      (batch) => batch.currentParticipants < batch.maxParticipants
    );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch trek details
        const trekData = await getTrekById(id);
        setTrek(trekData);

        // Fetch active offers
        const offers = await getActiveOffers();
        setActiveOffers(offers);

        // Find applicable offer for this trek
        const offer = offers.find((o) =>
          o.applicableTreks.some((t) => t._id === id)
        );

        if (offer) {
          setApplicableOffer(offer);

          // Calculate discounted price
          let discounted;
          const basePrice = getPrice(trekData);

          if (offer.discountType === "percentage") {
            discounted = basePrice - (basePrice * offer.discountValue) / 100;
          } else {
            discounted = Math.max(0, basePrice - offer.discountValue);
          }
          setDiscountedPrice(discounted);
        }

        // Check if trek is in user's wishlist
        if (currentUser) {
          checkWishlistStatus();
        }

        // Fetch related treks from the same region
        if (trekData.region) {
          const relatedTreksData = await getTreksByRegion(trekData.region);
          // Filter out the current trek
          const filteredTreks = relatedTreksData.filter(
            (relatedTrek) => relatedTrek._id !== trekData._id
          );
          // Limit to 3 related treks
          setRelatedTreks(filteredTreks.slice(0, 3));
        }

        setError(null);
      } catch (error) {
        console.error("Error fetching trek details:", error);
        setError("Failed to load trek details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, currentUser]);

  useEffect(() => {
    const fetchRegionName = async () => {
      if (trek?.region && typeof trek.region === 'string' && trek.region.match(/^[0-9a-fA-F]{24}$/)) {
        try {
          const regionData = await getRegionById(trek.region);
          setRegionName(regionData.name);
        } catch (error) {
          console.error('Error fetching region:', error);
          setRegionName('Unknown Region');
        }
      } else if (typeof trek?.region === 'object' && trek?.region?.name) {
        setRegionName(trek.region.name);
      }
    };
    
    if (trek) {
      fetchRegionName();
    }
  }, [trek]);

  const checkWishlistStatus = async () => {
    try {
      const wishlist = await getUserWishlist();
      const isInList = wishlist.some((item) => item._id === id);
      setIsInWishlist(isInList);
    } catch (err) {
      console.error("Error checking wishlist status:", err);
    }
  };

  // Helper function to get price from different possible locations
  const getPrice = (trekData) => {
    const trek = trekData || {};
    // Check different possible price properties
    if (trek.price !== undefined && trek.price !== null) {
      return Number(trek.price);
    } else if (trek.basePrice !== undefined && trek.basePrice !== null) {
      return Number(trek.basePrice);
    } else if (
      trek.batches &&
      trek.batches.length > 0 &&
      trek.batches[0].price
    ) {
      return Number(trek.batches[0].price);
    }
    return 0;
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return "₹0.00";
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Function to determine difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800";
      case "Moderate":
        return "bg-blue-100 text-blue-800";
      case "Difficult":
        return "bg-orange-100 text-orange-800";
      case "Challenging":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to determine season color
  const getSeasonColor = (season) => {
    switch (season) {
      case "Spring":
        return "bg-pink-100 text-pink-800";
      case "Summer":
        return "bg-yellow-100 text-yellow-800";
      case "Monsoon":
        return "bg-blue-100 text-blue-800";
      case "Autumn":
        return "bg-amber-100 text-amber-800";
      case "Winter":
        return "bg-blue-100 text-blue-800";
      case "All Year":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleBatchSelect = (batch) => {
    // Validate that the batch exists and has spots available
    if (!batch) {
      toast.error("Please select a valid batch");
      return;
    }

    // Check if the batch is full
    if (batch.currentParticipants >= batch.maxParticipants) {
      toast.error("This batch is already full");
      return;
    }

    // Add console logs to debug
    console.log("Selected batch:", batch);

    // If all checks pass, proceed with booking
    navigate(`/treks/${id}/book`, { 
      state: { 
        selectedBatchId: batch._id,
        trekName: trek.name,
        batchDates: {
          startDate: batch.startDate,
          endDate: batch.endDate
        }
      } 
    });
  };

  const handleBookNowClick = () => {
    if (!currentUser) {
      toast.info("Please log in to book this trek");
      navigate("/login", { state: { from: `/treks/${id}/book` } });
      return;
    }

    navigate(`/treks/${id}/book`);
  };

  const handleBatchBookNowClick = (batch) => {
    if (!currentUser) {
      toast.info("Please log in to book this trek");
      navigate("/login", { state: { from: `/treks/${id}/book` } });
      return;
    }

    navigate(`/treks/${id}/book`, { 
      state: { 
        selectedBatchId: batch._id,
        trekName: trek.name,
        batchDates: {
          startDate: batch.startDate,
          endDate: batch.endDate
        }
      } 
    });
  };

  const handleCloseBookingForm = () => {
    setShowBookingForm(false);
  };

  const handleBookingSuccess = (bookingId) => {
    setShowBookingForm(false);
    toast.success("Booking successful!");
    navigate(`/booking-detail/${bookingId}`);
  };

  const handleGetInfoClick = () => {
    setShowLeadForm(true);
  };

  const handleCloseLeadForm = () => {
    setShowLeadForm(false);
  };

  const handleShareClick = () => {
    // Check if the Web Share API is available
    if (navigator.share) {
      navigator
        .share({
          title: trek.name,
          text: `Check out this amazing trek: ${trek.name}`,
          url: window.location.href,
        })
        .then(() => console.log("Successful share"))
        .catch((error) => console.log("Error sharing:", error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      // Copy the URL to clipboard
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
          toast.success("Link copied to clipboard!");
        })
        .catch((err) => {
          console.error("Could not copy text: ", err);
          toast.error("Failed to copy link");
        });
    }
  };

  const toggleWishlist = async () => {
    if (!currentUser) {
      toast.info("Please log in to save treks to your wishlist");
      navigate("/login");
      return;
    }

    try {
      setWishlistLoading(true);

      if (isInWishlist) {
        // Remove from wishlist - make sure id is passed correctly
        await removeFromWishlist(id); // id should be the trek ID
        setIsInWishlist(false);
        toast.success("Trek removed from wishlist");
      } else {
        // Add to wishlist - make sure id is passed correctly
        await addToWishlist(id); // id should be the trek ID
        setIsInWishlist(true);
        toast.success("Trek added to wishlist");
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      toast.error(
        isInWishlist
          ? "Failed to remove trek from wishlist"
          : "Failed to add trek to wishlist"
      );
    } finally {
      setWishlistLoading(false);
    }
  };

  // Render batches section
  const renderBatches = () => {
    if (!trek.batches || trek.batches.length === 0) {
      return (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900">
            Upcoming Batches
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            No upcoming batches available for this trek.
          </p>
        </div>
      );
    }

    return (
      <div className="mt-6 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900">Upcoming Batches</h3>
        <div className="mt-4 space-y-4">
          {trek.batches.map((batch) => {
            const isFull = batch.currentParticipants >= batch.maxParticipants;
            const isDisabled = isTrekDisabled || isFull;
            const spotsLeft = batch.maxParticipants - batch.currentParticipants;

            return (
              <div
                key={batch._id}
                className="border border-gray-200 rounded-md p-4 hover:border-emerald-500 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(batch.startDate)} -{" "}
                      {formatDate(batch.endDate)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {isFull ? "Full" : `${spotsLeft} spots left`}
                    </p>
                  </div>
                  <div className="text-right">
                    {applicableOffer ? (
                      <div>
                        <p className="text-sm font-bold text-emerald-600">
                          {formatCurrency(
                            applicableOffer.discountType === "percentage"
                              ? batch.price -
                                  (batch.price *
                                    applicableOffer.discountValue) /
                                    100
                              : Math.max(
                                  0,
                                  batch.price - applicableOffer.discountValue
                                )
                          )}
                        </p>
                        <p className="text-xs text-gray-500 line-through">
                          {formatCurrency(batch.price)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-emerald-600">
                        {formatCurrency(batch.price)}
                      </p>
                    )}
                    <button
                      onClick={() => handleBatchBookNowClick(batch)}
                      disabled={isDisabled}
                      className={`mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                        isDisabled
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {isFull ? "Full" : "Book Now"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render batch selection modal
  const renderBatchSelectionModal = () => {
    if (!selectedBatch) return null;

    return (
      <div className="mt-6 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900">Selected Batch</h3>
        <div className="mt-4 bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(selectedBatch.startDate)} -{" "}
                {formatDate(selectedBatch.endDate)}
              </p>
              <p className="text-sm text-gray-500">
                {selectedBatch.maxParticipants -
                  selectedBatch.currentParticipants}{" "}
                spots left
              </p>
            </div>
            <div className="text-right">
              {applicableOffer ? (
                <div>
                  <p className="text-sm font-bold text-emerald-600">
                    {formatCurrency(
                      applicableOffer.discountType === "percentage"
                        ? selectedBatch.price -
                            (selectedBatch.price *
                              applicableOffer.discountValue) /
                            100
                        : Math.max(
                            0,
                            selectedBatch.price - applicableOffer.discountValue
                          )
                    )}
                  </p>
                  <p className="text-xs text-gray-500 line-through">
                    {formatCurrency(selectedBatch.price)}
                  </p>
                </div>
              ) : (
                <p className="text-sm font-bold text-emerald-600">
                  {formatCurrency(selectedBatch.price)}
                </p>
              )}
              <button
                onClick={handleBatchBookNowClick}
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                disabled={isTrekDisabled}
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render debug information for admins
  const renderDebugInfo = () => {
    return (
      <div className="mt-8 bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">
          Debug Information (Admin Only)
        </h3>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(trek, null, 2)}
        </pre>
      </div>
    );
  };

  // Add this function to render the price section with discount
  const renderPriceSection = () => {
    if (!trek) return null;

    const displayPrice = getPrice(trek);

    return (
      <div className="mt-6 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900">Pricing</h3>

        {discountedPrice ? (
          <div className="mt-2">
            <div className="flex items-center">
              <span className="text-3xl font-bold text-emerald-600 mr-3">
                {formatCurrency(discountedPrice)}
              </span>
              <span className="text-xl text-gray-500 line-through">
                {formatCurrency(displayPrice)}
              </span>
              <span className="ml-3 bg-gradient-to-r from-amber-600 to-orange-400 text-white text-sm px-3 py-1 rounded-md flex items-center shadow-sm">
                <FaTag className="mr-1" />
                {applicableOffer.discountType === "percentage"
                  ? `${applicableOffer.discountValue}% OFF`
                  : `${formatCurrency(applicableOffer.discountValue)} OFF`}
              </span>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-md w-full">
                <p className="font-medium">Limited Time Offer</p>
                <p className="text-amber-700 mt-1">
                  Valid until{" "}
                  {new Date(applicableOffer.endDate).toLocaleDateString()}
                </p>
                {applicableOffer.description && (
                  <p className="text-amber-700 mt-1 italic">
                    {applicableOffer.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : displayPrice > 0 ? (
          <div className="mt-2">
            <span className="text-3xl font-bold text-emerald-600">
              {formatCurrency(displayPrice)}
            </span>
            <span className="ml-2 text-gray-500">per person</span>
          </div>
        ) : (
          <div className="mt-2">
            <span className="text-xl font-medium text-gray-900">
              Contact for pricing
            </span>
          </div>
        )}

        <p className="mt-4 text-sm text-gray-500">
          Price includes all activities, accommodations, and guided tours as
          described.
          {trek.priceIncludes && (
            <span className="block mt-1">{trek.priceIncludes}</span>
          )}
        </p>
      </div>
    );
  };

  const renderQuickActions = () => {
    return (
      <div className="mt-6 flex flex-col space-y-3">
        <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {/* Share Action */}
          <button
            onClick={handleShareClick}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            <FaShare className="mr-2" />
            Share
          </button>

          {/* Add to Wishlist Action */}
          <button
            onClick={toggleWishlist}
            disabled={wishlistLoading}
            className={`flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 ${
              isInWishlist ? "bg-red-50" : ""
            }`}
          >
            {wishlistLoading ? (
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : isInWishlist ? (
              <FaHeart className="mr-2 text-red-500" />
            ) : (
              <FaRegHeart className="mr-2" />
            )}
            {isInWishlist ? "Added to Wishlist" : "Add to Wishlist"}
          </button>

          {/* Send as Lead Action */}
          <button
            onClick={handleGetInfoClick}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            <FaInfoCircle className="mr-2" />
            Get More Info
          </button>
        </div>
      </div>
    );
  };

  // Update the renderRelatedTreks function for better UI
  const renderRelatedTreks = () => {
    if (!relatedTreks || relatedTreks.length === 0) {
      return null;
    }

    return (
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              More Treks in {regionName}
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              Discover other amazing adventures in this region
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {relatedTreks.map((relatedTrek) => (
              <TrekCard key={relatedTrek._id} trek={relatedTrek} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to={`/regions/${trek.region}`}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Explore All Treks in {regionName}
            </Link>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
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
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
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

  if (!trek) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Trek not found. It may have been removed or is no longer
                available.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
     {showLeadForm && (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex  items-center justify-center p-4 text-center">
            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <LeadCaptureForm
                trekId={trek._id}
                trekName={trek.name}
                onClose={handleCloseLeadForm}
              />
            </div>
          </div>
        </div>
      </div>
    )}
    <div className="bg-white">
      {/* Trek disabled warning */}
      {isTrekDisabled && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 bg-yellow-50">
          <div className="flex items-center justify-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                This trek is currently not available for booking.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trek header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Trek image */}
          <div className="relative lg:col-span-1">
            <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
              <img
                src={
                  trek.imageUrl ||
                  "https://images.unsplash.com/photo-1501555088652-021faa106b9b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                }
                alt={trek.name}
                className="w-full h-full object-center object-cover"
              />
            </div>

            {/* Trek tags */}
            <div className="mt-4 flex flex-wrap gap-2">
              {trek.difficulty && (
                <span
                  className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${getDifficultyColor(
                    trek.difficulty
                  )}`}
                >
                  {trek.difficulty}
                </span>
              )}
              {trek.season && (
                <span
                  className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${getSeasonColor(
                    trek.season
                  )}`}
                >
                  {trek.season}
                </span>
              )}
              {regionName && (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                  {regionName}
                </span>
              )}
              {trek.duration && (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {trek.duration} days
                </span>
              )}
            </div>

            {/* Trek description */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
              <div className="mt-4 prose prose-emerald prose-lg text-gray-500 max-w-none">
                <p>{trek.description}</p>
              </div>
            </div>
          </div>

          {/* Trek details */}
          <div className="mt-8 lg:mt-0 lg:col-span-1">
            <div className="flex justify-between">
              <h1 className="text-3xl font-extrabold text-gray-900">
                {trek.name}
              </h1>
            </div>

            {/* Trek highlights */}
            <div className="mt-4 space-y-4">
              {trek.location && (
                <div className="flex items-start">
                  <FaMapMarkerAlt className="flex-shrink-0 h-5 w-5 text-emerald-600 mt-0.5" />
                  <p className="ml-3 text-base text-gray-700">
                    {trek.location}
                  </p>
                </div>
              )}

              {trek.duration && (
                <div className="flex items-start">
                  <FaClock className="flex-shrink-0 h-5 w-5 text-emerald-600 mt-0.5" />
                  <p className="ml-3 text-base text-gray-700">
                    {trek.duration} days
                  </p>
                </div>
              )}

              {trek.maxGroupSize && (
                <div className="flex items-start">
                  <FaUsers className="flex-shrink-0 h-5 w-5 text-emerald-600 mt-0.5" />
                  <p className="ml-3 text-base text-gray-700">
                    Max group size: {trek.maxGroupSize} people
                  </p>
                </div>
              )}

              {trek.elevation && (
                <div className="flex items-start">
                  <FaMountain className="flex-shrink-0 h-5 w-5 text-emerald-600 mt-0.5" />
                  <p className="ml-3 text-base text-gray-700">
                    Max elevation: {trek.elevation} meters
                  </p>
                </div>
              )}
            </div>

            {/* Additional Trek Details */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900">
                Trek Details
              </h3>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {trek.region && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-emerald-600"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Region
                      </p>
                      <p className="text-sm text-gray-500">
                        {regionName}
                      </p>
                    </div>
                  </div>
                )}

                {trek.bestTimeToVisit && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-emerald-600"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Best Time to Visit
                      </p>
                      <p className="text-sm text-gray-500">
                        {trek.bestTimeToVisit}
                      </p>
                    </div>
                  </div>
                )}

                {trek.startingPoint && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-emerald-600"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Starting Point
                      </p>
                      <p className="text-sm text-gray-500">
                        {trek.startingPoint}
                      </p>
                    </div>
                  </div>
                )}

                {trek.endingPoint && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-emerald-600"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Ending Point
                      </p>
                      <p className="text-sm text-gray-500">
                        {trek.endingPoint}
                      </p>
                    </div>
                  </div>
                )}

                {trek.altitude && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-emerald-600"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Maximum Altitude
                      </p>
                      <p className="text-sm text-gray-500">
                        {trek.altitude} meters
                      </p>
                    </div>
                  </div>
                )}

                {trek.difficulty && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-emerald-600"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Difficulty Level
                      </p>
                      <p className="text-sm text-gray-500">{trek.difficulty}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Trek Highlights */}
            {trek.highlights && trek.highlights.length > 0 && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Highlights
                </h3>
                <ul className="mt-4 space-y-2">
                  {trek.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="h-5 w-5 text-emerald-500 mt-0.5"
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
                      <span className="ml-2 text-gray-700">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Price section */}
            {renderPriceSection()}

            {/* Quick Actions */}
            {renderQuickActions()}
          </div>
        </div>

        {/* Trek batches/dates */}
        {trek.batches && trek.batches.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">
              Available Dates
            </h2>
            <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Start Date
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      End Date
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Availability
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Price
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">Book</span> 
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {trek.batches.map((batch) => {
                    const isFull =
                      batch.currentParticipants >= batch.maxParticipants;
                    const isDisabled = isTrekDisabled || isFull;
                    const availability =
                      batch.maxParticipants - batch.currentParticipants;

                    return (
                      <tr key={batch._id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {formatDate(batch.startDate)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDate(batch.endDate)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {isFull ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Full
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                availability <= 3
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {availability}{" "}
                              {availability === 1 ? "spot" : "spots"} left
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatCurrency(batch.price || trek.price)}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => handleBatchSelect(batch)}
                            disabled={isDisabled}
                            className={`${
                              isDisabled
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-emerald-600 hover:bg-emerald-700"
                            } text-white px-3 py-1 rounded-md`}
                          >
                            {isFull ? "Full" : "Book"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trek itinerary */}
        {trek.itinerary && trek.itinerary.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Trek Itinerary
            </h2>
            <TrekItinerary itinerary={trek.itinerary} />{" "}
          </div>
        )}

        {/* Trek inclusions & exclusions */}
        {(trek.includes?.length > 0 || trek.excludes?.length > 0) && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Inclusions & Exclusions
            </h2>
            <TrekInclusionsExclusions
              includes={trek.includes}
              excludes={trek.excludes}
            />
          </div>
        )}

        {/* Things to Pack */}
        {trek.thingsToPack && trek.thingsToPack.length > 0 && (
          <div className="mt-12">
            <ThingsToPack items={trek.thingsToPack} />
          </div>
        )}

        {/* FAQs */}
        {trek.faqs && trek.faqs.length > 0 && (
          <div className="mt-12">
            <TrekFAQs faqs={trek.faqs} />
          </div>
        )}
      </div>

      {/* Booking form modal */}
      {showBookingForm && selectedBatch && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-2xl w-full mx-4">
            <BookingForm
              trek={trek}
              batch={selectedBatch}
              onClose={handleCloseBookingForm}
              onSuccess={handleBookingSuccess}
            />
          </div>
        </div>
      )}

     

      {/* Add the related treks section */}
      {!loading && !error && trek && renderRelatedTreks()}
    </div>
    
   </>
  );
}

export default TrekDetail;
