import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getTreks } from '../services/api';
import TrekCard from './TrekCard';
import LoadingSpinner from './LoadingSpinner';
import Pagination from './Pagination';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGlobe, FaCloudRain, FaSun, FaMountain, FaHiking, FaCalendarWeek } from 'react-icons/fa';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 } // Added spring for entry
  },
  // Updated exit animation for slide-and-fade
  exit: {
    opacity: 0,
    x: -30, // Add horizontal movement on exit
    transition: { duration: 0.3 } // Adjust duration if needed
  }
};

const categoryIcons = {
  'all-treks': <FaGlobe className="mr-2" />,
  'monsoon-treks': <FaCloudRain className="mr-2" />,
  'sunrise-treks': <FaSun className="mr-2" />,
  'himalayan-treks': <FaMountain className="mr-2" />,
  'backpacking-trips': <FaHiking className="mr-2" />,
  'long-weekend': <FaCalendarWeek className="mr-2" />
};

const categoryNames = {
  'all-treks': 'All Treks',
  'monsoon-treks': 'Monsoon Treks',
  'sunrise-treks': 'Sunrise Treks',
  'himalayan-treks': 'Himalayan Treks',
  'backpacking-trips': 'Backpacking Trips',
  'long-weekend': 'Long Weekend'
};

const categories = Object.keys(categoryNames);

function CategoryTrekSection() {
  const [allTreks, setAllTreks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all-treks'); // Start with 'all-treks'
  const [currentPage, setCurrentPage] = useState(1);

  // Items per page based on screen size
  const getItemsPerPage = () => {
    // For mobile: max 5 treks
    // For desktop: one row (3-4 treks depending on screen size)
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 768) { // mobile
        return 5;
      } else if (width < 1024) { // tablet
        return 3;
      } else if (width < 1280) { // small desktop
        return 3;
      } else { // large desktop
        return 4;
      }
    }
    return 4; // default
  };

  const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage());

  // Update items per page on window resize
  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(getItemsPerPage());
      setCurrentPage(1); // Reset to first page when screen size changes
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchAllTreks = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all enabled treks initially, maybe limit later if needed
        const data = await getTreks({ limit: 50 }); // Fetch a decent number for filtering
        setAllTreks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching treks for category section:', err);
        setError('Failed to load treks. Please try again later.');
        setAllTreks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllTreks();
  }, []);

  const filteredTreks = useMemo(() => {
    if (activeCategory === 'all-treks') {
      return allTreks; // Show all if 'all-treks' is selected
    }
    
    return allTreks.filter(trek => trek.category === activeCategory);
  }, [activeCategory, allTreks]);

  // Reset to first page when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTreks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTreks = filteredTreks.slice(startIndex, endIndex);

  const handleCategoryClick = (category) => {
    setActiveCategory(prev => prev === category ? 'all-treks' : category); // Toggle or set category
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of section when page changes
    const element = document.getElementById('category-trek-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="category-trek-section" className="py-12 md:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Explore Treks by Category
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Find your next adventure based on what you love.
          </p>
        </div>

        {/* Category Filter Buttons */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 md:gap-3 mb-8 md:mb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {categories.map(category => (
            <motion.button
              key={category}
              variants={itemVariants}
              onClick={() => handleCategoryClick(category)}
              className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ease-in-out shadow-sm hover:shadow-md ${
                activeCategory === category ? 'bg-emerald-600 text-white scale-105 shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {categoryIcons[category]} {categoryNames[category]}
            </motion.button>
          ))}
        </motion.div>

        {/* Trek Cards Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-10 px-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          <>
            <motion.div
              key={`${activeCategory}-${currentPage}`} // Re-trigger animation on category or page change
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <AnimatePresence mode="sync">
                {currentTreks.length > 0 ? (
                  currentTreks.map(trek => (
                    <motion.div
                      key={trek._id}
                      variants={itemVariants}
                      layout // Animate layout changes
                      initial="hidden" // Ensure initial state is set for entering items
                      animate="visible"
                      exit="exit"
                    >
                      <TrekCard trek={trek} />
                    </motion.div>
                  ))
                ) : (
                   <motion.div
                      key="no-results"
                      className="col-span-full text-center py-12"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                   >
                      <p className="text-gray-500 text-lg">No treks found for the selected category.</p>
                   </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 md:mt-12">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}

        {/* Optional: View All Button */}
        <div className="mt-12 text-center">
          <Link
            to="/treks"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
          >
            View All Treks
          </Link>
        </div>
      </div>
    </section>
  );
}

export default CategoryTrekSection; 