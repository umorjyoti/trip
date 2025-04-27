import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import WeekendGetawayGallery from '../components/WeekendGetawayGallery';
import { format } from 'date-fns';
import { FaCalendarAlt, FaMapMarkerAlt, FaHiking, FaUtensils, FaBed, FaBus, FaInfoCircle, FaCheck, FaTimes, FaClock, FaRupeeSign, FaTag, FaStar, FaUsers, FaTree, FaQuestionCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { weekendGetawaysData } from '../data/weekendGetawaysData';

// Animation Variants
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

function WeekendGetawayDetail() {
  const { id } = useParams();
  const [getaway, setGetaway] = useState(null);

  useEffect(() => {
    // Find the getaway from hardcoded data
    const foundGetaway = weekendGetawaysData.find(g => g._id === id);
    setGetaway(foundGetaway);
    // Scroll to top on component mount
    window.scrollTo(0, 0);
  }, [id]);

  // Show a simple loading or not found message until data is set
  if (!getaway) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-600">Loading getaway details or getaway not found...</p>
      </div>
    );
  }

  // Helper to render inclusion/exclusion lists
  const renderList = (items, icon, iconColor) => (
    <motion.ul
      className="space-y-2"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
    >
      {items.map((item, index) => (
        <motion.li key={index} className="flex items-start" variants={listItemVariants}>
          <span className={`mr-3 mt-1 ${iconColor}`}>{icon}</span>
          <span>{item}</span>
        </motion.li>
      ))}
    </motion.ul>
  );

  return (
    <div className="bg-gradient-to-b from-white via-emerald-50 to-white">

      {/* Dynamic Hero Section using Gallery */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative pt-16 md:pt-20" // Adjust padding top if you have a fixed navbar
      >
        {/* Use the revamped Gallery Component */}
        <WeekendGetawayGallery images={getaway.gallery || getaway.images} title={getaway.name} />

        {/* Basic Info Overlay/Section (Optional, gallery might be enough) */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 md:-mt-24 z-20">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="bg-white rounded-xl shadow-xl p-6 md:p-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight mb-3">
              {getaway.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-600 mb-4">
              <span className="flex items-center"><FaMapMarkerAlt className="mr-1.5 text-emerald-500" /> {getaway.location}, {getaway.region}</span>
              <span className="flex items-center"><FaClock className="mr-1.5 text-blue-500" /> {getaway.duration} Days</span>
              <span className="flex items-center"><FaHiking className="mr-1.5 text-orange-500" /> {getaway.difficulty}</span>
            </div>
             {/* Tags */}
            {getaway.tags && getaway.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {getaway.tags.map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full capitalize flex items-center">
                    <FaTag className="mr-1 text-gray-500" /> {tag}
                  </span>
                ))}
              </div>
            )}
            <p className="text-gray-700 text-base md:text-lg">
              {getaway.description}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content Sections */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-12 md:space-y-16">

        {/* Highlights Section */}
        <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6 flex items-center">
            <FaStar className="mr-3 text-yellow-500" /> Trip Highlights
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-gray-700">
            {getaway.weekendHighlights.map((highlight, index) => (
              <motion.div
                key={index}
                className="flex items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <FaCheck className="text-emerald-500 mr-3 flex-shrink-0" />
                <span>{highlight}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Itinerary Section */}
        <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6 flex items-center">
            <FaCalendarAlt className="mr-3 text-blue-500" /> Detailed Itinerary
          </h2>
          <div className="space-y-6">
            {getaway.itinerary.map((day, index) => (
              <motion.div
                key={index}
                className="flex flex-col md:flex-row items-start bg-white p-5 rounded-lg shadow-sm border border-gray-100"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
              >
                <div className="flex-shrink-0 w-full md:w-28 text-center md:text-left mb-3 md:mb-0 md:mr-5">
                   <span className="text-emerald-600 text-4xl font-bold block">{day.icon ? <day.icon className="inline-block mb-1"/> : `Day`}</span>
                   <span className="text-emerald-600 text-lg font-semibold block">{day.icon ? `Day ${day.day}` : `${day.day}`}</span>
                   <div className="flex justify-center md:justify-start mt-1 space-x-1 text-xs text-gray-500">
                     {day.meals?.breakfast && <span title="Breakfast Included">🍳</span>}
                     {day.meals?.lunch && <span title="Lunch Included">🍱</span>}
                     {day.meals?.dinner && <span title="Dinner Included">🍲</span>}
                   </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{day.title}</h3>
                  <p className="text-gray-600">{day.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Inclusions & Exclusions */}
        <motion.div
          variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12"
        >
          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaCheck className="mr-3 text-emerald-500" /> What's Included
            </h2>
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 text-gray-700">
              {renderList(getaway.inclusions, <FaCheck />, 'text-emerald-500')}
            </div>
          </section>
          <section>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaTimes className="mr-3 text-red-500" /> What's Not Included
            </h2>
             <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 text-gray-700">
              {renderList(getaway.exclusions, <FaTimes />, 'text-red-500')}
            </div>
          </section>
        </motion.div>

        {/* Good to Know / Vibe Section */}
         <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6 flex items-center">
            <FaInfoCircle className="mr-3 text-purple-500" /> Good to Know
          </h2>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
             <div className="flex items-center text-gray-700">
                <FaUsers className="mr-3 text-purple-500 text-xl"/>
                <span><strong>Vibe:</strong> {getaway.vibe}</span>
             </div>
             <div className="text-gray-700">
                <FaQuestionCircle className="inline mr-3 text-purple-500 text-xl align-middle"/>
                <strong>Quick Tips:</strong>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    {getaway.goodToKnow.map((tip, index) => (
                        <li key={index}>{tip}</li>
                    ))}
                </ul>
             </div>
             <div className="flex items-center text-gray-700">
                <FaBus className="mr-3 text-purple-500 text-xl"/>
                <span><strong>Transport:</strong> {getaway.transportation} (Dep: {getaway.departureTime}, Ret: {getaway.returnTime}, Meet: {getaway.meetingPoint})</span>
             </div>
          </div>
        </motion.section>

        {/* Booking / Price Section */}
        <motion.section
          variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
          className="sticky bottom-0 z-40 py-4 bg-gradient-to-t from-white via-white to-transparent -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8" // Sticky footer effect
        >
          <div className="max-w-5xl mx-auto bg-white p-5 rounded-lg shadow-lg border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <span className="text-sm text-gray-600">Starting Price per person</span>
              <div className="text-3xl font-bold text-emerald-600 flex items-center justify-center md:justify-start">
                <FaRupeeSign className="mr-1" />{getaway.price.toLocaleString()}
              </div>
            </div>
            {/* Add Batch Selection Dropdown Here if needed */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full md:w-auto px-8 py-3 bg-emerald-600 text-white rounded-lg font-semibold text-lg hover:bg-emerald-700 transition-colors shadow-md"
              // onClick={handleBookingClick} // Add booking logic later
            >
              Book Your Spot Now
            </motion.button>
          </div>
        </motion.section>


        {/* Back Link */}
        <div className="text-center mt-8">
          <Link
            to="/weekend-getaways"
            className="inline-flex items-center px-6 py-2 border border-emerald-600 text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors"
          >
            ← Explore Other Getaways
          </Link>
        </div>
      </div>
    </div>
  );
}

export default WeekendGetawayDetail; 