import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, createTrekSlug } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaMapMarkerAlt, 
  FaClock, 
  FaMountain, 
  FaArrowRight, 
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';

// --- Add Helper Functions Here ---
// Helper function for safe formatting
const safeFormatCurrency = (amount) => {
  const number = Number(amount);
  if (isNaN(number) || amount === null || amount === undefined) {
    // Handle cases like 0 or contact for pricing appropriately
    if (number === 0) return 'Contact Us'; // Or return formatCurrency(0) if you want to show ₹0.00
    return 'N/A';
  }
  // Use the imported formatCurrency function
  return formatCurrency(number);
};

// Helper function for date formatting (adjust as needed)
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    // Example: 'Aug 15'
    return new Date(dateString).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return 'Invalid Date';
  }
};
// --- End Helper Functions ---

function TrekScrollSection({ title, treks = [], viewAllLink }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [treksWithDetails, setTreksWithDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!treks || treks.length === 0) {
        setTreksWithDetails([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const updatedTreks = await Promise.all(
        treks.map(async (trek) => {
          // Get region name from trek data
          let regionName = 'N/A';
          if (trek.regionName) {
            regionName = trek.regionName;
          } else if (trek.region && typeof trek.region === 'object' && trek.region.name) {
            regionName = trek.region.name;
          }
          const earliestBatch = trek.batches
            ?.filter(batch => new Date(batch.startDate) >= new Date())
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];

          return {
            ...trek,
            regionName,
            displayPrice: trek?.displayPrice,
            earliestBatch,
          };
        })
      );
      setTreksWithDetails(updatedTreks);
      setLoading(false);
    };

    fetchDetails();
  }, [treks]);

  const checkScrollability = () => {
    const el = scrollRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollWidth > el.clientWidth && el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    } else {
       setCanScrollLeft(false);
       setCanScrollRight(false);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    checkScrollability();
    if (el) {
      el.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
    }
    return () => {
      if (el) {
        el.removeEventListener('scroll', checkScrollability);
      }
      window.removeEventListener('resize', checkScrollability);
    };
  }, [treksWithDetails, loading]);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.8;
      el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  if (loading) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">{title}</h2>
        <div className="h-72 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!treksWithDetails || treksWithDetails.length === 0) {
    return null;
  }

  console.log("treksWithDetails", treksWithDetails)

  return (
    <div className="mb-12 relative group">
      <div className="flex justify-between items-center mb-4 px-4 sm:px-0">
        <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
      </div>

      <div className="relative">
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-md text-gray-600 hover:text-gray-900 transition-all duration-200 -ml-4 hidden md:flex items-center justify-center"
              aria-label="Scroll left"
            >
              <FaChevronLeft className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>

        <motion.div
          ref={scrollRef}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide px-4 sm:px-0 -mx-4 sm:mx-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {treksWithDetails.map((trek) => (
            <motion.div
              key={trek._id}
              variants={cardVariants}
              className="flex-shrink-0 w-64 sm:w-72 md:w-80"
            >
              <motion.div
                 whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                 className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ease-in-out h-full flex flex-col"
              >
                <Link 
                  to={`/treks/${createTrekSlug(trek.name)}`} 
                  state={{ trekId: trek._id, trekName: trek.name }}
                  className="group flex flex-col h-full"
                >
                  <div className="relative h-32 sm:h-40 w-full overflow-hidden">
                    {trek.images && trek.images.length > 0 ? (
                      <img src={trek.images[0]} alt={trek.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy"/>
                    ) : (
                       <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400"><FaMountain size={30} /></div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-grow">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors mb-1 truncate">{trek.name}</h4>
                    <div className="flex items-center text-xs text-gray-500 mb-2 truncate">
                      <FaMapMarkerAlt className="mr-1 flex-shrink-0 text-emerald-500" />
                      <span className="truncate">{trek.regionName}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-2 text-xs text-gray-600">
                       <div className="flex items-center"><FaClock className="mr-1 text-emerald-500" /><span>{trek.duration} days</span></div>
                       {trek.earliestBatch && <div className="flex items-center"><FaCalendarAlt className="mr-1 text-emerald-500" /><span>Next: {formatDate(trek.earliestBatch.startDate)}</span></div>}
                    </div>
                    <div className="flex-grow"></div>
                    <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                      <div>
                        <span className="text-md font-bold text-emerald-600">{safeFormatCurrency(trek.displayPrice)}</span>
                        {trek.strikedPrice && trek.strikedPrice > trek.displayPrice && (
                          <span className="ml-2 text-sm text-gray-400 line-through">
                            {safeFormatCurrency(trek.strikedPrice)}
                          </span>
                        )}
                      </div>
                      <span className="text-emerald-500 group-hover:text-emerald-700 transition-transform duration-300 group-hover:translate-x-1"><FaArrowRight size={12}/></span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </motion.div>
          ))}
          <div className="flex-shrink-0 w-1"></div>
        </motion.div>

        <AnimatePresence>
          {canScrollRight && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-md text-gray-600 hover:text-gray-900 transition-all duration-200 -mr-4 hidden md:flex items-center justify-center"
              aria-label="Scroll right"
            >
              <FaChevronRight className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default TrekScrollSection; 