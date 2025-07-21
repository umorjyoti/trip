import React from 'react';
import CustomTooltip from './CustomTooltip';
import { FaChartLine, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaCalculator } from 'react-icons/fa';

const MetricTooltip = ({ 
  children, 
  value, 
  type = 'number', // number, currency, percentage
  icon = null,
  position = 'top',
  theme = 'dark'
}) => {
  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'currency':
        return <FaChartLine className="w-4 h-4" />;
      case 'percentage':
        return <FaCalculator className="w-4 h-4" />;
      default:
        return <FaCalendarAlt className="w-4 h-4" />;
    }
  };

  const formatValue = (val) => {
    if (type === 'currency') {
      return `₹${val?.toLocaleString('en-IN') || '0'}`;
    }
    return val?.toLocaleString('en-IN') || '0';
  };

  const getTooltipContent = () => (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 text-white/80">
        {getIcon()}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-white">
          {formatValue(value)}
        </div>
        <div className="text-xs text-white/70 mt-1">
          Exact value
        </div>
      </div>
    </div>
  );

  return (
    <CustomTooltip 
      content={getTooltipContent()}
      position={position}
      theme={theme}
      delay={150}
    >
      {children}
    </CustomTooltip>
  );
};

export default MetricTooltip; 