import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
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

  // Ensure body scrolling is restored when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

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

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity z-40"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Modal Centering Container */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Modal Panel */}
        <div
          className={`relative flex flex-col w-full ${getModalWidth()} max-h-[90vh] bg-white rounded-lg shadow-xl`}
          onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate flex-1 mr-2">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-full p-1 touch-target"
              aria-label="Close modal"
            >
              <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          
          {/* Content - This will scroll if it overflows */}
          <div className="flex-1 px-4 sm:px-6 py-3 sm:py-4 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}

export default Modal; 