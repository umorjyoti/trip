import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaExpand, FaCompress, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function VideoCarousel({ videos, title }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visibleVideos, setVisibleVideos] = useState(4);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const carouselRef = useRef(null);
  const itemsRef = useRef([]);

  // Create a circular array of videos for infinite scrolling
  // Add enough items on both sides to create a seamless circular effect
  const circularVideos = [
    ...videos.slice(videos.length - 2, videos.length),
    ...videos,
    ...videos.slice(0, 2)
  ];

  // Update visible videos count based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setVisibleVideos(1);
      } else if (window.innerWidth < 768) {
        setVisibleVideos(2);
      } else if (window.innerWidth < 1024) {
        setVisibleVideos(3);
      } else {
        setVisibleVideos(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Extract YouTube video ID from URL
  const getYouTubeId = (url) => {
    if (!url) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const currentVideoId = getYouTubeId(videos[currentIndex]);

  const handlePrevious = () => {
    setIsPlaying(false);
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? videos.length - 1 : prevIndex - 1));
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentIndex((prevIndex) => (prevIndex === videos.length - 1 ? 0 : prevIndex + 1));
  };

  // Get the real index in the circular array
  const getRealIndex = (index) => {
    return index + 2; // Offset by 2 because we added 2 items at the beginning
  };

  const scrollToIndex = (index) => {
    const realIndex = getRealIndex(index);
    
    if (carouselRef.current && itemsRef.current[realIndex]) {
      // Calculate the center position
      const containerWidth = carouselRef.current.offsetWidth;
      const itemWidth = itemsRef.current[realIndex].offsetWidth;
      const itemLeft = itemsRef.current[realIndex].offsetLeft;
      
      // Center the item
      const scrollAmount = itemLeft - (containerWidth / 2) + (itemWidth / 2);
      
      carouselRef.current.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollCarouselLeft = () => {
    const newIndex = (activeIndex - 1 + videos.length) % videos.length;
    setActiveIndex(newIndex);
    scrollToIndex(newIndex);
  };

  const scrollCarouselRight = () => {
    const newIndex = (activeIndex + 1) % videos.length;
    setActiveIndex(newIndex);
    scrollToIndex(newIndex);
  };

  const handleCardClick = (index) => {
    // First center the card
    setActiveIndex(index);
    scrollToIndex(index);
    
    // Then play after a short delay to allow centering animation
    setTimeout(() => {
      setCurrentIndex(index);
      setIsPlaying(true);
    }, 300);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.msFullscreenElement
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Initialize itemsRef and center the active item on mount
  useEffect(() => {
    itemsRef.current = itemsRef.current.slice(0, circularVideos.length);
    
    // Center the initial active item after a short delay to ensure DOM is ready
    setTimeout(() => {
      scrollToIndex(activeIndex);
    }, 100);
  }, [circularVideos.length, activeIndex]);

  // Handle scroll events to implement infinite scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (!carouselRef.current) return;
      
      // Check if we need to jump to maintain the illusion of infinite scrolling
      const scrollLeft = carouselRef.current.scrollLeft;
      const scrollWidth = carouselRef.current.scrollWidth;
      const clientWidth = carouselRef.current.clientWidth;
      
      // If we're near the beginning, jump to the end copy
      if (scrollLeft < 100) {
        const endIndex = videos.length - 1;
        const realEndIndex = getRealIndex(endIndex);
        if (itemsRef.current[realEndIndex]) {
          const endPos = itemsRef.current[realEndIndex].offsetLeft - carouselRef.current.offsetLeft;
          carouselRef.current.scrollLeft = endPos - clientWidth / 2;
        }
      }
      
      // If we're near the end, jump to the beginning copy
      if (scrollLeft > scrollWidth - clientWidth - 100) {
        const beginIndex = 0;
        const realBeginIndex = getRealIndex(beginIndex);
        if (itemsRef.current[realBeginIndex]) {
          const beginPos = itemsRef.current[realBeginIndex].offsetLeft - carouselRef.current.offsetLeft;
          carouselRef.current.scrollLeft = beginPos - clientWidth / 2;
        }
      }
    };
    
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (carousel) {
        carousel.removeEventListener('scroll', handleScroll);
      }
    };
  }, [videos.length]);

  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">{title || 'Memories For Life'}</h2>
          <p className="mt-2 text-lg text-gray-600">Watch our videos and experience the journey</p>
        </div>
        
        {/* Carousel Container */}
        <div className="relative">
          {/* Carousel Navigation Arrows */}
          <button
            onClick={scrollCarouselLeft}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 rounded-full p-2 shadow-md transition-all -ml-3"
            aria-label="Previous video"
          >
            <FaChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollCarouselRight}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 rounded-full p-2 shadow-md transition-all -mr-3"
            aria-label="Next video"
          >
            <FaChevronRight className="w-5 h-5" />
          </button>
          
          {/* Video Thumbnails Carousel */}
          <div 
            ref={carouselRef}
            className="flex overflow-x-hidden scroll-smooth pb-4 px-10"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {circularVideos.map((video, index) => {
              const videoId = getYouTubeId(video);
              // Calculate the original index in the videos array
              const originalIndex = (index - 2 + videos.length) % videos.length;
              const isActive = originalIndex === activeIndex;
              
              // Calculate distance from center for scaling effect
              const distanceFromActive = Math.min(
                Math.abs(originalIndex - activeIndex),
                Math.abs(originalIndex - activeIndex - videos.length),
                Math.abs(originalIndex - activeIndex + videos.length)
              );
              
              // Scale based on distance from active item
              const scale = isActive ? 1.15 : Math.max(0.85, 1 - (distanceFromActive * 0.1));
              
              return (
                <div 
                  key={index}
                  ref={el => itemsRef.current[index] = el}
                  className={`relative rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer flex-shrink-0 ${
                    isActive ? 'z-10' : 'z-0'
                  }`}
                  style={{ 
                    width: `calc(100% / ${visibleVideos + 0.5})`,
                    margin: '0 8px',
                    transformOrigin: 'center center',
                    transform: `scale(${scale})`,
                    transition: 'transform 0.3s ease, opacity 0.3s ease',
                    opacity: scale * 0.7 + 0.3 // Fade out items further from center
                  }}
                  onClick={() => handleCardClick(originalIndex)}
                >
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                      alt={`Video thumbnail ${originalIndex + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <div className={`bg-red-600 rounded-full p-3 transform transition-transform hover:scale-110 ${
                        isActive ? 'scale-110' : 'scale-100'
                      }`}>
                        <FaPlay className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fullscreen Video Player */}
      {isPlaying && (
        <div 
          ref={containerRef}
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
        >
          <div className="relative w-full max-w-5xl">
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                ref={videoRef}
                src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1&rel=0`}
                title={`Video ${currentIndex + 1}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full rounded-lg"
              ></iframe>
            </div>

            {/* Video Controls */}
            <div className="absolute top-4 right-4 flex space-x-4">
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-gray-300 p-2 bg-black bg-opacity-50 rounded-full"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <FaCompress /> : <FaExpand />}
              </button>
              <button
                onClick={() => setIsPlaying(false)}
                className="text-white hover:text-gray-300 p-2 bg-black bg-opacity-50 rounded-full"
                aria-label="Close video"
              >
                ✕
              </button>
            </div>

            {/* Navigation Arrows */}
            {videos.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all"
                  aria-label="Previous video"
                >
                  <FaChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all"
                  aria-label="Next video"
                >
                  <FaChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoCarousel; 