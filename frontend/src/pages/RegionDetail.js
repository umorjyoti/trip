import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  getRegionById,
  getRegionBySlug,
  getTreksByRegion,
  getTreksByExactRegion,
  createRegionSlug,
} from "../services/api";
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaImages,
  FaYoutube,
} from "react-icons/fa";
import LoadingSpinner from "../components/LoadingSpinner";
import TrekCard from "../components/TrekCard";
import VideoCarousel from "../components/VideoCarousel";
import TrekSection from "../components/TrekSection";

function RegionDetail() {
  const location = useLocation();
  const params = useParams();
  const slug = params?.slug;
  const { id } = location?.state || {};
  const [region, setRegion] = useState(null);
  const [treks, setTreks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVideos, setShowVideos] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const galleryModalRef = useRef(null);

  // Touch support for carousel
  const touchStartX = useRef(null);

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

  // Ensure body scrolling is restored when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Gallery functions
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

  const handleOpenGallery = (idx) => {
    setGalleryIndex(idx);
    setGalleryOpen(true);
  };
  const handleCloseGallery = () => setGalleryOpen(false);
  const handlePrevImage = () =>
    setGalleryIndex((prev) => (prev === 0 ? (region?.images?.length || 1) - 1 : prev - 1));
  const handleNextImage = () =>
    setGalleryIndex((prev) => (prev === (region?.images?.length || 1) - 1 ? 0 : prev + 1));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Check if we have either an ID or a slug
        if (!id && !slug) {
          setError("No region identifier provided");
          setLoading(false);
          return;
        }
        
        // Get region ID from location state or fetch by slug
        let regionId = id;
        let regionData;

        if (regionId) {
          // Use ID from location state
          console.log("Fetching data for region ID:", regionId);
          regionData = await getRegionById(regionId);
        } else if (slug && slug.trim()) {
          // Fetch by slug
          console.log("Fetching data for region slug:", slug);
          regionData = await getRegionBySlug(slug);
          regionId = regionData._id;
        } else {
          setError("Invalid region identifier");
          setLoading(false);
          return;
        }
        
        console.log("Region data:", regionData);

        // Check if region data was found
        if (!regionData) {
          setError("Region not found");
          setLoading(false);
          return;
        }

        // Ensure all arrays exist to prevent "length of undefined" errors
        regionData.images = regionData.images || [];
        regionData.videos = regionData.videos || [];
        regionData.relatedRegions = regionData.relatedRegions || [];
        setRegion(regionData);

        // Now fetch treks for this region using the exact match endpoint
        try {
          const exactTreks = await getTreksByExactRegion(regionId);
          console.log("Exact treks for region:", exactTreks);

          if (exactTreks.length > 0) {
            setTreks(exactTreks);
          } else {
            // Fallback to the original method if no exact matches
            console.log("No exact matches, trying alternative method");
            const treksData = await getTreksByRegion(regionId);

            // Filter treks to ensure they belong to this region
            const filteredTreks = treksData.filter((trek) => {
              // Check if trek.region is an object with _id or a string
              const trekRegionId =
                typeof trek.region === "object"
                  ? trek.region._id
                  : trek.region;

              // Compare as strings to avoid type mismatches
              return String(trekRegionId) === String(regionId);
            });

            console.log(
              `Filtered ${filteredTreks.length} treks for region ${regionId}`
            );
            setTreks(filteredTreks);
          }
        } catch (trekError) {
          console.error("Error fetching treks for region:", trekError);
          setTreks([]);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching region data:", err);
        setError("Failed to load region details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !region) {
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
              <p className="text-sm text-red-700">
                {error || "Region not found"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Safely get the number of additional images
  const additionalImagesCount = Math.max(0, (region.images?.length || 0) - 4);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative h-96 md:h-[500px]">
        <img
          src={
            region.coverImage ||
            (region.images && region.images.length > 0
              ? region.images[0]
              : "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5")
          }
          alt={region.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black opacity-60"></div>
        <div className="absolute bottom-0 left-0 p-8">
          <h1 className="text-4xl font-bold text-white">{region.name}</h1>
          <div className="flex items-center mt-2 text-white">
            <FaMapMarkerAlt className="mr-2" />
            <span>{region.location || "Location not specified"}</span>
          </div>
        </div>
      </div>

      {/* Trek Section */}
      <TrekSection region={region} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="prose prose-lg max-w-none">
              <h2>About {region.name}</h2>
              <p>{region.description}</p>
            </div>

            {/* Image Gallery Preview */}
            {region.images && region.images.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Gallery</h2>
                  <button
                    onClick={() => handleOpenGallery(0)}
                    className="text-emerald-600 hover:text-emerald-700 flex items-center"
                  >
                    <FaImages className="mr-2" />
                    View All
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {region.images.slice(0, 4).map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-gray-100"
                      onClick={() => handleOpenGallery(index)}
                    >
                      <img
                        src={image}
                        alt={`${region.name} ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://via.placeholder.com/300x200?text=Image+Not+Found";
                        }}
                      />
                      {index === 3 && additionalImagesCount > 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                          <span className="text-white text-xl font-bold">
                            +{additionalImagesCount} more
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Treks in this Region */}
            {treks && treks.length > 0 ? (
              <div className="mt-12">
                <h2 className="text-2xl font-bold mb-6">
                  Treks in {region.name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {treks.map((trek) => (
                    <TrekCard key={trek._id} trek={trek} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-12 p-6 bg-gray-50 rounded-lg">
                <h2 className="text-2xl font-bold mb-2">
                  Treks in {region.name}
                </h2>
                <p className="text-gray-500">
                  No treks available for this region at the moment.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Region Information</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-gray-500 text-sm">Best Season</h4>
                  <p className="font-medium">
                    {region.bestSeason || "Not specified"}
                  </p>
                </div>

                <div>
                  <h4 className="text-gray-500 text-sm">
                    Average Trek Duration
                  </h4>
                  <p className="font-medium">
                    {region.avgTrekDuration || "N/A"} days
                  </p>
                </div>

                {/* Add more region details as needed */}
              </div>
            </div>

            {/* Related Regions */}
            {region.relatedRegions && region.relatedRegions.length > 0 && (
              <div className="mt-8 bg-gray-50 p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-4">Nearby Regions</h3>
                <div className="space-y-4">
                  {region.relatedRegions.map((relatedRegion) => (
                    <Link
                      key={relatedRegion._id}
                      to={`/regions/${createRegionSlug(relatedRegion.name)}`}
                      state={{ id: relatedRegion?._id }}
                      className="flex items-center p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {relatedRegion.coverImage && (
                        <img
                          src={relatedRegion.coverImage}
                          alt={relatedRegion.name}
                          className="w-12 h-12 rounded-md object-cover mr-3"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://via.placeholder.com/48?text=Region";
                          }}
                        />
                      )}
                      <span className="font-medium">{relatedRegion.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Videos Section */}
      {region.videos && region.videos.length > 0 && (
        <VideoCarousel videos={region.videos} title="Memories For Life" />
      )}

      {/* Gallery modal */}
      {galleryOpen && ReactDOM.createPortal(
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
              src={region.images[galleryIndex]}
              alt={`Region gallery ${galleryIndex + 1}`}
              className="max-h-[85vh] w-auto rounded-lg object-contain shadow-lg transition-all duration-300"
            />
            {/* Image counter */}
            <div className="mt-4 text-white text-sm">
              {galleryIndex + 1} / {region.images.length}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default RegionDetail;
