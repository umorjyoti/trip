import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

function VideoGallery({ videos, onClose, title }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 text-white">
        <h3 className="text-xl font-medium">{title} - Video {currentIndex + 1} of {videos.length}</h3>
        <button 
          onClick={onClose}
          className="text-white hover:text-gray-300 p-2"
          aria-label="Close gallery"
        >
          <FaTimes className="h-6 w-6" />
        </button>
      </div>
      
      {/* Main Video */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl aspect-w-16 aspect-h-9">
          <iframe
            src={`https://www.youtube.com/embed/${videos[currentIndex]}`}
            title={`${title} video ${currentIndex + 1}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
      </div>
      
      {/* Video Thumbnails */}
      <div className="p-4 overflow-x-auto">
        <div className="flex space-x-2">
          {videos.map((videoId, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 h-20 w-36 rounded overflow-hidden relative ${
                index === currentIndex ? 'ring-2 ring-emerald-500' : ''
              }`}
            >
              <img 
                src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                alt={`Video thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black bg-opacity-50 rounded-full p-2">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VideoGallery; 