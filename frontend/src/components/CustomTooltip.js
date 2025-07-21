import React, { useState, useRef, useEffect } from 'react';

const CustomTooltip = ({ 
  children, 
  content, 
  position = 'top',
  className = '',
  delay = 200,
  theme = 'dark' // dark, light, success, warning, error
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      setShowTooltip(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
    setShowTooltip(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    let x = 0;
    let y = 0;

    switch (position) {
      case 'top':
        x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2) + scrollX;
        y = triggerRect.top - tooltipRect.height - 8 + scrollY;
        break;
      case 'bottom':
        x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2) + scrollX;
        y = triggerRect.bottom + 8 + scrollY;
        break;
      case 'left':
        x = triggerRect.left - tooltipRect.width - 8 + scrollX;
        y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2) + scrollY;
        break;
      case 'right':
        x = triggerRect.right + 8 + scrollX;
        y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2) + scrollY;
        break;
      default:
        x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2) + scrollX;
        y = triggerRect.top - tooltipRect.height - 8 + scrollY;
    }

    // Ensure tooltip stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (x < 0) x = 8;
    if (x + tooltipRect.width > viewportWidth) x = viewportWidth - tooltipRect.width - 8;
    if (y < 0) y = 8;
    if (y + tooltipRect.height > viewportHeight) y = viewportHeight - tooltipRect.height - 8;

    setTooltipPosition({ x, y });
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isVisible]);

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return 'bg-white text-gray-900 border-gray-200 shadow-lg';
      case 'success':
        return 'bg-green-600 text-white border-green-700 shadow-lg';
      case 'warning':
        return 'bg-yellow-500 text-white border-yellow-600 shadow-lg';
      case 'error':
        return 'bg-red-600 text-white border-red-700 shadow-lg';
      default: // dark
        return 'bg-gray-900 text-white border-gray-700 shadow-xl';
    }
  };

  const getArrowThemeClasses = () => {
    switch (theme) {
      case 'light':
        return 'bg-white border-gray-200';
      case 'success':
        return 'bg-green-600 border-green-700';
      case 'warning':
        return 'bg-yellow-500 border-yellow-600';
      case 'error':
        return 'bg-red-600 border-red-700';
      default: // dark
        return 'bg-gray-900 border-gray-700';
    }
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={className}
      >
        {children}
      </div>
      
      {showTooltip && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 px-4 py-3 text-sm font-medium rounded-lg border transition-all duration-300 ease-in-out backdrop-blur-sm ${
            getThemeClasses()
          } ${
            isVisible 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-95 translate-y-1'
          }`}
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            pointerEvents: 'none',
            maxWidth: '300px',
            wordWrap: 'break-word'
          }}
        >
          <div className="flex items-center gap-2">
            <span className="flex-1">{content}</span>
          </div>
          
          {/* Arrow */}
          <div
            className={`absolute w-3 h-3 border transform rotate-45 ${getArrowThemeClasses()} ${
              position === 'top' ? 'top-full -mt-1.5 left-1/2 -ml-1.5' :
              position === 'bottom' ? 'bottom-full -mb-1.5 left-1/2 -ml-1.5' :
              position === 'left' ? 'left-full -ml-1.5 top-1/2 -mt-1.5' :
              'right-full -mr-1.5 top-1/2 -mt-1.5'
            }`}
          />
        </div>
      )}
    </div>
  );
};

export default CustomTooltip; 