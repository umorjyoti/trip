import React, { useState } from 'react';

const TrekItinerary = ({ itinerary }) => {
  const [openDays, setOpenDays] = useState([0]); // Start with first day open

  if (!itinerary || itinerary.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Itinerary</h2>
        <p className="text-gray-600">Detailed itinerary information is not available for this trek.</p>
      </div>
    );
  }

  const toggleDay = (dayIndex) => {
    setOpenDays(prev => {
      if (prev.includes(dayIndex)) {
        return prev.filter(index => index !== dayIndex);
      } else {
        return [...prev, dayIndex];
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
     
      
      <div className="space-y-4">
        {itinerary.map((day, index) => (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Accordion header */}
            <button
              onClick={() => toggleDay(index)}
              className={`w-full px-4 py-3 flex justify-between items-center text-left transition-colors ${
                openDays.includes(index) 
                  ? 'bg-emerald-50 text-emerald-800' 
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center">
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mr-3">
                  {index + 1}
                </span>
                <span className="font-medium">{day.title || `Day ${index + 1}`}</span>
              </div>
              <svg 
                className={`h-5 w-5 transform transition-transform ${openDays.includes(index) ? 'rotate-180' : ''}`} 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Accordion content */}
            {openDays.includes(index) && (
              <div className="p-4 border-t border-gray-200">
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <p className="text-gray-700 whitespace-pre-line">
                      {day.description || 'No description available for this day.'}
                    </p>
                  </div>
                  
                  {/* Accommodation and Meals */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Accommodation */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold text-gray-700 mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Accommodation
                      </h4>
                      <p className="text-gray-600">
                        {day.accommodation || 'Not specified'}
                      </p>
                    </div>
                    
                    {/* Meals */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold text-gray-700 mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Meals
                      </h4>
                      <p className="text-gray-600">
                        {day.meals || 'Not specified'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Activities */}
                  {day.activities && day.activities.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        Key Activities
                      </h4>
                      <ul className="space-y-2">
                        {day.activities.map((activity, activityIndex) => (
                          <li key={activityIndex} className="flex items-start">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mr-3 flex-shrink-0">
                              {activityIndex + 1}
                            </span>
                            <span className="text-gray-700">{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrekItinerary; 