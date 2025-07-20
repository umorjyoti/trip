import React, { useState } from 'react';
import { FaQuestionCircle } from 'react-icons/fa';
import EnquiryBanner from './EnquiryBanner';

function FloatingEnquiryButton({ onEnquireClick, source = 'Landing Page' }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div 
        style={{ 
          position: 'sticky',
          bottom: '2rem',
          right: '2rem',
          zIndex: 40,
          pointerEvents: 'auto',
          float: 'right',
          marginTop: '10px'
        }}
      >
        <button
          onClick={() => {
            if (onEnquireClick) {
              onEnquireClick();
            } else {
              setIsModalOpen(true);
            }
          }}
          className="bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
          style={{
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          }}
        >
          <FaQuestionCircle className="text-xl" />
          <span className="hidden sm:inline font-medium">Enquire Now</span>
        </button>
      </div>

      <EnquiryBanner
        trek={null}
        isOpen={isModalOpen}
        source={source}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setIsModalOpen(false)}
      />
    </>
  );
}

export default FloatingEnquiryButton; 