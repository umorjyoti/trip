import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa';
import { getRegions, getLandingPageSettings } from '../services/api';

function HeroSection() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [destination, setDestination] = useState('');
  const [season, setSeason] = useState('');
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroImage, setHeroImage] = useState('');
  const [heroTitle, setHeroTitle] = useState('Discover Your Next Adventure');
  const [heroSubtitle, setHeroSubtitle] = useState('Explore breathtaking trails and create unforgettable memories with Bengaluru Trekkers');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch regions
        const regionsData = await getRegions();
        const activeRegions = regionsData.filter(region => region.isEnabled);
        setRegions(activeRegions);

        // Fetch landing page settings
        try {
          const landingPageData = await getLandingPageSettings();
          if (landingPageData.landingPage?.heroImage) {
            setHeroImage(landingPageData.landingPage.heroImage);
          }
          if (landingPageData.landingPage?.heroTitle) {
            setHeroTitle(landingPageData.landingPage.heroTitle);
          }
          if (landingPageData.landingPage?.heroSubtitle) {
            setHeroSubtitle(landingPageData.landingPage.heroSubtitle);
          }
        } catch (error) {
          console.error('Error fetching landing page settings:', error);
          // Keep using the default image if settings fetch fails
        }
      } catch (error) {
        console.error('Error fetching regions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleSearch = (e) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (destination) params.append('region', destination);
    if (season) params.append('season', season);
    
    navigate(`/treks?${params.toString()}`);
  };
  
  return (
    <div className="relative h-[calc(100vh-64px)]">
      {/* Background Video or Image */}
      <div className="absolute inset-0 z-0">
        {heroImage ? (
          <video
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            poster={heroImage}
          >
            <source src="/videos/hero-background.mp4" type="video/mp4" />
          </video>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-blue-600"></div>
        )}
        <div className="absolute inset-0 bg-black opacity-50"></div>
      </div>
      
      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-bold text-center mb-6"
        >
          {heroTitle}
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-xl md:text-2xl text-center max-w-3xl mb-12"
        >
          {heroSubtitle}
        </motion.p>
        
        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="w-full max-w-4xl bg-white/10 backdrop-blur-md rounded-lg p-4 md:p-6"
        >
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex items-center bg-white/20 rounded-lg px-4 py-3 focus-within:bg-white/30 transition">
                <FaSearch className="text-white mr-3" />
                <input
                  type="text"
                  placeholder="Search treks, regions, or descriptions..."
                  className="bg-transparent w-full text-white placeholder-white/70 focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center bg-white/20 rounded-lg px-4 py-3 focus-within:bg-white/30 transition">
                <FaMapMarkerAlt className="text-white mr-3" />
                <select
                  className="bg-transparent w-full text-white appearance-none focus:outline-none"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                >
                  <option value="" className="text-gray-800">All Destinations</option>
                  {regions.map(region => (
                    <option key={region._id} value={region.name} className="text-gray-800">
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center bg-white/20 rounded-lg px-4 py-3 focus-within:bg-white/30 transition">
                <FaCalendarAlt className="text-white mr-3" />
                <select
                  className="bg-transparent w-full text-white appearance-none focus:outline-none"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                >
                  <option value="" className="text-gray-800">All Seasons</option>
                  <option value="Summer" className="text-gray-800">Summer</option>
                  <option value="Spring" className="text-gray-800">Spring</option>
                  <option value="Monsoon" className="text-gray-800">Monsoon</option>
                  <option value="Autumn" className="text-gray-800">Autumn</option>
                  <option value="Winter" className="text-gray-800">Winter</option>
                  <option value="Year-round" className="text-gray-800">Year-round</option>
                </select>
              </div>
            </div>
            
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
            >
              Search
            </button>
          </form>
        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 text-white"
          animate={{
            y: [0, 10, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "loop"
          }}
        >
          <div className="flex flex-col items-center">
            <span className="text-sm mb-2">Scroll to explore</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default HeroSection; 