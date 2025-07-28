import React, { useState, useEffect } from 'react';
import { getRegions } from '../services/api';
import MultiSelectDropdown from './MultiSelectDropdown';
import { FaGlobe, FaCloudRain, FaSun, FaMountain, FaHiking, FaCalendarWeek } from 'react-icons/fa';

function TrekFilter({ filters, setFilters }) {
  const [regions, setRegions] = useState([]);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const data = await getRegions();
        setRegions(data);
      } catch (err) {
        console.error('Error fetching regions:', err);
      }
    };
    
    fetchRegions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryClick = (category) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category === category ? 'all-treks' : category
    }));
  };

  // Category icons mapping
  const categoryIcons = {
    'all-treks': <FaGlobe className="mr-2" />,
    'monsoon-treks': <FaCloudRain className="mr-2" />,
    'sunrise-treks': <FaSun className="mr-2" />,
    'himalayan-treks': <FaMountain className="mr-2" />,
    'backpacking-trips': <FaHiking className="mr-2" />,
    'long-weekend': <FaCalendarWeek className="mr-2" />
  };

  // Category display names
  const categoryNames = {
    'all-treks': 'All Treks',
    'monsoon-treks': 'Monsoon Treks',
    'sunrise-treks': 'Sunrise Treks',
    'himalayan-treks': 'Himalayan Treks',
    'backpacking-trips': 'Backpacking Trips',
    'long-weekend': 'Long Weekend'
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Treks</h2>
      
      {/* Category filter buttons */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => handleCategoryClick('all-treks')}
            className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !filters.category || filters.category === 'all-treks' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            🌍 All Treks
          </button>
          
          {Object.keys(categoryNames).map(category => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filters.category === category ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {categoryIcons[category]} {categoryNames[category]}
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
            Region
          </label>
          <select
            id="region"
            name="region"
            value={filters.region}
            onChange={handleChange}
            className="form-input"
          >
            <option value="">All Regions</option>
            {regions.map(region => (
              <option key={region._id} value={region.name}>
                {region.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-1">
            Seasons
          </label>
          <MultiSelectDropdown
            options={['Spring', 'Summer', 'Monsoon', 'Autumn', 'Winter', 'Year-round']}
            value={Array.isArray(filters.season) ? filters.season : (filters.season ? [filters.season] : [])}
            onChange={(value) => setFilters(prev => ({ ...prev, season: value }))}
            placeholder="All Seasons"
          />
        </div>
        
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
            Duration
          </label>
          <select
            id="duration"
            name="duration"
            value={filters.duration}
            onChange={handleChange}
            className="form-input"
          >
            <option value="">Any Duration</option>
            <option value="1-3">1-3 days</option>
            <option value="4-7">4-7 days</option>
            <option value="8-14">8-14 days</option>
            <option value="15+">15+ days</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            id="sort"
            name="sort"
            value={filters.sort}
            onChange={handleChange}
            className="form-input"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="duration-asc">Duration (Low to High)</option>
            <option value="duration-desc">Duration (High to Low)</option>
            <option value="difficulty-asc">Difficulty (Easy to Hard)</option>
            <option value="difficulty-desc">Difficulty (Hard to Easy)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default TrekFilter; 