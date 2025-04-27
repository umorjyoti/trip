import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRegions } from '../services/api';
import { FaMapMarkerAlt, FaCalendarAlt, FaMountain } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';

function RegionList() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        setLoading(true);
        const data = await getRegions();
        console.log('Fetched regions:', data);
        
        // Only show active regions to users
        const activeRegions = data.filter(region => region.isActive);
        console.log('Active regions:', activeRegions);
        
        setRegions(activeRegions);
        setError(null);
      } catch (err) {
        console.error('Error fetching regions:', err);
        setError('Failed to load regions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRegions();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
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
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Explore Trekking Regions
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Discover breathtaking landscapes and adventures across different regions
          </p>
        </div>

        {/* Regions Grid */}
        {regions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No regions available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {regions.map((region) => (
              <Link
                key={region._id}
                to={`/regions/${region._id}`}
                className="group bg-white overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative h-60">
                  <img
                    src={region.coverImage || region.images?.[0] || 'https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5'}
                    alt={region.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black opacity-60"></div>
                  <div className="absolute bottom-0 left-0 p-4">
                    <h2 className="text-xl font-bold text-white">{region.name}</h2>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-gray-600 line-clamp-2 mb-4">{region.description}</p>
                  <div className="flex flex-wrap gap-y-2">
                    <div className="w-full sm:w-1/2 flex items-center text-sm text-gray-500">
                      <FaMapMarkerAlt className="text-emerald-600 mr-2" />
                      <span>{region.location}</span>
                    </div>
                    <div className="w-full sm:w-1/2 flex items-center text-sm text-gray-500">
                      <FaCalendarAlt className="text-emerald-600 mr-2" />
                      <span>{region.bestSeason}</span>
                    </div>
                    <div className="w-full sm:w-1/2 flex items-center text-sm text-gray-500">
                      <FaMountain className="text-emerald-600 mr-2" />
                      <span>~{region.avgTrekDuration} days</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RegionList; 