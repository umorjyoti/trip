import React, { useState } from 'react';
import { FaBox } from 'react-icons/fa';

const ThingsToPack = ({ items }) => {
  const [showAll, setShowAll] = useState(false);
  
  if (!items || items.length === 0) {
    return null;
  }

  // Show all items if showAll is true, otherwise show only the first 6
  const displayItems = showAll ? items : items.slice(0, 6);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Things To Pack</h2>
      
      <div className="border-t border-gray-200 pt-6">
        {displayItems.map((item, index) => {
          // Check if this is a single line item (only title, no description)
          const isSingleLine = !item.description || item.description.trim() === '';
          
          return (
            <div key={index} className="mb-8 flex">
              <div className="flex-shrink-0 mr-4">
                <div className="bg-blue-50 rounded-full p-4 w-16 h-16 flex items-center justify-center">
                  {item.icon ? (
                    <img 
                      src={item.icon} 
                      alt={item.title}
                      className="w-8 h-8 text-blue-500"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <FaBox 
                    className={`w-8 h-8 text-blue-500 ${item.icon ? 'hidden' : 'block'}`}
                    style={{ display: item.icon ? 'none' : 'block' }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-1 text-left">{item.title}:</h3>
                {!isSingleLine && <p className="text-gray-700 text-left">{item.description}</p>}
              </div>
            </div>
          );
        })}
        
        {items.length > 6 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              {showAll ? 'Show Less' : 'View More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThingsToPack; 