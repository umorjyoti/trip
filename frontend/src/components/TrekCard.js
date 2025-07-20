import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, createTrekSlug } from '../services/api';
import { motion } from 'framer-motion';
import { 
  FaMapMarkerAlt, 
  FaClock, 
  FaMountain, 
  FaArrowRight, 
  FaTag, 
  FaCalendarAlt,
  FaWater,
  FaUmbrellaBeach,
  FaHiking,
  FaGlassCheers,
  FaTheaterMasks,
  FaMusic,
  FaGlobe,
  FaCloudRain,
  FaSun,
  FaCalendarWeek
} from 'react-icons/fa';

// Helper function for safe formatting
const safeFormatCurrency = (amount) => {
  const number = Number(amount);
  if (isNaN(number)) {
    return 'N/A'; // Or some other placeholder
  }
  return formatCurrency(number); // Use your existing formatCurrency
};

// Helper function for date formatting (adjust as needed)
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch (e) {
    return 'Invalid Date';
  }
};

function TrekCard({ trek, offers = [] }) {
  // Get region name from trek data
  const getRegionName = () => {
    if (trek.regionName) {
      return trek.regionName;
    }
    if (trek.region && typeof trek.region === 'object' && trek.region.name) {
      return trek.region.name;
    }
    return 'N/A';
  };

  // Calculate Price and Offer
  const getPrice = () => trek.displayPrice || (trek.batches && trek.batches.length > 0 ? trek.batches[0].price : 0);
  const basePrice = getPrice();

  const applicableOffer = offers.find(offer =>
    offer.isActive &&
    (!offer.applicableTreks || offer.applicableTreks.length === 0 || offer.applicableTreks.includes(trek._id)) &&
    new Date(offer.startDate) <= new Date() &&
    new Date(offer.endDate) >= new Date()
  );

  let displayPrice = basePrice;
  if (applicableOffer) {
    if (applicableOffer.discountType === 'percentage') {
      displayPrice = basePrice * (1 - applicableOffer.discountValue / 100);
    } else if (applicableOffer.discountType === 'fixed') {
      displayPrice = Math.max(0, basePrice - applicableOffer.discountValue);
    }
  }

  // Find earliest upcoming batch
  const earliestBatch = trek.batches
    ?.filter(batch => new Date(batch.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];

  // Card animation variant
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  // Category icon mapping
  const categoryIcons = {
    'all-treks': <FaGlobe className="mr-1" />,
    'monsoon-treks': <FaCloudRain className="mr-1" />,
    'sunrise-treks': <FaSun className="mr-1" />,
    'himalayan-treks': <FaMountain className="mr-1" />,
    'backpacking-trips': <FaHiking className="mr-1" />,
    'long-weekend': <FaCalendarWeek className="mr-1" />
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
      className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ease-in-out flex flex-col"
    >
      <Link 
        to={`/treks/${createTrekSlug(trek.name)}`} 
        state={{ trekId: trek._id, trekName: trek.name }}
        className="group flex flex-col h-full"
      >
        <div className="relative h-48 w-full overflow-hidden">
          {trek.images && trek.images.length > 0 ? (
            <img
              src={trek.images[0]}
              alt={trek.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
              <FaMountain size={40} />
            </div>
          )}
          
          {/* Add category badge */}
          {trek.category && (
            <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm text-gray-800 text-xs font-semibold px-2 py-1 rounded-full flex items-center shadow-sm">
              {categoryIcons[trek.category] || null} {trek.category.charAt(0).toUpperCase() + trek.category.slice(1)}
            </div>
          )}
          
          {applicableOffer && (
             <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center shadow-md">
               <FaTag className="mr-1" /> {applicableOffer.discountType === 'percentage' ? `${applicableOffer.discountValue}% OFF` : `${safeFormatCurrency(applicableOffer.discountValue)} OFF`}
             </div>
           )}
        </div>

        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors mb-2 truncate">
            {trek.name || 'Unnamed Trek'}
          </h3>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3 text-sm text-gray-600">
            <div className="flex items-center truncate">
              <FaMapMarkerAlt className="text-emerald-600 mr-2 flex-shrink-0" />
              <span className="truncate">{getRegionName()}</span>
            </div>
            <div className="flex items-center">
              <FaClock className="text-emerald-600 mr-2 flex-shrink-0" />
              <span>{trek.duration || '?'} {trek.duration === 1 ? 'day' : 'days'}</span>
            </div>
            <div className="flex items-center">
              <FaMountain className="text-emerald-600 mr-2 flex-shrink-0" />
              <span>{trek.difficulty || 'N/A'}</span>
            </div>
             {earliestBatch && (
               <div className="flex items-center text-xs text-gray-500">
                 <FaCalendarAlt className="mr-1 flex-shrink-0" />
                 <span>Next: {formatDate(earliestBatch.startDate)}</span>
               </div>
             )}
          </div>

          <div className="flex-grow"></div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
            <div className="text-emerald-600 font-bold text-lg">
              {safeFormatCurrency(displayPrice)}
              {trek.strikedPrice && trek.strikedPrice > displayPrice && (
                <span className="ml-2 text-sm text-gray-400 line-through">
                  {safeFormatCurrency(trek.strikedPrice)}
                </span>
              )}
              {applicableOffer && basePrice > 0 && displayPrice !== basePrice && (
                <span className="ml-2 text-sm text-gray-400 line-through">
                  {safeFormatCurrency(basePrice)}
                </span>
              )}
              {basePrice <= 0 && <span className="text-sm font-normal text-gray-500">Contact Us</span>}
            </div>
            <span className="text-emerald-500 group-hover:text-emerald-700 transition-transform duration-300 group-hover:translate-x-1">
               <FaArrowRight />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default TrekCard; 