import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

function Modal({ title, children, onClose, size = 'default', isOpen = true }) {
  // Prevent scrolling of the background when modal is open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event) => {
      if (event.keyCode === 27) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // Determine modal width based on size prop
  const getModalWidth = () => {
    switch (size) {
      case 'small':
        return 'max-w-sm sm:max-w-md';
      case 'large':
        return 'max-w-2xl sm:max-w-4xl';
      case 'xl':
        return 'max-w-4xl sm:max-w-6xl';
      default:
        return 'max-w-lg sm:max-w-2xl';
    }
  };

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-3 pt-4 pb-20 text-center sm:block sm:p-0 mobile-safe-area">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
          onClick={onClose}
          aria-hidden="true"
        ></div>

        {/* Modal panel */}
        <div className={`inline-block w-full ${getModalWidth()} my-4 sm:my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate flex-1 mr-2">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-full p-1 touch-target"
              aria-label="Close modal"
            >
              <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          
          {/* Content - Make this scrollable */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Modal; 