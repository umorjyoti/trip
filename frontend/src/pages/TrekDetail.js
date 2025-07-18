import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  getTrekById,
  getTrekBySlug,
  getActiveOffers,
  getTreksByRegion,
  formatCurrency,
  createTrekSlug,
  createRegionSlug,
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
  FaDownload,
  FaLink,
} from "react-icons/fa";
import LeadCaptureForm from "../components/LeadCaptureForm";
import TrekCard from "../components/TrekCard";
import TrekItinerary from "../components/TrekItinerary";
import TrekInclusionsExclusions from "../components/TrekInclusionsExclusions";
import ThingsToPack from "../components/ThingsToPack";
import TrekFAQs from "../components/TrekFAQs";
import Modal from "../components/Modal";
import CancellationPolicy from "../components/CancellationPolicy";
import { format, parseISO, addMonths, isSameMonth } from "date-fns";
import CustomTrekBookingForm from "../components/CustomTrekBookingForm";

// Add this new component at the top level of the file
const BatchesTabView = ({
  batches,
  onBatchSelect,
  isTrekDisabled,
  currentUser,
  navigate,
  trekId,
}) => {
  // Group batches by month
  const batchesByMonth = batches.reduce((acc, batch) => {
    const startDate = parseISO(batch.startDate);
    const monthKey = format(startDate, "yyyy-MM");
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(batch);
    return acc;
  }, {});

  // Get unique months from batches and sort them
  const uniqueMonths = Object.keys(batchesByMonth)
    .map((key) => parseISO(key + "-01"))
    .sort((a, b) => a - b)
    .filter((month) => batchesByMonth[format(month, "yyyy-MM")].length > 0); // Only keep months with batches

  // Initialize selected month to the first available month
  const [selectedMonth, setSelectedMonth] = useState(
    uniqueMonths[0] || new Date()
  );
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Get next three months for tabs
  const nextThreeMonths = uniqueMonths.slice(0, 3);
  const remainingMonths = uniqueMonths.slice(3);

  // Debug remaining months
  console.log('Remaining months:', remainingMonths.length, remainingMonths.map(m => format(m, "MMMM yyyy")));

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const handleBatchSelect = (batch) => {
    setSelectedBatch(batch._id === selectedBatch?._id ? null : batch);
  };

  const handleMonthSelect = (month) => {
    console.log('Setting selected month to:', format(month, "MMMM yyyy"));
    setSelectedMonth(month);
    setShowMonthDropdown(false);
  };

  const handleBookNow = () => {
    if (!currentUser) {
      toast.info("Please log in to book this trek");
      navigate("/login", { state: { from: `/treks/${trekId}/book` } });
      return;
    }

    if (selectedBatch) {
      onBatchSelect(selectedBatch);
    }
  };

  // Handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is on a dropdown item
      const isDropdownItem = event.target.closest('[role="menuitem"]');
      if (isDropdownItem) {
        return; // Don't close if clicking on a dropdown item
      }
      
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMonthDropdown(false);
      }
    };

    if (showMonthDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMonthDropdown]);



  // If no batches are available, show a message
  if (uniqueMonths.length === 0) {
    return (
      <div className="mt-8 p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-600">No trek dates are currently available.</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="border-b border-gray-200">
        <div className="flex items-center overflow-x-auto relative">
          {/* Tabs for next three months */}
          <nav className="flex -mb-px space-x-2 sm:space-x-4 flex-grow min-w-0">
            {nextThreeMonths.map((month) => (
              <button
                key={format(month, "yyyy-MM")}
                onClick={() => setSelectedMonth(month)}
                className={`
                  py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap flex-shrink-0
                  ${
                    isSameMonth(month, selectedMonth)
                      ? "border-emerald-500 text-emerald-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                {format(month, "MMM yyyy")}
              </button>
            ))}
          </nav>

          {/* Dropdown for remaining months */}
          {remainingMonths.length > 0 && (
            <div className="relative flex-shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                className={`py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium flex items-center rounded-md transition-colors ${
                  showMonthDropdown 
                    ? 'text-emerald-600 bg-emerald-50 border-emerald-200' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="hidden sm:inline">More Months</span>
                <span className="sm:hidden">More</span>
                <svg
                  className={`ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform ${
                    showMonthDropdown ? 'rotate-180' : ''
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {showMonthDropdown && ReactDOM.createPortal(
                <div 
                  className="fixed z-50 w-48 rounded-md shadow-xl bg-white ring-1 ring-black ring-opacity-5 border border-gray-200 max-h-60 overflow-y-auto"
                  style={{
                    top: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().bottom + 4 : 0,
                    left: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().right - 192 : 0,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-1" role="menu">
                    {remainingMonths.map((month) => (
                      <button
                        key={format(month, "yyyy-MM")}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMonthSelect(month);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none cursor-pointer"
                        role="menuitem"
                        type="button"
                      >
                        {format(month, "MMMM yyyy")}
                      </button>
                    ))}
                  </div>
                </div>,
                document.body
              )}
            </div>
          )}
        </div>
      </div>

      {/* Batches for selected month */}
      <div className="mt-4">
        {batchesByMonth[format(selectedMonth, "yyyy-MM")]?.map((batch) => {
          const isFull = batch.currentParticipants >= batch.maxParticipants;
          const isDisabled = isTrekDisabled || isFull;
          const availability = batch.availableSpots || (batch.maxParticipants - batch.currentParticipants);
          const isSelected = selectedBatch?._id === batch._id;

          return (
            <div
              key={batch._id}
              onClick={() => !isDisabled && handleBatchSelect(batch)}
              className={`
                p-4 mb-4 rounded-lg border-2 cursor-pointer transition-all
                ${
                  isDisabled
                    ? "bg-gray-50 cursor-not-allowed"
                    : "hover:border-emerald-200"
                }
                ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200"
                }
              `}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {format(parseISO(batch.startDate), "dd MMM")} -{" "}
                    {format(parseISO(batch.endDate), "dd MMM yyyy")}
                  </div>
                  <div className="mt-1">
                    {isFull ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Full
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${
                          availability <= 3
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {availability} {availability === 1 ? "spot" : "spots"}{" "}
                        left
                      </span>
                    )}
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="text-lg font-bold text-emerald-600">
                    {formatCurrency(batch.price)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Book Now button */}
        <div className="mt-6 sticky bottom-4">
          <button
            disabled={!selectedBatch}
            onClick={handleBookNow}
            className={`w-full py-3 px-4 rounded-lg font-medium shadow-lg transition-colors ${
              selectedBatch
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {selectedBatch ? "Book Now" : "Select a batch to book"}
          </button>
        </div>
      </div>
    </div>
  );
};

function TrekDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [regionName, setRegionName] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const galleryModalRef = useRef(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef(null);
  const headerScrollRef = useRef(null);
  const [headerScrollState, setHeaderScrollState] = useState({
    isScrollable: false,
    thumbLeft: 0,
    thumbWidth: 0,
  });

  // Calculate scrollbar thumb size and position for header
  const updateHeaderScrollBar = () => {
    const el = headerScrollRef.current;
    if (!el) return;
    const { scrollWidth, clientWidth, scrollLeft } = el;
    if (scrollWidth > clientWidth) {
      const ratio = clientWidth / scrollWidth;
      const thumbWidth = Math.max(ratio * clientWidth, 40); // min width
      const maxScrollLeft = scrollWidth - clientWidth;
      const thumbLeft =
        (scrollLeft / maxScrollLeft) * (clientWidth - thumbWidth) || 0;
      setHeaderScrollState({
        isScrollable: true,
        thumbWidth,
        thumbLeft,
      });
    } else {
      setHeaderScrollState({
        isScrollable: false,
        thumbWidth: 0,
        thumbLeft: 0,
      });
    }
  };

  // Handle smooth scrolling
  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 120; // Account for header + sticky nav + some padding
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  // Scroll to batch selection area
  const scrollToBatchSelection = () => {
    const batchSection = document.querySelector("[data-batch-section]");
    if (batchSection) {
      const offset = 120; // Account for header + sticky nav + some padding
      const elementPosition = batchSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  // Touch support for carousel
  const touchStartX = useRef(null);
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) handlePrevImage();
      else handleNextImage();
      touchStartX.current = null;
    }
  };
  const handleTouchEnd = () => {
    touchStartX.current = null;
  };

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
    console.log("location", location);

    const fetchData = async () => {
      try {
        setLoading(true);

        // Get trek ID from location state or fetch by slug
        let trekId = location?.state?.trekId;
        let trekData;

        if (trekId) {
          // Use ID from location state
          trekData = await getTrekById(trekId);
        } else {
          // Fetch by slug/name
          trekData = await getTrekBySlug(name);
          trekId = trekData._id;
        }

        setTrek(trekData);

        // Fetch active offers
        const offers = await getActiveOffers();
        setActiveOffers(offers);

        // Find applicable offer for this trek
        const offer = offers.find((o) =>
          o.applicableTreks.some((t) => t._id === trekId)
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
  }, [name, currentUser, location?.state?.trekId]);

  useEffect(() => {
    const fetchRegionName = async () => {
      if (trek?.regionName) {
        setRegionName(trek.regionName);
      } else if (
        trek?.region &&
        typeof trek.region === "object" &&
        trek.region.name
      ) {
        setRegionName(trek.region.name);
      } else {
        setRegionName("Unknown Region");
      }
    };

    if (trek) {
      fetchRegionName();
    }
  }, [trek]);

  // Header scrollbar effect
  useEffect(() => {
    const headerEl = headerScrollRef.current;

    // Call immediately after mount/DOM update
    setTimeout(updateHeaderScrollBar, 0);

    if (headerEl) {
      headerEl.addEventListener("scroll", updateHeaderScrollBar);
    }

    window.addEventListener("resize", updateHeaderScrollBar);

    return () => {
      if (headerEl)
        headerEl.removeEventListener("scroll", updateHeaderScrollBar);
      window.removeEventListener("resize", updateHeaderScrollBar);
    };
  }, [trek]);

  // Helper function to get price from different possible locations
  const getPrice = (trekData) => {
    const trek = trekData || {};
    if (trek.price !== undefined && trek.price !== null) {
      return Number(trek.price);
    } else if (trek.displayPrice !== undefined && trek.displayPrice !== null) {
      return Number(trek.displayPrice);
    } else if (
      trek.batches &&
      trek.batches.length > 0 &&
      trek.batches[0].price
    ) {
      return Number(trek.batches[0].price);
    }
    return 0;
  };

  // Helper function to get minimum price from batches
  const getMinimumPrice = (trekData) => {
    const trek = trekData || {};
    if (trek.batches && trek.batches.length > 0) {
      const prices = trek.batches
        .map((batch) => Number(batch.price))
        .filter((price) => !isNaN(price));
      return prices.length > 0 ? Math.min(...prices) : 0;
    }
    return getPrice(trekData);
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
    navigate(`/treks/${name}/book`, {
      state: {
        selectedBatchId: batch._id,
        trekName: trek.name,
        trekId: trek._id,
        batchDates: {
          startDate: batch.startDate,
          endDate: batch.endDate,
        },
      },
    });
  };

  const handleBookNowClick = () => {
    if (!currentUser) {
      toast.info("Please log in to book this trek");
      navigate("/login", { state: { from: `/treks/${name}/book` } });
      return;
    }

    navigate(`/treks/${name}/book`, {
      state: {
        trekId: trek._id,
        trekName: trek.name,
      },
    });
  };

  const handleBatchBookNowClick = (batch) => {
    if (!currentUser) {
      toast.info("Please log in to book this trek");
      navigate("/login", { state: { from: `/treks/${name}/book` } });
      return;
    }

    navigate(`/treks/${name}/book`, {
      state: {
        selectedBatchId: batch._id,
        trekName: trek.name,
        trekId: trek._id,
        batchDates: {
          startDate: batch.startDate,
          endDate: batch.endDate,
        },
      },
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

  // Close share menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        showShareMenu &&
        shareMenuRef.current &&
        !shareMenuRef.current.contains(event.target)
      ) {
        setShowShareMenu(false);
      }
    }
    if (showShareMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showShareMenu]);

  const handleShareClick = () => {
    setShowShareMenu((prev) => !prev);
  };

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        toast.success("Link copied to clipboard!");
        setShowShareMenu(false);
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
        toast.error("Failed to copy link");
      });
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: trek.name,
          text: `Check out this amazing trek: ${trek.name}`,
          url: window.location.href,
        })
        .then(() => setShowShareMenu(false))
        .catch((error) => {
          setShowShareMenu(false);
          if (error.name !== "AbortError") {
            toast.error("Error sharing: " + error.message);
          }
        });
    }
  };

  const handleDownloadItinerary = async () => {
    if (!trek) return;

    try {
      setDownloading(true);

      if (!trek.itineraryPdfUrl) {
        toast.error("Itinerary PDF is not available for this trek.");
        return;
      }

      // Open the PDF URL in a new tab
      window.open(trek.itineraryPdfUrl, "_blank");
      toast.success("Itinerary downloaded successfully!");
    } catch (error) {
      console.error("Error downloading itinerary:", error);
      toast.error("Failed to download itinerary. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenGallery = (idx) => {
    setGalleryIndex(idx);
    setGalleryOpen(true);
  };
  const handleCloseGallery = () => setGalleryOpen(false);
  const handlePrevImage = () =>
    setGalleryIndex((prev) => (prev === 0 ? trek.images.length - 1 : prev - 1));
  const handleNextImage = () =>
    setGalleryIndex((prev) => (prev === trek.images.length - 1 ? 0 : prev + 1));

  // Trap focus in modal
  useEffect(() => {
    if (galleryOpen && galleryModalRef.current) {
      galleryModalRef.current.focus();
    }
  }, [galleryOpen]);

  // Prevent background scroll when gallery is open
  useEffect(() => {
    if (!galleryOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [galleryOpen]);

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
            const spotsLeft = batch.availableSpots || (batch.maxParticipants - batch.currentParticipants);

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
                {selectedBatch.availableSpots || (selectedBatch.maxParticipants - selectedBatch.currentParticipants)}{" "}
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
              <span className="text-3xl font-bold text-emerald-600 sm:mr-3">
                {formatCurrency(discountedPrice)}
              </span>
              <span className="text-xl text-gray-500 line-through">
                {formatCurrency(displayPrice)}
              </span>
              <span className="bg-gradient-to-r from-amber-600 to-orange-400 text-white text-sm px-3 py-1 rounded-md flex items-center shadow-sm sm:ml-3 w-fit">
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
              <span className="text-3xl font-bold text-emerald-600">
                {formatCurrency(displayPrice)}
              </span>
              {trek.strikedPrice && trek.strikedPrice > displayPrice && (
                <span className="text-xl text-gray-500 line-through sm:ml-2">
                  {formatCurrency(trek.strikedPrice)}
                </span>
              )}
              <span className="text-gray-500 sm:ml-2">per person</span>
            </div>
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
        <div className="flex flex-wrap gap-3 relative">
          {/* Share Action */}
          <div className="relative">
            <button
              onClick={handleShareClick}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              <FaShare className="mr-2" />
              Share
            </button>
            {showShareMenu && (
              <div
                ref={shareMenuRef}
                className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
              >
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-emerald-50 rounded-t-lg"
                >
                  <FaLink className="mr-2" /> Copy Link
                </button>
                {navigator.share && (
                  <button
                    onClick={handleNativeShare}
                    className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-emerald-50 rounded-b-lg"
                  >
                    <FaShare className="mr-2" /> Share via Device
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Download Itinerary Action */}
          <button
            onClick={handleDownloadItinerary}
            disabled={downloading}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            {downloading ? (
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
            ) : (
              <FaDownload className="mr-2" />
            )}
            {downloading ? "Downloading..." : "Download Itinerary"}
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
                              to={`/regions/${createRegionSlug(trek.region)}`}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Explore All Treks in {regionName}
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // Gallery grid layout (responsive)
  const renderGallery = () => {
    if (!trek?.images || trek.images.length === 0) return null;
    const images = trek.images;
    const trekName = trek.name || "Trek"; // Default alt text for trek name

    // Desktop layout (similar to the provided image)
    const DesktopGallery = () => {
      if (images.length === 1) {
        return (
          <div
            className="w-full aspect-w-16 aspect-h-9 rounded-xl overflow-hidden shadow-lg cursor-pointer"
            onClick={() => handleOpenGallery(0)}
          >
            <img
              src={images[0]}
              alt={`${trekName} - Image 1`}
              className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
            />
          </div>
        );
      }

      const img1 = images[0];
      const img2 = images[1];
      const img3 = images[2];
      const img4 = images[3];
      const remainingImagesCount = images.length - 4;

      return (
        <div className="rounded-xl overflow-hidden shadow-lg">
          <div className="flex h-[400px] gap-1">
            {/* Left main image (taller) */}
            <div
              className="w-3/5 cursor-pointer bg-gray-100"
              onClick={() => handleOpenGallery(0)}
            >
              {img1 ? (
                <img
                  src={img1}
                  alt={`${trekName} - Image 1`}
                  className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Image not available
                </div>
              )}
            </div>
            {/* Right column with 3 images */}
            <div className="w-2/5 flex flex-col gap-1">
              {/* Top two smaller images */}
              <div className="flex-1 h-[50%] flex gap-1">
                <div
                  className="flex-1 cursor-pointer bg-gray-100"
                  onClick={() => img2 && handleOpenGallery(1)}
                >
                  {img2 ? (
                    <img
                      src={img2}
                      alt={`${trekName} - Image 2`}
                      className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"></div>
                  )}
                </div>
                <div
                  className="flex-1 cursor-pointer bg-gray-100"
                  onClick={() => img3 && handleOpenGallery(2)}
                >
                  {img3 ? (
                    <img
                      src={img3}
                      alt={`${trekName} - Image 3`}
                      className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"></div>
                  )}
                </div>
              </div>
              {/* Bottom larger image with overlay */}
              <div
                className="flex-1 relative cursor-pointer bg-gray-100"
                onClick={() => img4 && handleOpenGallery(3)}
              >
                {img4 ? (
                  <img
                    src={img4}
                    alt={`${trekName} - Image 4`}
                    className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400"></div>
                )}
                {images.length > 4 && (
                  <div
                    className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenGallery(4);
                    }}
                  >
                    <button className="text-white text-sm font-semibold bg-blue-600 px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition">
                      +{remainingImagesCount} Photos
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    };

    // Mobile layout (banner + thumbnails)
    const MobileGallery = () => {
      const thumbnails = images.slice(1, 5); // Show up to 4 thumbnails after the main image

      return (
        <div className="flex flex-col gap-2">
          {/* Banner image */}
          <div
            className="w-full aspect-w-16 aspect-h-9 rounded-xl overflow-hidden shadow-lg cursor-pointer bg-gray-100"
            onClick={() => images[0] && handleOpenGallery(0)}
          >
            {images[0] ? (
              <img
                src={images[0]}
                alt={`${trekName} - Image 1`}
                className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Image not available
              </div>
            )}
          </div>
          {/* Thumbnails row */}
          {thumbnails.length > 0 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
              {thumbnails.map((img, idx) => {
                const imageIndexInAllImages = idx + 1; // images[0] is banner, so thumbnails start at images[1]
                // The 4th thumbnail slot (idx === 3 for thumbnails array, which is images[4])
                // will show the overlay if there are more than 5 images total (i.e. images.length > 4 for 0-indexed array).
                if (images.length > 4 && imageIndexInAllImages === 4) {
                  return (
                    <div
                      key={imageIndexInAllImages}
                      className="relative w-20 h-20 rounded-lg overflow-hidden shadow cursor-pointer flex-shrink-0 bg-gray-100"
                      onClick={() => handleOpenGallery(imageIndexInAllImages)}
                    >
                      <img
                        src={img}
                        alt={`${trekName} - Image ${imageIndexInAllImages + 1}`}
                        className="object-cover w-full h-full"
                      />
                      <div
                        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenGallery(4);
                        }} // Open gallery from 5th image (index 4)
                      >
                        <button className="text-white text-xs font-semibold bg-blue-600 px-2 py-1 rounded-md shadow hover:bg-blue-700 transition">
                          +{images.length - 4}
                        </button>
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={imageIndexInAllImages}
                    className="w-20 h-20 rounded-lg overflow-hidden shadow cursor-pointer flex-shrink-0 bg-gray-100"
                    onClick={() => handleOpenGallery(imageIndexInAllImages)}
                  >
                    <img
                      src={img}
                      alt={`${trekName} - Image ${imageIndexInAllImages + 1}`}
                      className="object-cover w-full h-full"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="w-full">
        <div className="hidden md:block">
          <DesktopGallery />
        </div>
        <div className="md:hidden">
          <MobileGallery />
        </div>
      </div>
    );
  };

  // Gallery modal
  const renderGalleryModal = () => {
    if (!galleryOpen || !trek?.images) return null;

    const modalContent = (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 transition-opacity"
        tabIndex={-1}
        ref={galleryModalRef}
        onClick={handleCloseGallery}
      >
        <div
          className="relative max-w-4xl w-full mx-4 bg-transparent rounded-xl flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close button */}
          <button
            className="absolute top-0 right-0 -mr-12 text-white bg-black bg-opacity-50 rounded-full p-2 shadow hover:bg-opacity-75 z-10"
            onClick={handleCloseGallery}
            aria-label="Close gallery"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          {/* Carousel navigation */}
          <button
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-12 bg-black bg-opacity-50 rounded-full p-2 shadow hover:bg-opacity-75 z-10"
            onClick={handlePrevImage}
            aria-label="Previous image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-6 w-6 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-12 bg-black bg-opacity-50 rounded-full p-2 shadow hover:bg-opacity-75 z-10"
            onClick={handleNextImage}
            aria-label="Next image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-6 w-6 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          {/* Main image */}
          <img
            src={trek.images[galleryIndex]}
            alt={`Trek gallery ${galleryIndex + 1}`}
            className="max-h-[85vh] w-auto rounded-lg object-contain shadow-lg transition-all duration-300"
          />
          {/* Image counter */}
          <div className="mt-4 text-white text-sm">
            {galleryIndex + 1} / {trek.images.length}
          </div>
        </div>
      </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
  };

  // MobileTrekFooter component using React Portal
  const MobileTrekFooter = ({
    price,
    discountedPrice,
    onBookNow,
    isTrekDisabled,
  }) => {
    return ReactDOM.createPortal(
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-[9999] pointer-events-auto">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Starting from</span>
            <span className="text-lg font-bold text-emerald-600">
              {discountedPrice ? (
                <>
                  {discountedPrice}
                  <span className="text-sm text-gray-500 line-through ml-2">
                    {price}
                  </span>
                </>
              ) : (
                price
              )}
            </span>
          </div>
          <button
            onClick={onBookNow}
            disabled={isTrekDisabled}
            className={`px-6 py-3 rounded-lg font-medium shadow-md transition-colors ${
              isTrekDisabled
                ? "bg-gray-300 text-gray-400 cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800"
            }`}
          >
            {isTrekDisabled ? "Not Available" : "Book Now"}
          </button>
        </div>
      </div>,
      document.body
    );
  };

  // Footer Book Now button handler
  const handleFooterBookNowClick = () => {
    if (!trek || !trek.batches || trek.batches.length === 0) return;
    // Find the batch with the lowest price that is not full
    const availableBatches = trek.batches.filter(
      (batch) => batch.currentParticipants < batch.maxParticipants
    );
    if (availableBatches.length === 0) {
      toast.error("All batches are full.");
      return;
    }
    const lowestPriceBatch = availableBatches.reduce((minBatch, batch) =>
      Number(batch.price) < Number(minBatch.price) ? batch : minBatch
    );
    if (!currentUser) {
      toast.info("Please log in to book this trek");
      navigate("/login", { state: { from: `/treks/${name}/book` } });
      return;
    }
    // Proceed to booking page with the lowest price batch selected
    navigate(`/treks/${name}/book`, {
      state: {
        selectedBatchId: lowestPriceBatch._id,
        trekName: trek.name,
        trekId: trek._id,
        batchDates: {
          startDate: lowestPriceBatch.startDate,
          endDate: lowestPriceBatch.endDate,
        },
      },
    });
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
      <Modal
        isOpen={showLeadForm}
        onClose={handleCloseLeadForm}
        title="Get More Information"
        size="large"
      >
        <LeadCaptureForm
          trekId={trek?._id}
          trekName={trek?.name}
          onClose={handleCloseLeadForm}
        />
      </Modal>

      <div
        className={`bg-white ${
          !loading && !error && trek && trek.batches && trek.batches.length > 0
            ? "md:pb-0 pb-20"
            : ""
        }`}
      >
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

        {/* Trek gallery */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {renderGallery()}
          {renderGalleryModal()}
        </div>

        {/* Trek header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Trek Scroll bar */}
          <div className="sticky top-[64px] z-30 bg-white border-b border-gray-200 mb-4">
            <div className="relative">
              <nav
                className="flex space-x-6 overflow-x-auto py-2 px-2 scrollbar-hide"
                ref={headerScrollRef}
              >
                <a
                  href="#overview"
                  onClick={(e) => handleSmoothScroll(e, "overview")}
                  className="text-gray-600 hover:text-emerald-600 whitespace-nowrap text-sm font-medium transition-colors duration-200"
                >
                  Overview
                </a>
                <a
                  href="#itinerary"
                  onClick={(e) => handleSmoothScroll(e, "itinerary")}
                  className="text-gray-600 hover:text-emerald-600 whitespace-nowrap text-sm font-medium transition-colors duration-200"
                >
                  Trek Itinerary
                </a>
                <a
                  href="#inclusions"
                  onClick={(e) => handleSmoothScroll(e, "inclusions")}
                  className="text-gray-600 hover:text-emerald-600 whitespace-nowrap text-sm font-medium transition-colors duration-200"
                >
                  Inclusions & Exclusions
                </a>
                <a
                  href="#cancellationPolicy"
                  onClick={(e) => handleSmoothScroll(e, "cancellationPolicy")}
                  className="text-gray-600 hover:text-emerald-600 whitespace-nowrap text-sm font-medium transition-colors duration-200"
                >
                  Cancellation Policy
                </a>
                <a
                  href="#thingsToPack"
                  onClick={(e) => handleSmoothScroll(e, "thingsToPack")}
                  className="text-gray-600 hover:text-emerald-600 whitespace-nowrap text-sm font-medium transition-colors duration-200"
                >
                  Things To Pack
                </a>
                <a
                  href="#faqs"
                  onClick={(e) => handleSmoothScroll(e, "faqs")}
                  className="text-gray-600 hover:text-emerald-600 whitespace-nowrap text-sm font-medium transition-colors duration-200"
                >
                  FAQs
                </a>
              </nav>
              {/* Fake green scrollbar for header */}
              {headerScrollState.isScrollable && (
                <div
                  style={{
                    position: "absolute",
                    left: headerScrollState.thumbLeft,
                    bottom: 2,
                    height: 4,
                    width: headerScrollState.thumbWidth,
                    background: "#10b981",
                    borderRadius: 2,
                    transition: "left 0.1s",
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
          </div>

          <div className="lg:grid  lg:grid-cols-[4fr_1fr] lg:gap-8">
            {/* Trek image */}
            <div className="relative lg:col-span-1">
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

              <div className="lg:mt-0 lg:col-span-1">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex flex-col">
                    <div className="flex justify-between">
                      <h1 className="mt-8 text-2xl sm:text-3xl font-extrabold text-gray-900">
                        {trek.name}
                      </h1>
                    </div>

                    {/* Trek details */}
                    <div className="mt-4 space-y-4 lg:max-w-md">
                      {trek.location && (
                        <div className="flex items-start">
                          <FaMapMarkerAlt className="flex-shrink-0 h-5 w-5 text-emerald-600 mt-0.5" />
                          <p className="ml-3 text-base text-gray-700 break-words overflow-wrap-anywhere">
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
                          <p className="ml-3 text-base text-gray-700 break-words overflow-wrap-anywhere">
                            Max group size: {trek.maxGroupSize} people
                          </p>
                        </div>
                      )}

                      {trek.maxAltitude && (
                        <div className="flex items-start">
                          <FaMountain className="flex-shrink-0 h-5 w-5 text-emerald-600 mt-0.5" />
                          <p className="ml-3 text-base text-gray-700 break-words overflow-wrap-anywhere">
                            Max altitude: {trek.maxAltitude} meters
                          </p>
                        </div>
                      )}

                      {trek.distance && (
                        <div className="flex items-start">
                          <svg
                            className="flex-shrink-0 h-5 w-5 text-emerald-600 mt-0.5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <p className="ml-3 text-base text-gray-700 break-words overflow-wrap-anywhere">
                            Total distance: {trek.distance} km
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Additional Trek Details */}
                    <div className="mt-6 border-t border-gray-200 pt-6 lg:max-w-md">
                      <h3 className="text-lg font-medium text-gray-900">
                        Trek Details
                      </h3>

                      <div className="mt-4 flex flex-col gap-4">
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
                              <p className="text-sm text-gray-500 break-words overflow-wrap-anywhere">
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
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.586V6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                Best Time to Visit
                              </p>
                              <p className="text-sm text-gray-500 break-words overflow-wrap-anywhere">
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
                              <p className="text-sm text-gray-500 break-words overflow-wrap-anywhere">
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
                              <p className="text-sm text-gray-500 break-words overflow-wrap-anywhere">
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
                                  d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                Maximum Altitude
                              </p>
                              <p className="text-sm text-gray-500 break-words overflow-wrap-anywhere">
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
                                  d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                Difficulty Level
                              </p>
                              <p className="text-sm text-gray-500 break-words overflow-wrap-anywhere">
                                {trek.difficulty}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Trek batches/dates */}
                  {trek.batches && trek.batches.length > 0 && (
                    <div className="mt-8 lg:mt-0 lg:ml-8" data-batch-section>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                        Available Dates
                      </h2>
                      <BatchesTabView
                        batches={trek.batches}
                        onBatchSelect={handleBatchSelect}
                        isTrekDisabled={isTrekDisabled}
                        currentUser={currentUser}
                        navigate={navigate}
                        trekId={trek._id}
                      />
                    </div>
                  )}
                </div>

                {/* Trek Highlights */}
                {trek.highlights && trek.highlights.length > 0 && (
                  <div className="mt-6 lg:mt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Highlights
                    </h3>
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <ul className="space-y-3">
                        {trek.highlights.map((highlight, index) => (
                          <li key={index} className="flex items-start">
                            <svg
                              className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586V6h5a1 1 0 100-2h-5v4.586z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="ml-3 text-gray-700 break-words overflow-wrap-anywhere">
                              {highlight}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Price section */}
                {renderPriceSection()}

                {/* Quick Actions */}
                {renderQuickActions()}
              </div>

              {/* Trek description */}
              <div id="overview" className="mt-12 scroll-mt-20">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Overview</h2>
                <div className="mt-4 text-gray-500 leading-relaxed">
                  <p className="text-base sm:text-lg break-words overflow-wrap-anywhere hyphens-auto">{trek.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trek itinerary */}
          {trek.itinerary && trek.itinerary.length > 0 && (
            <div id="itinerary" className="mt-12 scroll-mt-20">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
                Trek Itinerary
              </h2>
              <TrekItinerary itinerary={trek.itinerary} />{" "}
            </div>
          )}

          {/* Trek inclusions & exclusions */}
          {(trek.includes?.length > 0 || trek.excludes?.length > 0) && (
            <div id="inclusions" className="mt-12 scroll-mt-20">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
                Inclusions & Exclusions
              </h2>
              <TrekInclusionsExclusions
                includes={trek.includes}
                excludes={trek.excludes}
              />
            </div>
          )}

          {/* Cancellation Policy */}
          <div id="cancellationPolicy">
            <CancellationPolicy />
          </div>

          {/* Things to Pack */}
          {trek.thingsToPack && trek.thingsToPack.length > 0 && (
            <div id="thingsToPack" className="mt-12 scroll-mt-20">
              <ThingsToPack items={trek.thingsToPack} />
            </div>
          )}

          {/* FAQs */}
          {trek.faqs && trek.faqs.length > 0 && (
            <div id="faqs" className="mt-12 scroll-mt-20">
              <TrekFAQs faqs={trek.faqs} />
            </div>
          )}
        </div>

        {/* Booking form modal */}
        <Modal
          isOpen={showBookingForm}
          onClose={handleCloseBookingForm}
          title="Book This Trek"
          size="large"
        >
          {trek.isCustom ? (
            <CustomTrekBookingForm
              trek={trek}
              onClose={handleCloseBookingForm}
              onSuccess={handleBookingSuccess}
            />
          ) : (
            <BookingForm
              trek={trek}
              batch={selectedBatch}
              onClose={handleCloseBookingForm}
              onSuccess={handleBookingSuccess}
            />
          )}
        </Modal>

        {/* Add the related treks section */}
        {!loading && !error && trek && renderRelatedTreks()}

        {/* Mobile Fixed Footer - now using React Portal */}
        {!loading &&
          !error &&
          trek &&
          trek.batches &&
          trek.batches.length > 0 && (
            <MobileTrekFooter
              price={formatCurrency(getMinimumPrice(trek))}
              discountedPrice={
                discountedPrice ? formatCurrency(discountedPrice) : null
              }
              onBookNow={handleFooterBookNowClick}
              isTrekDisabled={isTrekDisabled}
            />
          )}
      </div>
    </>
  );
}

export default TrekDetail;
