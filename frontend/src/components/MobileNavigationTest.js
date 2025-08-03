import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { isMobile, initMobileBehaviors } from '../utils/mobileNavigation';

const MobileNavigationTest = () => {
  const [mobileStatus, setMobileStatus] = useState('Checking...');
  const [touchEvents, setTouchEvents] = useState([]);

  useEffect(() => {
    // Initialize mobile behaviors
    initMobileBehaviors();
    
    // Check if mobile
    setMobileStatus(isMobile() ? 'Mobile Device Detected' : 'Desktop Device');
    
    // Monitor touch events
    const handleTouchStart = (e) => {
      setTouchEvents(prev => [...prev, `Touch Start: ${e.touches.length} fingers`]);
    };
    
    const handleTouchMove = (e) => {
      setTouchEvents(prev => [...prev, `Touch Move: ${e.touches.length} fingers`]);
    };
    
    const handleTouchEnd = (e) => {
      setTouchEvents(prev => [...prev, `Touch End: ${e.changedTouches.length} fingers`]);
    };
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Mobile Navigation Test</h2>
      
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <p><strong>Device Status:</strong> {mobileStatus}</p>
        <p><strong>User Agent:</strong> {navigator.userAgent}</p>
      </div>
      
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Test Navigation Links:</h3>
        <div className="space-y-2">
          <Link 
            to="/" 
            className="block p-2 bg-blue-500 text-white rounded text-center"
          >
            Go to Home
          </Link>
          <Link 
            to="/about" 
            className="block p-2 bg-green-500 text-white rounded text-center"
          >
            Go to About
          </Link>
          <Link 
            to="/contact" 
            className="block p-2 bg-purple-500 text-white rounded text-center"
          >
            Go to Contact
          </Link>
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Touch Events (Last 5):</h3>
        <div className="bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
          {touchEvents.slice(-5).map((event, index) => (
            <div key={index} className="text-sm text-gray-700">
              {event}
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        <p>• Try navigating between pages on mobile</p>
        <p>• Check if elements refresh automatically</p>
        <p>• Monitor touch events in the log above</p>
      </div>
    </div>
  );
};

export default MobileNavigationTest; 