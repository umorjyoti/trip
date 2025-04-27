import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = [];
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // If total pages is less than max to show, display all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      // Calculate start and end of page numbers to show
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're at the beginning
      if (currentPage <= 2) {
        end = Math.min(totalPages - 1, maxPagesToShow - 1);
      }
      
      // Adjust if we're at the end
      if (currentPage >= totalPages - 1) {
        start = Math.max(2, totalPages - maxPagesToShow + 2);
      }
      
      // Add ellipsis after first page if needed
      if (start > 2) {
        pageNumbers.push('...');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Always show last page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };
  
  return (
    <div className="flex justify-center">
      <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
            currentPage === 1 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <span className="sr-only">Previous</span>
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span
              key={`ellipsis-${index}`}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                currentPage === page
                  ? 'z-10 bg-emerald-50 border-emerald-500 text-emerald-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          )
        ))}
        
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
            currentPage === totalPages 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <span className="sr-only">Next</span>
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </nav>
    </div>
  );
};

export default Pagination; 