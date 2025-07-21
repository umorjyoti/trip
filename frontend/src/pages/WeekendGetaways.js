import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import WeekendGetawayCard from "../components/WeekendGetawayCard";
import { getWeekendGetaways, getWeekendGetawayPageSettings } from "../services/api";
import { FaFilter, FaSearch, FaTimes, FaUmbrellaBeach } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

function WeekendGetaways() {
  const [weekendGetaways, setWeekendGetaways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredGetaways, setFilteredGetaways] = useState([]);

  const [showFilters, setShowFilters] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [heroImage, setHeroImage] = useState('');
  const [heroTitle, setHeroTitle] = useState('Weekend Escapes');
  const [heroSubtitle, setHeroSubtitle] = useState('Discover curated short trips designed for maximum refreshment');

  // Fetch weekend getaways from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch weekend getaways
        const response = await getWeekendGetaways();
        if (response && response.weekendGetaways) {
          setWeekendGetaways(response.weekendGetaways);
        } else {
          setWeekendGetaways([]);
        }
        
        // Fetch weekend getaway page settings
        try {
          const settingsData = await getWeekendGetawayPageSettings();
          if (settingsData.weekendGetawayPage?.heroImage) {
            setHeroImage(settingsData.weekendGetawayPage.heroImage);
          }
          if (settingsData.weekendGetawayPage?.heroTitle) {
            setHeroTitle(settingsData.weekendGetawayPage.heroTitle);
          }
          if (settingsData.weekendGetawayPage?.heroSubtitle) {
            setHeroSubtitle(settingsData.weekendGetawayPage.heroSubtitle);
          }
        } catch (error) {
          console.error('Error fetching weekend getaway page settings:', error);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching weekend getaways:', err);
        setError('Failed to load weekend getaways');
        setWeekendGetaways([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter logic based on category and search query
  useMemo(() => {
    let result = weekendGetaways;

    // Filter by active category
    if (activeCategory !== 'all') {
      result = result.filter(trek =>
        trek.category === activeCategory ||
        (trek.tags && trek.tags.includes(activeCategory))
      );
    }

    // Filter by search query (name, region, description)
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      result = result.filter(trek =>
        trek.name.toLowerCase().includes(lowerCaseQuery) ||
        (trek.region && trek.region.name && trek.region.name.toLowerCase().includes(lowerCaseQuery)) ||
        (trek.description && trek.description.toLowerCase().includes(lowerCaseQuery)) ||
        (trek.tags && trek.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery)))
      );
    }

    setFilteredGetaways(result);
  }, [activeCategory, searchQuery, weekendGetaways]);

  const clearFilters = () => {
    setActiveCategory("all");
    setSearchQuery("");
  };

  // Helper function to get category icons
  const getCategoryIcon = (category) => {
    const iconMap = {
      'all-treks': '🌍',
      'monsoon-treks': '🌧️',
      'sunrise-treks': '🌅',
      'himalayan-treks': '🏔️',
      'backpacking-trips': '🎒',
      'long-weekend': '📅'
    };
    return iconMap[category] || '🏕️';
  };

  // Get unique categories from the data
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(weekendGetaways.map(trek => trek.category).filter(Boolean))];
    return uniqueCategories.map(category => ({
      id: category,
      name: category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' '),
      icon: getCategoryIcon(category)
    }));
  }, [weekendGetaways]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200">
      {/* Hero Section with Enhanced Animation */}
      <div className="relative h-[65vh] overflow-hidden group">
         {/* Parallax Background Image */}
        <motion.div
          className="absolute inset-0 bg-fixed bg-center bg-cover"
          style={{ 
            backgroundImage: heroImage 
              ? `url(${heroImage})` 
              : 'url(https://images.unsplash.com/photo-1533240332313-0db49b459ad6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80)'
          }}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "linear", repeat: Infinity, repeatType: "mirror" }} // Slow continuous zoom
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

        {/* Hero Content */}
        <div className="relative h-full flex flex-col items-center justify-center text-white text-center px-4 z-10">
          <motion.h1
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-bold mb-4 tracking-tight text-shadow-lg" // Added text shadow
          >
            {heroTitle}
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-xl md:text-2xl max-w-2xl text-shadow" // Added text shadow
          >
            {heroSubtitle}
          </motion.p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* Search and Filter Bar */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-8 flex flex-col md:flex-row items-center gap-4 sticky top-4 z-30 backdrop-blur-sm bg-white/80"
        >
          <div className="relative flex-grow w-full md:w-auto">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, place, or tag..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Add other filter dropdowns here if needed */}
          <button
            onClick={clearFilters}
            className="flex items-center text-gray-600 hover:text-emerald-600 transition-colors text-sm"
          >
            <FaTimes className="mr-1" /> Clear All
          </button>
        </motion.div>

        {/* Category Filter Buttons */}
        {categories.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex overflow-x-auto gap-3 pb-4 mb-8 hide-scrollbar" // Added mb-8
          >
            {/* All category button */}
            <motion.button
              onClick={() => setActiveCategory('all')}
              className={`flex items-center px-5 py-2 rounded-full transition-all duration-300 ease-out transform whitespace-nowrap shadow-sm border
                ${activeCategory === 'all'
                  ? 'bg-emerald-600 text-white border-emerald-600 scale-105 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-emerald-50 hover:border-emerald-300 hover:scale-105'}`}
              whileTap={{ scale: 0.95 }}
            >
              <FaUmbrellaBeach className="mr-2 text-lg" />
              <span className="font-medium text-sm">All</span>
            </motion.button>
            
            {/* Dynamic category buttons */}
            {categories.map((category) => (
              <motion.button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center px-5 py-2 rounded-full transition-all duration-300 ease-out transform whitespace-nowrap shadow-sm border
                  ${activeCategory === category.id
                    ? 'bg-emerald-600 text-white border-emerald-600 scale-105 shadow-lg'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-emerald-50 hover:border-emerald-300 hover:scale-105'}`}
                whileTap={{ scale: 0.95 }}
              >
                <span className="mr-2 text-lg">{category.icon}</span>
                <span className="font-medium text-sm">{category.name}</span>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Getaways Grid */}
        <motion.div
          layout // Animate layout changes
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence>
            {filteredGetaways.length > 0 ? (
              filteredGetaways.map((trek) => (
                <motion.div
                  key={trek._id}
                  layout // Animate position changes
                  variants={itemVariants} // Use item variants for entrance animation
                  exit={{ opacity: 0, scale: 0.8 }} // Exit animation
                  transition={{ duration: 0.3 }}
                >
                  <WeekendGetawayCard trek={trek} />
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-16 text-gray-500"
              >
                <p className="text-xl mb-2">No weekend getaways match your current filters.</p>
                <p>Try adjusting your search or category selection.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Removed Pagination */}
      </div>
    </div>
  );
}

export default WeekendGetaways;
