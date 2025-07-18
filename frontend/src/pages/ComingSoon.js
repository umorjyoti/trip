import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaMountain, FaArrowLeft, FaEnvelope } from 'react-icons/fa';

function ComingSoon() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Icon */}
          <div className="mb-8">
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="inline-block"
            >
              <FaMountain className="text-6xl text-emerald-600 mx-auto" />
            </motion.div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            Coming Soon
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            We're working hard to bring you something amazing. 
            This feature is currently under development and will be available soon!
          </p>

          {/* Features Preview */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              What to expect:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-gray-700">Custom trek planning</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-gray-700">Personalized itineraries</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-gray-700">Expert guidance</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-gray-700">Flexible scheduling</span>
              </div>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="bg-emerald-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Stay Updated
            </h3>
            <p className="text-gray-600 mb-4">
              Get notified when this feature launches and receive exclusive updates!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2">
                <FaEnvelope className="text-sm" />
                <span>Subscribe</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <FaArrowLeft className="text-sm" />
              <span>Back to Home</span>
            </Link>
            <Link
              to="/treks"
              className="inline-flex items-center space-x-2 bg-white text-emerald-600 border border-emerald-600 px-6 py-3 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              <FaMountain className="text-sm" />
              <span>Explore Treks</span>
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-emerald-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "75%" }}
                transition={{ duration: 2, ease: "easeOut" }}
              ></motion.div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Development Progress: 75%</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default ComingSoon; 