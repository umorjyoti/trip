import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaChevronUp, FaTimes } from 'react-icons/fa';

const MultiSelectDropdown = ({
  options = [],
  value = [],
  onChange,
  placeholder = "Select options",
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
    const optionValue = typeof option === 'object' ? option.value : option;
    const newValue = [...value];
    
    if (newValue.includes(optionValue)) {
      // Remove if already selected
      const index = newValue.indexOf(optionValue);
      newValue.splice(index, 1);
    } else {
      // Add if not selected
      newValue.push(optionValue);
    }
    
    onChange(newValue);
  };

  const removeOption = (optionToRemove, e) => {
    e.stopPropagation();
    const newValue = value.filter(option => option !== optionToRemove);
    onChange(newValue);
  };

  const displayValue = value.length > 0 
    ? `${value.length} selected`
    : placeholder;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left border rounded-md transition-colors min-h-[42px]
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
        
        <div className="flex flex-wrap gap-1 items-center">
          {value.length > 0 ? (
            <>
              {value.map((selectedValue, index) => {
                const selectedOption = options.find(option => 
                  typeof option === 'object' ? option.value === selectedValue : option === selectedValue
                );
                const selectedLabel = selectedOption 
                  ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
                  : selectedValue;
                
                return (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded-md"
                  >
                    {selectedLabel}
                    <button
                      type="button"
                      onClick={(e) => removeOption(selectedValue, e)}
                      className="text-emerald-600 hover:text-emerald-800"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </>
          ) : (
            <span className="text-gray-500">{displayValue}</span>
          )}
        </div>
        
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
              const isSelected = value.includes(optionValue);

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

export default MultiSelectDropdown; 