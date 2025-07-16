import React from 'react';
import Modal from './Modal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { FaUser, FaEnvelope, FaPhone, FaCalendar, FaMoneyBillWave, FaUsers, FaMapMarkerAlt, FaClock, FaStar } from 'react-icons/fa';

const ViewBookingModal = ({ isOpen, onClose, booking, trekData }) => {
  if (!isOpen || !booking) return null;

  return (
    <Modal
      title="Booking Details"
      isOpen={isOpen}
      onClose={onClose}
      size="large"
    >
      <div className="space-y-6">
        {/* Booking Overview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <FaCalendar className="mr-2 text-emerald-600" />
            Booking Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Booking ID</p>
              <p className="font-medium text-gray-900">{booking.bookingId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Booking Date</p>
              <p className="font-medium text-gray-900">{formatDate(booking.bookingDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {booking.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <div className="font-medium text-lg text-emerald-600 flex items-center">
                <FaMoneyBillWave className="mr-1" />
                {formatCurrency(booking.totalPrice)}
              </div>
              {(() => {
                // Calculate total refunded amount (booking-level + participant-level)
                let refunded = 0;
                if (booking.refundStatus === 'success') {
                  refunded += booking.refundAmount || 0;
                }
                if (Array.isArray(booking.participantDetails)) {
                  refunded += booking.participantDetails.reduce((rSum, p) => {
                    if (p.refundStatus === 'success') {
                      return rSum + (p.refundAmount || 0);
                    }
                    return rSum;
                  }, 0);
                }
                
                if (refunded > 0) {
                  return (
                    <div className="text-sm text-red-600 mt-1">
                      Refunded: {formatCurrency(refunded)}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>

        {/* Trek Information */}
        {trekData && (
          <div className="bg-emerald-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <FaMapMarkerAlt className="mr-2 text-emerald-600" />
              Trek Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Trek Name</p>
                <p className="font-medium text-gray-900">{trekData.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium text-gray-900 flex items-center">
                  <FaClock className="mr-1" />
                  {trekData.duration} days
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Difficulty</p>
                <p className="font-medium text-gray-900 capitalize">{trekData.difficulty}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium text-gray-900">{trekData.location}</p>
              </div>
            </div>
          </div>
        )}

        {/* User Information */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <FaUser className="mr-2 text-blue-600" />
            User Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium text-gray-900">{booking.user.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900 flex items-center">
                <FaEnvelope className="mr-1" />
                {booking.user.email}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium text-gray-900 flex items-center">
                <FaPhone className="mr-1" />
                {booking.user.phone}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Number of Participants</p>
              <p className="font-medium text-gray-900 flex items-center">
                <FaUsers className="mr-1" />
                {booking.participants}
              </p>
            </div>
          </div>
        </div>

        {/* Participant Details */}
        {booking.participantDetails && booking.participantDetails.length > 0 && (
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <FaUsers className="mr-2 text-purple-600" />
              Participant Details
            </h3>
            <div className="space-y-3">
              {booking.participantDetails.map((participant, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-purple-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{participant.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{participant.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{participant.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Remarks */}
        {booking.adminRemarks && (
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <FaStar className="mr-2 text-yellow-600" />
              Admin Remarks
            </h3>
            <p className="text-gray-700 bg-white p-3 rounded border border-yellow-200">
              {booking.adminRemarks}
            </p>
          </div>
        )}

        {/* Payment Information */}
        <div className="bg-indigo-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <FaMoneyBillWave className="mr-2 text-indigo-600" />
            Payment Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Payment Status</p>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                booking.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {booking.paymentStatus || 'Not specified'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-medium text-gray-900">{booking.paymentMethod || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewBookingModal; 