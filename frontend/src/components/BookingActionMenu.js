import React, { useState, useRef, useEffect } from 'react';
import { FaEllipsisV, FaEnvelope, FaCheck, FaFileInvoice, FaEdit, FaTimes, FaExchangeAlt, FaEye, FaComment } from 'react-icons/fa';

const BookingActionMenu = ({ booking, onAction, hideShiftAction = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAction = (action) => {
    setIsOpen(false);
    onAction(action, booking);
  };

  // Define all possible menu items
  const allMenuItems = [
    {
      id: 'view',
      label: 'View Booking',
      icon: <FaEye className="w-4 h-4" />,
      color: 'text-gray-600 hover:bg-gray-50',
      showFor: ['pending', 'pending_payment', 'payment_completed', 'payment_confirmed_partial', 'confirmed', 'trek_completed', 'cancelled']
    },
    {
      id: 'reminder',
      label: 'Send Reminder Email',
      icon: <FaEnvelope className="w-4 h-4" />,
      color: 'text-blue-600 hover:bg-blue-50',
      showFor: ['confirmed']
    },
    {
      id: 'partial-reminder',
      label: 'Send Partial Payment Reminder',
      icon: <FaEnvelope className="w-4 h-4" />,
      color: 'text-yellow-600 hover:bg-yellow-50',
      showFor: ['payment_confirmed_partial'],
      showCondition: (booking) => booking.paymentMode === 'partial' && !booking.partialPaymentDetails?.reminderSent
    },
    {
      id: 'mark-partial-complete',
      label: 'Mark Partial Payment Complete',
      icon: <FaCheck className="w-4 h-4" />,
      color: 'text-green-600 hover:bg-green-50',
      showFor: ['payment_confirmed_partial'],
      showCondition: (booking) => booking.paymentMode === 'partial'
    },
    {
      id: 'confirmation',
      label: 'Send Confirmation Email Again',
      icon: <FaCheck className="w-4 h-4" />,
      color: 'text-green-600 hover:bg-green-50',
      showFor: ['confirmed', 'trek_completed']
    },
    {
      id: 'invoice',
      label: 'Send Invoice Again',
      icon: <FaFileInvoice className="w-4 h-4" />,
      color: 'text-purple-600 hover:bg-purple-50',
      showFor: ['confirmed', 'trek_completed']
    },
    {
      id: 'edit',
      label: 'Edit Booking Data',
      icon: <FaEdit className="w-4 h-4" />,
      color: 'text-orange-600 hover:bg-orange-50',
      showFor: ['pending', 'pending_payment', 'payment_completed', 'payment_confirmed_partial', 'confirmed']
    },
    {
      id: 'cancel',
      label: 'Cancel Booking',
      icon: <FaTimes className="w-4 h-4" />,
      color: 'text-red-600 hover:bg-red-50',
      showFor: ['pending', 'pending_payment', 'payment_completed', 'payment_confirmed_partial', 'confirmed']
    },
    {
      id: 'shift',
      label: 'Shift to Another Batch',
      icon: <FaExchangeAlt className="w-4 h-4" />,
      color: 'text-indigo-600 hover:bg-indigo-50',
      showFor: ['confirmed']
    },
    {
      id: 'respond-request',
      label: 'Respond to Request',
      icon: <FaComment className="w-4 h-4" />,
      color: 'text-teal-600 hover:bg-teal-50',
      showFor: ['pending', 'pending_payment', 'payment_completed', 'payment_confirmed_partial', 'confirmed', 'trek_completed', 'cancelled'],
      showCondition: (booking) => booking.cancellationRequest && booking.cancellationRequest.status === 'pending'
    }
  ];

  // Filter menu items based on booking status, hideShiftAction prop, and custom conditions
  const menuItems = allMenuItems.filter(item => {
    const statusMatch = item.showFor.includes(booking.status);
    const shiftActionMatch = !(hideShiftAction && item.id === 'shift');
    const customCondition = item.showCondition ? item.showCondition(booking) : true;
    
    return statusMatch && shiftActionMatch && customCondition;
  });

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
      >
        <FaEllipsisV className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleAction(item.id)}
                className={`w-full flex items-center justify-start px-4 py-2 text-sm ${item.color} transition-colors text-left`}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingActionMenu; 