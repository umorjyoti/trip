import React from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaList } from 'react-icons/fa';

function TrekSection({ region }) {
  // If no region is provided, return null
  if (!region) return null;

  // Use the admin-provided content or fall back to defaults
  const title = region.trekSectionTitle || `Backpacking Trips In ${region.name}`;
  const welcomeMessage = region.welcomeMessage || `Welcome to the land of ${region.name}!!`;
  const detailedDescription = region.detailedDescription || `
    ${region.name} - a journey that'll leave a mark on your heart and soul! From the serene monasteries to 
    the thrilling rough terrains and the breathtaking views of Chandratal, ${region.name} has it all. 
    Popularized as the "Middle Land" owing to its historical significance as the connective link between 
    India and Tibet, ${region.name} is one of the secret marvels of the Himalayas. Except that it's no 
    longer a secret and the more people learn about it, the more penchant they become.
    
    You must be wondering about why you need to visit this cold desert but, imagine a land where 
    time stands still, where the slow-paced lives that people lead. ${region.name} makes you appreciate 
    the simple things in life; like a hot bowl of thukpa on a cold evening. These ${region.name} tour 
    packages, aren't just trips; they are soulful adventures where you'll discover ancient monasteries 
    perched on cliffs, crystal-clear rivers, and starry skies that stretch into infinity. Perfect for the 
    thrill-seeker and the soul-searcher, ${region.name} offers an offbeat experience that's all about raw 
    beauty and serene solitude.
    
    Pack your bags and get ready for a Himalayan escapade that's as wild as it is wondrous.
  `;

  // Use description images if available, otherwise fall back to regular images
  const displayImages = region.descriptionImages?.length > 0 
    ? region.descriptionImages 
    : region.images;

  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:flex lg:items-start lg:gap-12">
          {/* Left side - Text content */}
          <div className="lg:w-1/2">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              {title}
            </h2>
            
            <p className="text-lg text-gray-600 mb-4">
              {welcomeMessage}
            </p>
            
            <div className="prose prose-lg max-w-none text-gray-600">
              {/* Render the detailed description with proper paragraph breaks */}
              {detailedDescription.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            
            {/* Download buttons */}
            <div className="mt-10 flex flex-wrap gap-8">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                  <FaCalendarAlt className="w-8 h-8 text-blue-500" />
                </div>
                <span className="text-gray-800 font-medium mb-3">Calendar</span>
                <Link 
                  to="#" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full transition-colors"
                >
                  Download
                </Link>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                  <FaList className="w-8 h-8 text-blue-500" />
                </div>
                <span className="text-gray-800 font-medium mb-3">Packing List</span>
                <Link 
                  to="#" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full transition-colors"
                >
                  Download
                </Link>
              </div>
            </div>
          </div>
          
          {/* Right side - Image grid matching the reference image layout */}
          <div className="mt-10 lg:mt-0 lg:w-1/2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                {/* Top left image */}
                {displayImages && displayImages[0] && (
                  <div className="rounded-lg overflow-hidden transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg h-[300px]">
                    <img 
                      src={displayImages[0]} 
                      alt={`${region.name} landscape 1`}
                      className="w-full h-full object-cover transition-all duration-300 hover:brightness-110"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                      }}
                    />
                  </div>
                )}
                
                {/* Bottom left image */}
                {displayImages && displayImages[2] && (
                  <div className="rounded-lg overflow-hidden transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg h-[200px]">
                    <img 
                      src={displayImages[2]} 
                      alt={`${region.name} landscape 3`}
                      className="w-full h-full object-cover transition-all duration-300 hover:brightness-110"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {/* Top right image */}
                {displayImages && displayImages[1] && (
                
                    <div className="rounded-lg overflow-hidden transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg h-[200px]">
                    <img 
                      src={displayImages[1]} 
                      alt={`${region.name} landscape 4`}
                      className="w-full h-full object-cover transition-all duration-300 hover:brightness-110"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                      }}
                    />
                  </div>
                )}
                
                {/* Bottom right image */}
                {displayImages && displayImages[3] && (
                  <div className="rounded-lg overflow-hidden transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg h-[300px]">
                  <img 
                    src={displayImages[1]} 
                    alt={`${region.name} landscape 2`}
                    className="w-full h-full object-cover transition-all duration-300 hover:brightness-110"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                    }}
                  />
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrekSection; 