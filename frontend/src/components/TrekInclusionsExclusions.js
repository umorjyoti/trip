import React, { useState } from "react";
import { FaChevronDown } from "react-icons/fa";

const TrekInclusionsExclusions = ({ includes, excludes }) => {
  const [showAll, setShowAll] = useState(false);
  
  // Default to showing 4 items of each type
  const visibleCount = showAll ? Math.max(includes?.length || 0, excludes?.length || 0) : 4;
  
  if (
    (!includes || includes.length === 0) &&
    (!excludes || excludes.length === 0)
  ) {
    return null;
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
        {/* Inclusions */}
        {includes && includes.length > 0 && (
          <div className="p-6 bg-gradient-to-br from-emerald-50 to-white">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              Inclusions
            </h3>
            <ul className="space-y-3 pl-11">
              {includes.slice(0, visibleCount).map((item, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 h-5 w-5 text-emerald-500 mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
              
              {includes.length > 4 && !showAll && (
                <li className="text-emerald-600 text-sm font-medium pl-7">
                  {includes.length - 4} more items...
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Exclusions */}
        {excludes && excludes.length > 0 && (
          <div className="p-6 bg-gradient-to-br from-red-50 to-white">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
              Exclusions
            </h3>
            <ul className="space-y-3 pl-11">
              {excludes.slice(0, visibleCount).map((item, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 h-5 w-5 text-red-500 mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
              
              {excludes.length > 4 && !showAll && (
                <li className="text-red-600 text-sm font-medium pl-7">
                  {excludes.length - 4} more items...
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* View More/Less Button */}
      {(includes?.length > 4 || excludes?.length > 4) && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-center">
          <button 
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-emerald-700 bg-emerald-100 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
          >
            {showAll ? "Show Less" : "View All Details"}
            <FaChevronDown className={`ml-2 h-4 w-4 transition-transform ${showAll ? 'transform rotate-180' : ''}`} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TrekInclusionsExclusions;
