import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getTreks, getRegions } from '../services/api';
import TrekCard from '../components/TrekCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaFilter } from 'react-icons/fa';

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

function SearchResults() {
  const location = useLocation();
  const [treks, setTreks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regions, setRegions] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    region: '',
    season: '',
    category: '',
    sort: 'name-asc'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const data = await getRegions();
        // Only show active regions
        const activeRegions = data.filter(region => region.isActive);
        setRegions(activeRegions);
      } catch (error) {
        console.error('Error fetching regions:', error);
      }
    };
    
    fetchRegions();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParams = {
      search: params.get('search') || '',
      region: params.get('region') || '',
      season: params.get('season') || '',
      category: params.get('category') || '',
      sort: 'name-asc'
    };
    setFilters(searchParams);
    fetchTreks(searchParams);
  }, [location.search]);

  const fetchTreks = async (searchParams) => {
    try {
      setLoading(true);
      const data = await getTreks({ ...searchParams, includeDisabled: false });
      console.log('API Response:', data); // Debug log
      setTreks(Array.isArray(data) ? data : (data.treks || []));
      setError(null);
    } catch (err) {
      console.error('Error fetching treks:', err);
      setError('Failed to load treks. Please try again later.');
      setTreks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    window.history.pushState({}, '', `/treks?${params.toString()}`);
    fetchTreks(filters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex items-center bg-gray-50 rounded-lg px-4 py-3">
                <FaSearch className="text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="Search treks..."
                  className="bg-transparent w-full focus:outline-none"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center bg-gray-50 rounded-lg px-4 py-3">
                <FaMapMarkerAlt className="text-gray-400 mr-3" />
                <select
                  className="bg-transparent w-full focus:outline-none"
                  name="region"
                  value={filters.region}
                  onChange={handleFilterChange}
                >
                  <option value="">All Destinations</option>
                  {regions.map(region => (
                    <option key={region._id} value={region._id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center bg-gray-50 rounded-lg px-4 py-3">
                <FaCalendarAlt className="text-gray-400 mr-3" />
                <select
                  className="bg-transparent w-full focus:outline-none"
                  name="season"
                  value={filters.season}
                  onChange={handleFilterChange}
                >
                  <option value="">All Seasons</option>
                  <option value="summer">Summer</option>
                  <option value="spring">Spring</option>
                  <option value="monsoon">Monsoon</option>
                  <option value="autumn">Autumn</option>
                  <option value="winter">Winter</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={applyFilters}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-gray-600">
                  Showing {treks.length} {treks.length === 1 ? 'trek' : 'treks'}
                  {filters.region && ` in ${regions.find(r => r._id === filters.region)?.name || filters.region}`}
                  {filters.season && ` during ${filters.season}`}
                </p>
              </div>
              
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence>
                  {treks.map(trek => (
                    <motion.div 
                      key={trek._id} 
                      variants={itemVariants}
                      exit={{ opacity: 0, y: -10 }}
                      layout
                    >
                      <TrekCard trek={trek} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
              
              {treks.length === 0 && !loading && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No treks found matching your filters.</p>
                  <button 
                    onClick={() => {
                      setFilters({
                        search: '',
                        region: '',
                        season: '',
                        category: '',
                        sort: 'name-asc'
                      });
                      window.history.pushState({}, '', '/treks');
                    }}
                    className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchResults; 