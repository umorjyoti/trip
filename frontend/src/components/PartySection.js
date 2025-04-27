import React from 'react';
import { FaGlassCheers, FaMusic, FaFire } from 'react-icons/fa';

function PartySection({ description, images, highlights }) {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <FaGlassCheers className="text-2xl mr-2" />
          <h2 className="text-2xl font-bold">Party Time!</h2>
        </div>
        
        <p className="mb-6">{description}</p>
        
        {highlights && highlights.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <FaFire className="mr-2" /> Party Highlights
            </h3>
            <ul className="space-y-2">
              {highlights.map((highlight, index) => (
                <li key={index} className="flex items-start">
                  <FaMusic className="mt-1 mr-2 flex-shrink-0" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {images && images.length > 0 && (
        <div className="grid grid-cols-2 gap-1">
          {images.slice(0, 4).map((image, index) => (
            <div key={index} className={index === 0 ? "col-span-2" : ""}>
              <img 
                src={image} 
                alt={`Party image ${index + 1}`} 
                className="w-full h-48 object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PartySection; 