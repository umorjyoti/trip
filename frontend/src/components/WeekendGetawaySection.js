import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getWeekendGetaways } from '../services/api';
import WeekendGetawayCard from './WeekendGetawayCard';
import LoadingSpinner from './LoadingSpinner';
import { FaUmbrellaBeach, FaArrowRight } from 'react-icons/fa';

function WeekendGetawaySection() {
  const [weekendGetaways, setWeekendGetaways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeekendGetaways = async () => {
      try {
        setLoading(true);
        // Get latest 3 weekend getaways
        const data = await getWeekendGetaways({ limit: 3 });
        setWeekendGetaways(data.weekendGetaways);
        setError(null);
      } catch (err) {
        console.error('Error fetching weekend getaways:', err);
        setError('Failed to load weekend getaways');
      } finally {
        setLoading(false);
      }
    };

    fetchWeekendGetaways();
  }, []);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || weekendGetaways.length === 0) {
    return null; // Don't show section if error or no getaways
  }

  return (
    <section className="py-12 bg-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 flex items-center justify-center">
            <FaUmbrellaBeach className="text-emerald-600 mr-3" />
            Weekend Escapes
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Short trips perfect for your weekend adventures
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {weekendGetaways.map(trek => (
            <WeekendGetawayCard key={trek._id} trek={trek} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link 
            to="/weekend-getaways" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
          >
            Explore All Weekend Getaways
            <FaArrowRight className="ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default WeekendGetawaySection; 