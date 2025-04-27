import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaExpand, FaTimes } from 'react-icons/fa';
// Assuming ImageGallery is a simple component or you handle fullscreen differently
// import ImageGallery from './ImageGallery';

// Animation variants for the main image
const imageVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.3 },
      scale: { duration: 0.3 }
    }
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 },
      scale: { duration: 0.2 }
    }
  })
};

function WeekendGetawayGallery({ images, title }) {
  const [[page, direction], setPage] = useState([0, 0]); // Use state for page and direction
  const [showFullGallery, setShowFullGallery] = useState(false);

  const imageIndex = page % images.length; // Wrap index

  const paginate = (newDirection) => {
    setPage([page + newDirection, newDirection]);
  };

  if (!images || images.length === 0) {
    return <div className="text-center py-8 text-gray-500">No images available for this getaway.</div>;
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto my-8">
      {/* Main Image Slider */}
      <div className="relative h-[60vh] md:h-[70vh] overflow-hidden rounded-xl shadow-lg bg-gray-200">
        <AnimatePresence initial={false} custom={direction}>
          <motion.img
            key={page} // Key change triggers animation
            custom={direction}
            variants={imageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            src={images[imageIndex]}
            alt={`${title} - Image ${imageIndex + 1}`}
            className="absolute w-full h-full object-cover"
            drag="x" // Enable dragging
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) * velocity.x;
              if (swipe < -10000) { // Swipe right
                paginate(1);
              } else if (swipe > 10000) { // Swipe left
                paginate(-1);
              }
            }}
          />
        </AnimatePresence>

        {/* Navigation Arrows */}
        <div className="absolute inset-y-0 left-0 flex items-center z-10">
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.6)' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => paginate(-1)}
            className="bg-black/40 text-white p-3 rounded-full m-4 focus:outline-none shadow-md"
          >
            <FaChevronLeft size={20} />
          </motion.button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center z-10">
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.6)' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => paginate(1)}
            className="bg-black/40 text-white p-3 rounded-full m-4 focus:outline-none shadow-md"
          >
            <FaChevronRight size={20} />
          </motion.button>
        </div>

        {/* Expand Button */}
        <div className="absolute top-4 right-4 z-10">
           <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.6)' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowFullGallery(true)}
            className="bg-black/40 text-white p-3 rounded-full focus:outline-none shadow-md"
            title="View Full Gallery"
          >
            <FaExpand size={18} />
          </motion.button>
        </div>

         {/* Image Counter */}
         <div className="absolute bottom-4 left-4 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
           {imageIndex + 1} / {images.length}
         </div>
      </div>

      {/* Thumbnails */}
      <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
        {images.map((image, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPage([index, index > imageIndex ? 1 : -1])} // Set page and direction
            className={`relative rounded-lg overflow-hidden aspect-square border-2 transition-all duration-200
              ${index === imageIndex ? 'border-emerald-500 scale-105 ring-2 ring-emerald-500 ring-offset-2' : 'border-transparent hover:border-emerald-300'}`}
          >
            <img
              src={image}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {index === imageIndex && (
              <div className="absolute inset-0 bg-emerald-500/20 pointer-events-none" />
            )}
          </motion.button>
        ))}
      </div>

      {/* Full Gallery Modal (Simplified Placeholder) */}
      <AnimatePresence>
        {showFullGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowFullGallery(false)} // Close on backdrop click
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
            >
              <img
                src={images[imageIndex]}
                alt={`${title} - Full Image ${imageIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
               <button
                 onClick={() => setShowFullGallery(false)}
                 className="absolute -top-4 -right-4 bg-white text-black rounded-full p-2 shadow-lg hover:scale-110 transition-transform"
               >
                 <FaTimes />
               </button>
               {/* Add simple navigation for fullscreen if needed */}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WeekendGetawayGallery; 