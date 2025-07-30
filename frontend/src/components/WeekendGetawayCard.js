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

// Helper function to format date
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    return 'TBD';
  }
};

function WeekendGetawayCard({ trek, offers = [] }) {
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
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
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
      whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out flex flex-col border border-gray-100 hover:border-emerald-200"
    >
      <Link 
        to={`/treks/${createTrekSlug(trek.name)}`} 
        state={{ trekId: trek._id, trekName: trek.name }}
        className="group flex flex-col h-full"
      >
        <div className="relative h-40 w-full overflow-hidden">
          {trek.images && trek.images.length > 0 ? (
            <img
              src={trek.images[0]}
              alt={trek.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-400">
              <FaMountain size={35} />
            </div>
          )}
          
          {/* Enhanced category badge */}
          {trek.category && (
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center shadow-lg border border-white/50">
              {categoryIcons[trek.category] || null} {trek.category.charAt(0).toUpperCase() + trek.category.slice(1)}
            </div>
          )}
          
          {/* Enhanced offer badge */}
          {applicableOffer && (
             <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-lg">
               <FaTag className="mr-1" /> {applicableOffer.discountType === 'percentage' ? `${applicableOffer.discountValue}% OFF` : `${safeFormatCurrency(applicableOffer.discountValue)} OFF`}
             </div>
           )}

          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-bold text-gray-800 group-hover:text-emerald-600 transition-colors mb-3 line-clamp-2">
            {trek.name || 'Unnamed Trek'}
          </h3>

          <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-3 text-sm text-gray-600">
            <div className="flex items-center truncate">
              <FaMapMarkerAlt className="text-emerald-500 mr-2 flex-shrink-0" />
              <span className="truncate font-medium">{getRegionName()}</span>
            </div>
            <div className="flex items-center">
              <FaClock className="text-emerald-500 mr-2 flex-shrink-0" />
              <span className="font-medium">{trek.duration || '?'} {trek.duration === 1 ? 'day' : 'days'}</span>
            </div>
            <div className="flex items-center">
              <FaMountain className="text-emerald-500 mr-2 flex-shrink-0" />
              <span className="font-medium">{trek.difficulty || 'N/A'}</span>
            </div>
             {earliestBatch && (
               <div className="flex items-center text-sm text-gray-500">
                 <FaCalendarAlt className="mr-2 flex-shrink-0" />
                 <span className="font-medium">Next: {formatDate(earliestBatch.startDate)}</span>
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
            <span className="text-emerald-500 group-hover:text-emerald-700 transition-all duration-300 group-hover:translate-x-1 bg-emerald-50 group-hover:bg-emerald-100 p-2 rounded-full">
               <FaArrowRight className="text-sm" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default WeekendGetawayCard; 