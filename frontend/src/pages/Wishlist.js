import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserWishlist, removeFromWishlist, createTrekSlug } from '../services/api';
import { toast } from 'react-toastify';
import { FaHeart, FaCalendarAlt, FaMapMarkerAlt, FaRupeeSign } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        const data = await getUserWishlist();
        setWishlist(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching wishlist:', err);
        setError('Failed to load wishlist. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  const handleRemoveFromWishlist = async (trekId) => {
    try {
      setRemovingId(trekId);
      await removeFromWishlist(trekId);
      setWishlist(wishlist.filter(trek => trek._id !== trekId));
      toast.success('Trek removed from wishlist');
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      toast.error('Failed to remove trek from wishlist');
    } finally {
      setRemovingId(null);
    }
  };

  // Helper function to safely format price
  const formatPrice = (price) => {
    if (price === undefined || price === null) {
      return 'Price not available';
    }
    try {
      return price.toLocaleString();
    } catch (error) {
      return 'Price not available';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <FaHeart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Your wishlist is empty</h3>
          <p className="mt-1 text-sm text-gray-500">Start exploring treks and add them to your wishlist!</p>
          <div className="mt-6">
            <Link
              to="/treks"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Explore Treks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Wishlist</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {wishlist.map(trek => (
          <div key={trek._id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="relative">
              <img 
                src={trek.imageUrl} 
                alt={trek.name} 
                className="w-full h-48 object-cover"
              />
              <button
                onClick={() => handleRemoveFromWishlist(trek._id)}
                disabled={removingId === trek._id}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:bg-red-50"
              >
                {removingId === trek._id ? (
                  <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <FaHeart className="h-5 w-5 text-red-500" />
                )}
              </button>
            </div>
            
            <div className="p-5">
              <Link 
                to={`/treks/${createTrekSlug(trek.name)}`} 
                state={{ trekId: trek._id, trekName: trek.name }}
                className="block"
              >
                <h3 className="text-lg font-medium text-gray-900 hover:text-emerald-600">{trek.name}</h3>
              </Link>
              
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <FaMapMarkerAlt className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                <span>{trek.location || 'Location not specified'}</span>
              </div>
              
              {trek.duration && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <FaCalendarAlt className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  <span>{trek.duration} {trek.duration === 1 ? 'day' : 'days'}</span>
                </div>
              )}
              
              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center text-emerald-600">
                  <FaRupeeSign className="h-4 w-4 mr-1" />
                  <span className="text-lg font-semibold">{formatPrice(trek.price)}</span>
                </div>
                
                <Link
                  to={`/treks/${createTrekSlug(trek.name)}`}
                  state={{ trekId: trek._id, trekName: trek.name }}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Wishlist; 