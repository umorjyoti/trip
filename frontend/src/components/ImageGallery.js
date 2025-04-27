import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';

function ImageGallery({ images, onClose, title }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    // Prevent scrolling when gallery is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [currentIndex, images.length]);
  
  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const goToPrev = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 text-white">
        <h3 className="text-xl font-medium">{title} - Image {currentIndex + 1} of {images.length}</h3>
        <button 
          onClick={onClose}
          className="text-white hover:text-gray-300 p-2"
          aria-label="Close gallery"
        >
          <FaTimes className="h-6 w-6" />
        </button>
      </div>
      
      {/* Main Image */}
      <div className="flex-1 flex items-center justify-center relative">
        <img 
          src={images[currentIndex]} 
          alt={`${title} - ${currentIndex + 1}`}
          className="max-h-full max-w-full object-contain"
        />
        
        {/* Navigation Buttons */}
        <button
          className="absolute left-4 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70"
          onClick={goToPrev}
          aria-label="Previous image"
        >
          <FaChevronLeft className="h-6 w-6" />
        </button>
        
        <button
          className="absolute right-4 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70"
          onClick={goToNext}
          aria-label="Next image"
        >
          <FaChevronRight className="h-6 w-6" />
        </button>
      </div>
      
      {/* Thumbnails */}
      <div className="p-4 overflow-x-auto">
        <div className="flex space-x-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 h-16 w-24 rounded overflow-hidden ${
                index === currentIndex ? 'ring-2 ring-emerald-500' : ''
              }`}
            >
              <img 
                src={image} 
                alt={`Thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ImageGallery; 