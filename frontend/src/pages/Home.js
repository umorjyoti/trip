import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTrekStats, getTreks, getActiveOffers } from "../services/api";
import TrekCard from "../components/TrekCard";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import LoadingSpinner from "../components/LoadingSpinner";
import HomeTrekSections from "../components/HomeTrekSections";
import WeekendGetawaySection from "../components/WeekendGetawaySection";
import HeroSection from "../components/HeroSection";
import CategoryTrekSection from "../components/CategoryTrekSection";
import FloatingEnquiryButton from "../components/FloatingEnquiryButton";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

function Home() {
  const [stats, setStats] = useState(null);
  const [featuredTreks, setFeaturedTreks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeOffers, setActiveOffers] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch stats and treks
        const [statsData, treksData, offersData] = await Promise.all([
          getTrekStats(),
          getTreks({ limit: 6, featured: true }),
          getActiveOffers(),
        ]);

        console.log("Featured treks data:", treksData);

        setStats(statsData);
        setFeaturedTreks(treksData);
        setActiveOffers(offersData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const data = await getTrekStats();
        setStats(data);
        setErrorStats(null);
      } catch (err) {
        console.error("Error fetching trek stats:", err);
        setErrorStats("Failed to load statistics.");
        setStats(null);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  // Prepare chart data
  const prepareSeasonData = () => {
    if (!stats || !stats.seasons || stats.seasons.length === 0) {
      // Provide default data if stats are empty
      return {
        labels: ["Spring", "Summer", "Autumn", "Winter"],
        datasets: [
          {
            data: [0, 0, 0, 0],
            backgroundColor: [
              "rgba(255, 99, 132, 0.6)",
              "rgba(255, 206, 86, 0.6)",
              "rgba(54, 162, 235, 0.6)",
              "rgba(75, 192, 192, 0.6)",
            ],
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: stats.seasons.map((item) => item._id || item.season),
      datasets: [
        {
          data: stats.seasons.map((item) => item.count),
          backgroundColor: [
            "rgba(255, 99, 132, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(54, 162, 235, 0.6)",
            "rgba(75, 192, 192, 0.6)",
            "rgba(153, 102, 255, 0.6)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const prepareDifficultyData = () => {
    if (!stats || !stats.difficulties || stats.difficulties.length === 0) {
      return {
        labels: ["Easy", "Moderate", "Difficult", "Very Difficult"],
        datasets: [
          {
            data: [0, 0, 0, 0],
            backgroundColor: [
              "rgba(75, 192, 192, 0.6)",
              "rgba(54, 162, 235, 0.6)",
              "rgba(255, 159, 64, 0.6)",
              "rgba(255, 99, 132, 0.6)",
            ],
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: stats.difficulties.map((item) => item._id || item.difficulty),
      datasets: [
        {
          data: stats.difficulties.map((item) => item.count),
          backgroundColor: [
            "rgba(75, 192, 192, 0.6)",
            "rgba(54, 162, 235, 0.6)",
            "rgba(255, 159, 64, 0.6)",
            "rgba(255, 99, 132, 0.6)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const renderOfferBanner = () => {
    if (!activeOffers || activeOffers.length === 0) return null;

    return (
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-400 py-4 px-4 mb-8 shadow-md relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute -left-8 -top-8 w-24 h-24 rounded-full bg-white opacity-5"></div>
          <div className="absolute right-10 bottom-5 w-16 h-16 rounded-full bg-white opacity-5"></div>
          <div className="absolute right-32 top-3 w-8 h-8 rounded-full bg-white opacity-5"></div>
        </div>

        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between relative z-10">
          <div className="flex items-center mb-4 sm:mb-0">
            <div className="hidden sm:block mr-4 bg-white bg-opacity-10 p-3 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-bold text-xl sm:text-2xl text-white">
                Limited Time Offers
              </h3>
              <p className="text-white text-opacity-90 text-sm sm:text-base mt-1">
                Save up to {getMaxDiscountPercentage()}% on selected treks.
                Offers end soon.
              </p>
            </div>
          </div>
          <Link
            to="/treks"
            className="inline-flex items-center px-6 py-3 border border-white border-opacity-20 rounded-md text-white font-medium bg-white bg-opacity-10 hover:bg-opacity-15 transition-all shadow-sm"
          >
            View Offers
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 ml-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </div>
    );
  };

  // Helper function to get the maximum discount percentage from all active offers
  const getMaxDiscountPercentage = () => {
    if (!activeOffers || activeOffers.length === 0) return 0;

    let maxPercentage = 0;

    activeOffers.forEach((offer) => {
      if (offer.discountType === "percentage") {
        maxPercentage = Math.max(maxPercentage, offer.discountValue);
      } else if (
        offer.discountType === "fixed" &&
        offer.applicableTreks &&
        offer.applicableTreks.length > 0
      ) {
        // For fixed discounts, calculate the percentage based on the trek price
        offer.applicableTreks.forEach((trek) => {
          if (trek.price) {
            const percentage = (offer.discountValue / trek.price) * 100;
            maxPercentage = Math.max(maxPercentage, percentage);
          }
        });
      }
    });

    return Math.round(maxPercentage);
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
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
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
    <div className="bg-gray-100 min-h-screen">
      <HeroSection />

      {/* Render the new Category Trek Section */}
      <CategoryTrekSection />

      {/* Render the Weekend Getaway Section */}
      <WeekendGetawaySection offers={activeOffers} />

      {/* Featured Treks Section (example) */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Featured Treks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredTreks.map(trek => (
              <TrekCard key={trek._id} trek={trek} offers={activeOffers} />
            ))}
          </div>
        </div>
      </section>

      {/* Render other existing sections like HomeTrekSections if desired */}
      <HomeTrekSections />

      <FloatingEnquiryButton />

      {/* Statistics Section (Example) */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
            Our Trekking Impact
          </h2>
          {loadingStats ? (
            <div className="flex justify-center"><LoadingSpinner /></div>
          ) : errorStats ? (
            <p className="text-center text-red-600">{errorStats}</p>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-6 bg-gray-50 rounded-lg shadow">
                <p className="text-5xl font-bold text-emerald-600">{stats.totalTreks || 0}</p>
                <p className="mt-2 text-lg font-medium text-gray-700">Total Treks Offered</p>
              </div>
              {/* Add more stats display here if needed */}
               <div className="p-6 bg-gray-50 rounded-lg shadow">
                 <p className="text-5xl font-bold text-emerald-600">{stats.regions?.length || 0}</p>
                 <p className="mt-2 text-lg font-medium text-gray-700">Regions Explored</p>
               </div>
               <div className="p-6 bg-gray-50 rounded-lg shadow">
                 <p className="text-5xl font-bold text-emerald-600">{stats.difficulties?.length || 0}</p>
                 <p className="mt-2 text-lg font-medium text-gray-700">Difficulty Levels</p>
               </div>
            </div>
          ) : (
             <p className="text-center text-gray-500">Statistics not available.</p>
          )}
        </div>
      </section>

      {/* Add other sections like Testimonials, Blog Highlights, etc. */}

    </div>
  );
}

export default Home;
