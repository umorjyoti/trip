import React, { useState, useEffect } from 'react';
import { getTreks, toggleWeekendGetaway, createTrekSlug } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  FaPlus, 
  FaMinus, 
  FaUmbrellaBeach, 
  FaCheck, 
  FaTimes, 
  FaEdit, 
  FaEye, 
  FaSearch,
  FaFilter,
  FaSort,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaBus,
  FaUsers,
  FaStar,
  FaTrash,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';
import Modal from '../Modal';
import { Link } from 'react-router-dom';

function WeekendGetawayManager() {
  const [treks, setTreks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekendGetaways, setWeekendGetaways] = useState([]);
  const [regularTreks, setRegularTreks] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [trekToDelete, setTrekToDelete] = useState(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  
  useEffect(() => {
    fetchTreks();
  }, []);

  const fetchTreks = async () => {
    try {
      setLoading(true);
      const response = await getTreks({ includeDisabled: true });
      setTreks(response || []);
      
      // Separate weekend getaways from regular treks
      const weekend = response?.filter(trek => trek.isWeekendGetaway) || [];
      const regular = response?.filter(trek => !trek.isWeekendGetaway) || [];
      
      setWeekendGetaways(weekend);
      setRegularTreks(regular);
    } catch (error) {
      console.error('Error fetching treks:', error);
      toast.error('Failed to fetch treks');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWeekendGetaways = async (trek) => {
    try {
      await toggleWeekendGetaway(trek._id, { isWeekendGetaway: true });
      toast.success(`${trek.name} added to weekend getaways`);
      fetchTreks();
    } catch (error) {
      console.error('Error adding trek to weekend getaways:', error);
      toast.error('Failed to add trek to weekend getaways');
    }
  };

  const confirmRemoveFromWeekendGetaways = async () => {
    if (!trekToDelete) return;
    
    try {
      await toggleWeekendGetaway(trekToDelete._id, { isWeekendGetaway: false });
      toast.success('Trek removed from weekend getaways');
      setShowDeleteModal(false);
      setTrekToDelete(null);
      fetchTreks();
    } catch (error) {
      console.error('Error removing trek from weekend getaways:', error);
      toast.error('Failed to remove trek from weekend getaways');
    }
  };

  const isShortDuration = (trek) => {
    return trek.duration <= 3;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'difficult': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter and sort functions
  const filteredRegularTreks = regularTreks.filter(trek => {
    const matchesSearch = trek.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trek.region.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = !filterRegion || trek.region === filterRegion;
    return matchesSearch && matchesRegion;
  });

  const sortedRegularTreks = [...filteredRegularTreks].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'name' || sortBy === 'region') {
      aValue = aValue?.toLowerCase();
      bValue = bValue?.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getUniqueRegions = () => {
    return [...new Set(regularTreks.map(trek => trek.region))].sort();
  };

  const getViewLink = (trek) => {
    const slug = createTrekSlug(trek.name);
    return `/treks/${slug}`;
  };

  const renderTrekCard = (trek, isWeekendGetaway = false) => (
    <div key={trek._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200">
      <div className="relative">
        <img 
          src={trek.images && trek.images.length > 0 ? trek.images[0] : 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'} 
          alt={trek.name}
          className="w-full h-48 object-cover rounded-t-lg"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80';
          }}
        />
        {isWeekendGetaway && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Weekend Getaway
          </div>
        )}
        {isShortDuration(trek) && !isWeekendGetaway && (
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            <FaCheck className="inline mr-1" />
            Good Fit
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{trek.name}</h3>
        
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <FaMapMarkerAlt className="mr-1 text-emerald-500" />
          <span>{trek.region || 'No region'}</span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-sm text-gray-600">
            <FaClock className="mr-1 text-blue-500" />
            <span>{trek.duration} days</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(trek.difficulty)}`}>
            {trek.difficulty}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          {isWeekendGetaway ? (
            <div className="flex space-x-2">
              <Link
                to={getViewLink(trek)}
                state={{ trekId: trek._id, trekName: trek.name }}
                className="flex items-center px-3 py-1.5 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                title="View trek"
              >
                <FaEye className="mr-1" />
                View
              </Link>
              <button
                onClick={() => {
                  setTrekToDelete(trek);
                  setShowDeleteModal(true);
                }}
                className="flex items-center px-3 py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                title="Remove from weekend getaways"
              >
                <FaTrash className="mr-1" />
                Remove
              </button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => handleAddToWeekendGetaways(trek)}
                className="flex items-center px-3 py-1.5 text-sm bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
                title="Add to weekend getaways"
              >
                <FaPlus className="mr-1" />
                Add
              </button>
              <Link
                to={getViewLink(trek)}
                state={{ trekId: trek._id, trekName: trek.name }}
                className="flex items-center px-3 py-1.5 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                title="View trek"
              >
                <FaEye className="mr-1" />
                View
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaUmbrellaBeach className="mr-3 text-emerald-600" />
              Weekend Getaway Manager
            </h1>
            <p className="text-gray-600 mt-2">
              Manage which treks are featured as weekend getaways on the website.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {viewMode === 'grid' ? 'Table View' : 'Grid View'}
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search treks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">All Regions</option>
            {getUniqueRegions().map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="name">Sort by Name</option>
            <option value="region">Sort by Region</option>
            <option value="duration">Sort by Duration</option>
            <option value="difficulty">Sort by Difficulty</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {sortOrder === 'asc' ? <FaArrowUp /> : <FaArrowDown />}
            <span className="ml-2">{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
          </button>
        </div>
      </div>

      {/* Current Weekend Getaways */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FaStar className="mr-2 text-emerald-600" />
            Current Weekend Getaways ({weekendGetaways.length})
          </h2>
        </div>
        
        {weekendGetaways.length === 0 ? (
          <div className="p-12 text-center">
            <FaUmbrellaBeach className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No weekend getaways</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || filterRegion ? 'No getaways match your filters.' : 'Get started by adding treks from the list below.'}
            </p>
          </div>
        ) : (
          <div className="p-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {weekendGetaways.map(trek => renderTrekCard(trek, true))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trek</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {weekendGetaways.map(trek => (
                      <tr key={trek._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img 
                              className="h-10 w-10 rounded-full object-cover" 
                              src={trek.images && trek.images.length > 0 ? trek.images[0] : 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'} 
                              alt={trek.name} 
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80';
                              }}
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{trek.name}</div>
                              <div className="text-sm text-gray-500">{trek.difficulty}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {trek.region || 'No region'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {trek.duration} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              to={getViewLink(trek)}
                              state={{ trekId: trek._id, trekName: trek.name }}
                              className="text-gray-600 hover:text-gray-900"
                              title="View trek"
                            >
                              <FaEye />
                            </Link>
                            <button
                              onClick={() => {
                                setTrekToDelete(trek);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Remove from weekend getaways"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Available Treks */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FaPlus className="mr-2 text-emerald-600" />
            Available Treks ({filteredRegularTreks.length})
          </h2>
        </div>
        
        {filteredRegularTreks.length === 0 ? (
          <div className="p-12 text-center">
            <FaTimes className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No available treks</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || filterRegion ? 'No treks match your filters.' : 'All treks are already weekend getaways or no treks exist.'}
            </p>
          </div>
        ) : (
          <div className="p-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedRegularTreks.map(trek => renderTrekCard(trek, false))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trek</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suitable</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedRegularTreks.map(trek => (
                      <tr key={trek._id} className={`hover:bg-gray-50 ${isShortDuration(trek) ? 'bg-green-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img 
                              className="h-10 w-10 rounded-full object-cover" 
                              src={trek.images && trek.images.length > 0 ? trek.images[0] : 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'} 
                              alt={trek.name} 
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80';
                              }}
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{trek.name}</div>
                              <div className="text-sm text-gray-500">{trek.difficulty}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {trek.region || 'No region'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {trek.duration} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isShortDuration(trek) ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              <FaCheck className="mr-1" /> Good fit
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              <FaTimes className="mr-1" /> Too long
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleAddToWeekendGetaways(trek)}
                              className="text-emerald-600 hover:text-emerald-900 flex items-center"
                              title="Add to weekend getaways"
                            >
                              <FaPlus className="mr-1" /> Add
                            </button>
                            <Link
                              to={getViewLink(trek)}
                              state={{ trekId: trek._id, trekName: trek.name }}
                              className="text-gray-600 hover:text-gray-900 flex items-center"
                              title="View trek"
                            >
                              <FaEye />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Remove from Weekend Getaways"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Are you sure you want to remove <strong>{trekToDelete?.name}</strong> from weekend getaways?
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={confirmRemoveFromWeekendGetaways}
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default WeekendGetawayManager; 