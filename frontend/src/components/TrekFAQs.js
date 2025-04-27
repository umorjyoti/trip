import React, { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';

const TrekFAQs = ({ faqs }) => {
  const [openIndex, setOpenIndex] = useState(null);

  if (!faqs || faqs.length === 0) {
    return null;
  }

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">FAQs</h2>
      <p className="text-gray-600 mb-8">Frequently asked questions about this trek</p>
      
      <div className="space-y-5">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className="border-b border-gray-200 last:border-b-0 overflow-hidden"
          >
            <button
              className="w-full py-5 text-left flex justify-between items-center group focus:outline-none"
              onClick={() => toggleFAQ(index)}
              aria-expanded={openIndex === index}
            >
              <h3 className="text-lg font-medium text-gray-800 group-hover:text-emerald-600 transition-colors duration-200">
                {faq.question}
              </h3>
              <div 
                className={`flex-shrink-0 ml-4 bg-emerald-50 rounded-full p-1 text-emerald-600 transform transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}
              >
                <FaChevronDown className="h-4 w-4" />
              </div>
            </button>
            
            <div 
              className={`transition-all duration-300 ease-in-out overflow-hidden ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="pb-5 pr-10 text-gray-600 leading-relaxed">
                <p>{faq.answer}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrekFAQs; 