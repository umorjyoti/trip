import React, { useState, useEffect } from 'react';
import { getTreks } from '../services/api';
import TrekCard from '../components/TrekCard';
import TrekFilter from '../components/TrekFilter';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

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

function TrekList() {
  const location = useLocation();
  const [treks, setTreks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    season: '',
    region: '',
    duration: '',
    category: 'all-treks',
    sort: 'name-asc'
  });
  const [totalPages, setTotalPages] = useState(1);

  // Initialize filters from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryFromUrl = params.get('category');
    
    if (categoryFromUrl) {
      setFilters(prev => ({
        ...prev,
        category: categoryFromUrl
      }));
    }
  }, [location.search]);

  useEffect(() => {
    const fetchTreks = async () => {
      setLoading(true);
      try {
        const data = await getTreks(filters);
        setTreks(Array.isArray(data) ? data : (data.treks || []));
        setTotalPages(data.totalPages || 1);
        setError(null);
      } catch (err) {
        console.error('Error fetching treks:', err);
        setError('Failed to load treks. Please try again later.');
        setTreks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTreks();
  }, [filters]);

  // Filter out custom treks for public display
  const publicTreks = treks.filter(trek => !trek.isCustom);

  if (loading && treks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Explore Treks</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/4">
          <TrekFilter filters={filters} setFilters={setFilters} />
        </div>
        
        <div className="md:w-3/4">
          {error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-gray-600">
                  Showing {publicTreks.length} {publicTreks.length === 1 ? 'trek' : 'treks'}
                  {filters.category && ` in ${filters.category} category`}
                  {filters.region && ` in ${filters.region}`}
                  {filters.season && Array.isArray(filters.season) && filters.season.length > 0 && ` during ${filters.season.join(', ')}`}
                  {filters.season && !Array.isArray(filters.season) && ` during ${filters.season}`}
                  {filters.duration && ` of ${filters.duration === '15+' ? '15+ days' : `${filters.duration} days`}`}
                </p>
              </div>
              
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence>
                  {publicTreks.map(trek => (
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
              
              {publicTreks.length === 0 && !loading && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No treks found matching your filters.</p>
                  <button 
                    onClick={() => setFilters({
                      season: '',
                      region: '',
                      duration: '',
                      category: 'all-treks',
                      sort: 'name-asc'
                    })}
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

export default TrekList; 