import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getRegionById, getTreksByRegion } from '../services/api';
import TrekCard from '../components/TrekCard';

function RegionDetailPage() {
  const { id } = useParams();
  const [region, setRegion] = useState(null);
  const [treks, setTreks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRegionAndTreks = async () => {
      try {
        setLoading(true);
        // Fetch region details
        const regionData = await getRegionById(id);
        setRegion(regionData);
        
        // Fetch treks by region name (not ID)
        const treksData = await getTreksByRegion(regionData.name);
        console.log('Fetched treks for region:', treksData);
        setTreks(treksData);
      } catch (err) {
        console.error('Error fetching region details:', err);
        setError('Failed to load region details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRegionAndTreks();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!region) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Region not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        {region.imageUrl && (
          <div className="h-64 overflow-hidden">
            <img 
              src={region.imageUrl} 
              alt={region.name} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{region.name}</h1>
          <p className="text-gray-700 mb-4">{region.description}</p>
          {region.bestTimeToVisit && (
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">Best Time to Visit:</span> {region.bestTimeToVisit}
            </p>
          )}
          {region.famousFor && (
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">Famous For:</span> {region.famousFor}
            </p>
          )}
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Treks in {region.name}</h2>
      
      {treks.length === 0 ? (
        <p className="text-gray-700">No treks available for this region yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {treks.map(trek => (
            <TrekCard key={trek._id} trek={trek} />
          ))}
        </div>
      )}
    </div>
  );
}

export default RegionDetailPage; 