import React, { useState, useEffect } from 'react';
import { getActiveTrekSections } from '../services/api';
import TrekScrollSection from './TrekScrollSection';
import LoadingSpinner from './LoadingSpinner';

function HomeTrekSections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('HomeTrekSections mounted - fetching sections');
    let isMounted = true;
    
    const fetchSections = async () => {
      try {
        setLoading(true);
        console.log('Fetching active trek sections...');
        const data = await getActiveTrekSections();
        console.log('Received trek sections:', data);
        
        if (isMounted) {
          setSections(data);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching trek sections:', err);
        if (isMounted) {
          setError('Failed to load trek sections');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSections();

    return () => {
      isMounted = false;
    };
  }, []);


  if (loading) {
    return <div className="container mx-auto px-4 py-8 flex justify-center">
      <LoadingSpinner />
    </div>;
  }

  if (error) {
    console.log('HomeTrekSections has error:', error);
    return <div className="text-center text-red-500 my-8">{error}</div>;
  }

  if (sections.length === 0) {
    console.log('HomeTrekSections has no sections');
    return null; // Don't show anything if there are no sections
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {sections.map(section => (
        <TrekScrollSection 
          key={section._id}
          title={section.title}
          treks={section.treks}
          viewAllLink="/treks"
        />
      ))}
    </div>
  );
}

export default HomeTrekSections; 