import React from 'react';
import { Link } from 'react-router-dom';
import { FaClock, FaMapMarkerAlt, FaCalendarAlt, FaRupeeSign, FaMountain, FaTag } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { getCategoryIcon } from '../data/weekendGetawaysData'; // Import helper

// Card animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  hover: { scale: 1.03, boxShadow: "0px 15px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)" }
};

const imageVariants = {
  hover: { scale: 1.1 }
};

function WeekendGetawayCard({ getaway }) { // Renamed prop
  if (!getaway) return null; // Handle cases where getaway might be undefined

  const categoryIcon = getCategoryIcon(getaway.category);

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col h-full"
    >
      {/* Image Container */}
      <div className="relative h-52 overflow-hidden">
        <motion.img
          variants={imageVariants}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          src={getaway.images[0]}
          alt={getaway.name}
          className="w-full h-full object-cover"
        />
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Top Right Category Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full p-2 text-xl text-emerald-700 shadow-md"
          title={getaway.category}
        >
          {categoryIcon}
        </motion.div>

        {/* Bottom Left Location */}
        <div className="absolute bottom-3 left-3 text-white">
          <div className="flex items-center bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
            <FaMapMarkerAlt className="mr-1.5 text-emerald-300" />
            <span>{getaway.location}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold text-gray-800 mb-2 truncate">{getaway.name}</h3>

        <div className="flex flex-wrap gap-2 mb-3 text-sm text-gray-600">
          <motion.div
            whileHover={{ scale: 1.05, x: 2 }}
            className="flex items-center bg-emerald-50 px-2.5 py-1 rounded-full text-emerald-700"
          >
            <FaClock className="mr-1.5" />
            <span>{getaway.duration} {getaway.duration === 1 ? 'day' : 'days'}</span>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05, x: 2 }}
            className="flex items-center bg-blue-50 px-2.5 py-1 rounded-full text-blue-700"
          >
            <FaMountain className="mr-1.5" />
            <span>{getaway.difficulty}</span>
          </motion.div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
          {getaway.description}
        </p>

        {/* Tags */}
        {getaway.tags && getaway.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {getaway.tags.map(tag => (
              <span key={tag} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full capitalize">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Price and CTA */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <div className="text-emerald-700">
            <span className="text-xs font-medium">Starts from</span>
            <div className="font-bold text-2xl flex items-center">
              <FaRupeeSign className="text-xl mr-0.5" />
              {getaway.price.toLocaleString()}
            </div>
          </div>
          <Link to={`/weekend-getaways/${getaway._id}`}>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgb(5 150 105)" }} // emerald-600
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors text-sm shadow-md"
            >
              Explore
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default WeekendGetawayCard; 