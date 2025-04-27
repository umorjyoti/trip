import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import WeekendGetawayCard from "../components/WeekendGetawayCard";
import { FaFilter, FaSearch, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { weekendGetawaysData, sampleCategories } from '../data/weekendGetawaysData';

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
  // Use hardcoded data directly
  const [allGetaways] = useState(weekendGetawaysData);
  const [filteredGetaways, setFilteredGetaways] = useState(allGetaways);

  const [showFilters, setShowFilters] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState("");

  // Filter logic based on category and search query
  useMemo(() => {
    let result = allGetaways;

    // Filter by active category
    if (activeCategory !== 'all') {
      // Check against category or tags for broader filtering
      result = result.filter(getaway =>
        getaway.category === activeCategory ||
        (getaway.tags && getaway.tags.includes(activeCategory))
      );
    }

    // Filter by search query (name, region, description)
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      result = result.filter(getaway =>
        getaway.name.toLowerCase().includes(lowerCaseQuery) ||
        getaway.region.toLowerCase().includes(lowerCaseQuery) ||
        getaway.description.toLowerCase().includes(lowerCaseQuery) ||
        (getaway.tags && getaway.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery)))
      );
    }

    setFilteredGetaways(result);
  }, [activeCategory, searchQuery, allGetaways]);

  const clearFilters = () => {
    setActiveCategory("all");
    setSearchQuery("");
    // Reset other filters if they were added back
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200">
      {/* Hero Section with Enhanced Animation */}
      <div className="relative h-[65vh] overflow-hidden group">
         {/* Parallax Background Image */}
        <motion.div
          className="absolute inset-0 bg-fixed bg-center bg-cover"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1533240332313-0db49b459ad6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80)' }}
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
            Weekend Escapes
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-xl md:text-2xl max-w-2xl text-shadow" // Added text shadow
          >
            Discover curated short trips designed for maximum refreshment.
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
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex overflow-x-auto gap-3 pb-4 mb-8 hide-scrollbar" // Added mb-8
        >
          {/* Add a check to ensure sampleCategories is an array before mapping */}
          {Array.isArray(sampleCategories) && sampleCategories.map((category) => (
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
              filteredGetaways.map((getaway) => (
                <motion.div
                  key={getaway._id}
                  layout // Animate position changes
                  variants={itemVariants} // Use item variants for entrance animation
                  exit={{ opacity: 0, scale: 0.8 }} // Exit animation
                  transition={{ duration: 0.3 }}
                >
                  {/* Pass the getaway object to the card */}
                  <WeekendGetawayCard getaway={getaway} />
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-16 text-gray-500"
              >
                <p className="text-xl mb-2">No getaways match your current filters.</p>
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
