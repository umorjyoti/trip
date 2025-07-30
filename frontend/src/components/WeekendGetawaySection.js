import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getWeekendGetaways } from '../services/api';
import WeekendGetawayCard from './WeekendGetawayCard';
import LoadingSpinner from './LoadingSpinner';
import { FaUmbrellaBeach, FaArrowRight, FaCompass, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function WeekendGetawaySection({ offers = [] }) {
  const [weekendGetaways, setWeekendGetaways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const fetchWeekendGetaways = async () => {
      try {
        setLoading(true);
        // Get all weekend getaways for scrolling
        const response = await getWeekendGetaways({ limit: 20 });
        // Check if response has weekendGetaways property
        if (response && response.weekendGetaways) {
          setWeekendGetaways(response.weekendGetaways);
        } else {
          setWeekendGetaways([]);
        }
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

  const scrollToNext = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.querySelector('.trek-card')?.offsetWidth || 300;
      const gap = 32; // gap-8 = 32px
      const scrollAmount = cardWidth + gap;
      
      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
      
      setCurrentIndex(prev => Math.min(prev + 1, weekendGetaways.length - 3));
    }
  };

  const scrollToPrev = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.querySelector('.trek-card')?.offsetWidth || 300;
      const gap = 32; // gap-8 = 32px
      const scrollAmount = cardWidth + gap;
      
      container.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
      
      setCurrentIndex(prev => Math.max(prev - 1, 0));
    }
  };

  const canScrollNext = currentIndex < weekendGetaways.length - 3;
  const canScrollPrev = currentIndex > 0;

  if (loading) {
    return (
      <div className="py-8 text-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !weekendGetaways || weekendGetaways.length === 0) {
    return null; // Don't show section if error or no getaways
  }

  return (
    <section className="py-16 bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header with improved story card styling */}
        <div className="relative mb-12">
          {/* Explore link positioned at top right with enhanced styling */}
          <div className="absolute top-0 right-0 z-10">
            <Link 
              to="/weekend-getaways" 
              className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm text-emerald-600 hover:text-emerald-700 font-medium text-sm rounded-full shadow-sm hover:shadow-md transition-all duration-300 border border-emerald-100 hover:border-emerald-200"
            >
              <FaCompass className="mr-2 text-xs" />
              Explore All Weekend Getaways
              <FaArrowRight className="ml-2 text-xs" />
            </Link>
          </div>

          {/* Enhanced story card styled content */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <FaUmbrellaBeach className="text-white text-lg" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Weekend Escapes
                  </h2>
                  <div className="w-12 h-1 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full"></div>
                </div>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed text-base font-medium">
                  Perfect short trips designed for busy professionals and adventure seekers. Escape the city chaos with our carefully curated 2-3 day getaways that offer the perfect balance of adventure, relaxation, and exploration.
                </p>
                {/* <p className="text-gray-600 leading-relaxed text-sm mt-3">
                  From misty mountain trails to serene lakeside retreats, discover hidden gems that are just a weekend away. Experience the perfect blend of thrill and tranquility in destinations that feel worlds apart from your daily routine.
                </p> */}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable cards section with navigation */}
        <div className="relative">
          {/* Navigation buttons */}
          {canScrollPrev && (
            <button
              onClick={scrollToPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 hover:border-emerald-200 flex items-center justify-center text-emerald-600 hover:text-emerald-700 transition-all duration-300 hover:shadow-xl"
            >
              <FaChevronLeft className="text-sm" />
            </button>
          )}
          
          {canScrollNext && (
            <button
              onClick={scrollToNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 hover:border-emerald-200 flex items-center justify-center text-emerald-600 hover:text-emerald-700 transition-all duration-300 hover:shadow-xl"
            >
              <FaChevronRight className="text-sm" />
            </button>
          )}

          {/* Scrollable cards container */}
          <div 
            ref={scrollContainerRef}
            className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {weekendGetaways.map((trek, index) => (
              <div 
                key={trek._id} 
                className="trek-card flex-shrink-0 w-80 transform hover:scale-105 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <WeekendGetawayCard trek={trek} offers={offers} />
              </div>
            ))}
          </div>

          {/* Scroll indicators */}
          {weekendGetaways.length > 3 && (
            <div className="flex justify-center mt-6 space-x-2">
              {Array.from({ length: Math.ceil(weekendGetaways.length / 3) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (scrollContainerRef.current) {
                      const container = scrollContainerRef.current;
                      const cardWidth = container.querySelector('.trek-card')?.offsetWidth || 300;
                      const gap = 32;
                      const scrollAmount = (cardWidth + gap) * i * 3;
                      
                      container.scrollTo({
                        left: scrollAmount,
                        behavior: 'smooth'
                      });
                      
                      setCurrentIndex(i * 3);
                    }
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentIndex >= i * 3 && currentIndex < (i + 1) * 3
                      ? 'bg-emerald-500 w-6'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Optional: Add a subtle decorative element */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 text-gray-400">
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-gray-300"></div>
            <FaUmbrellaBeach className="text-sm" />
            <div className="w-8 h-px bg-gradient-to-l from-transparent to-gray-300"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WeekendGetawaySection; 