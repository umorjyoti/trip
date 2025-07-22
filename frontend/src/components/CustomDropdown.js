import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const CustomDropdown = ({
  options = [],
  value,
  onChange,
  placeholder = "Select an option",
  required = false,
  disabled = false,
  className = "",
  icon: Icon = null,
  error = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  const selectedOption = options.find(option => 
    typeof option === 'object' ? option.value === value : option === value
  );

  const displayValue = selectedOption 
    ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
    : placeholder;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left border rounded-md transition-colors
          ${Icon ? 'pl-10' : ''}
          ${disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
            : 'bg-white text-gray-900 border-gray-300 hover:border-emerald-500 focus:border-emerald-500'
          }
          ${error ? 'border-red-500 focus:border-red-500' : ''}
          ${isOpen ? 'border-emerald-500 ring-2 ring-emerald-500 ring-opacity-20' : ''}
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-20
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="dropdown-label"
      >
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="text-gray-400" />
          </div>
        )}
        
        <span className={`block truncate ${!selectedOption ? 'text-gray-500' : ''}`}>
          {displayValue}
        </span>
        
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          {isOpen ? (
            <FaChevronUp className="text-gray-400" />
          ) : (
            <FaChevronDown className="text-gray-400" />
          )}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <ul
            role="listbox"
            className="py-1"
          >
            {options.map((option, index) => {
              const optionValue = typeof option === 'object' ? option.value : option;
              const optionLabel = typeof option === 'object' ? option.label : option;
              const isSelected = optionValue === value;

              return (
                <li
                  key={index}
                  role="option"
                  aria-selected={isSelected}
                  className={`
                    cursor-pointer select-none relative py-2 pl-3 pr-9
                    ${isSelected 
                      ? 'bg-emerald-600 text-white' 
                      : 'text-gray-900 hover:bg-emerald-50'
                    }
                  `}
                  onClick={() => handleOptionClick(option)}
                >
                  <span className={`block truncate ${isSelected ? 'font-semibold' : 'font-normal'}`}>
                    {optionLabel}
                  </span>
                  
                  {isSelected && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default CustomDropdown; 