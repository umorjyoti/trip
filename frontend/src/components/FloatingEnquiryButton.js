import React, { useState } from 'react';
import { FaQuestionCircle } from 'react-icons/fa';
import LeadCaptureForm from './LeadCaptureForm';

function FloatingEnquiryButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div 
        style={{ 
          position: 'sticky',
          bottom: '2rem',
          right: '2rem',
          zIndex: 9999,
          pointerEvents: 'auto',
          float: 'right',
          marginTop: '10px'
        }}
      >
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
          style={{
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          }}
        >
          <FaQuestionCircle className="text-xl" />
          <span className="hidden sm:inline font-medium">Enquire Now</span>
        </button>
      </div>

      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998] p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <LeadCaptureForm onClose={() => setIsModalOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

export default FloatingEnquiryButton; 