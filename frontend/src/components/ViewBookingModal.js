import React from 'react';
import Modal from './Modal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { FaUser, FaEnvelope, FaPhone, FaCalendar, FaMoneyBillWave, FaUsers, FaMapMarkerAlt, FaClock, FaStar, FaTimesCircle, FaCalculator } from 'react-icons/fa';

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
              <p className="font-medium text-gray-900">{booking.id || booking._id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Booking Date</p>
              <p className="font-medium text-gray-900">{formatDate(booking.bookingDate || booking.createdAt)}</p>
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
                {booking.participants || booking.numberOfParticipants}
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
                <div key={index} className={`bg-white rounded-lg p-3 border ${
                  participant.isCancelled ? 'border-red-200 bg-red-50' : 'border-purple-200'
                }`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className={`font-medium ${
                        participant.isCancelled ? 'line-through text-gray-400' : 'text-gray-900'
                      }`}>
                        {participant.name}
                        {participant.isCancelled && (
                          <span className="ml-2 text-xs text-red-500 font-normal">(Cancelled)</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className={`font-medium ${
                        participant.isCancelled ? 'line-through text-gray-400' : 'text-gray-900'
                      }`}>
                        {participant.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className={`font-medium ${
                        participant.isCancelled ? 'line-through text-gray-400' : 'text-gray-900'
                      }`}>
                        {participant.email}
                      </p>
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
            <p className="text-gray-700 bg-white p-3 rounded border border-yellow-200 mb-3">
              {booking.adminRemarks}
            </p>
            
            {/* Show remarks history if available */}
            {booking.remarksHistory && booking.remarksHistory.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Remarks History:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {[...booking.remarksHistory].reverse().map((entry, index) => (
                    <div key={index} className="bg-white rounded p-2 border border-yellow-200 text-xs">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-gray-900">
                          {entry.addedByUsername}
                        </span>
                        <span className="text-gray-500">
                          {new Date(entry.addedAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-gray-700">{entry.remarks}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cancellation Details - Only show if booking is cancelled */}
        {booking.status === 'cancelled' && (
          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <FaTimesCircle className="mr-2 text-red-600" />
              Cancellation Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Cancellation Date</p>
                <p className="font-medium text-gray-900">
                  {booking.cancelledAt ? formatDate(booking.cancelledAt) : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cancellation Reason</p>
                <p className="font-medium text-gray-900">
                  {booking.cancellationReason || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Refund Status</p>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  booking.refundStatus === 'success' ? 'bg-green-100 text-green-800' :
                  booking.refundStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  booking.refundStatus === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {booking.refundStatus || 'Not applicable'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Refund Date</p>
                <p className="font-medium text-gray-900">
                  {booking.refundDate ? formatDate(booking.refundDate) : 'Not applicable'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Refund Amount</p>
                <div className="font-medium text-lg text-emerald-600 flex items-center">
                  <FaCalculator className="mr-1" />
                  {booking.refundStatus === 'success' ? formatCurrency(booking.refundAmount || 0) :
                   booking.refundStatus === 'failed' ? 'Refund Failed' :
                   booking.refundStatus === 'processing' ? 'Processing...' :
                   formatCurrency(booking.refundAmount || 0)}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Refund Type</p>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  booking.refundStatus === 'failed' ? 'bg-red-100 text-red-800' :
                  booking.refundStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  booking.refundAmount === booking.totalPrice ? 'bg-blue-100 text-blue-800' :
                  booking.refundAmount > 0 ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {booking.refundStatus === 'failed' ? 'Refund Failed' :
                   booking.refundStatus === 'processing' ? 'Processing Refund' :
                   booking.refundAmount === booking.totalPrice ? 'Full Refund (100%)' :
                   booking.refundAmount > 0 ? 'Partial Refund (Policy-based)' :
                   'No Refund (Policy-based)'}
                </span>
              </div>
            </div>
            
            {/* Additional refund information for participant-level cancellations */}
            {booking.participantDetails && booking.participantDetails.some(p => p.refundStatus === 'success') && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm font-medium text-orange-800 mb-2">Participant-Level Refunds:</p>
                <div className="space-y-2">
                  {booking.participantDetails
                    .filter(p => p.refundStatus === 'success')
                    .map((participant, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">{participant.name}</span>
                        <span className="font-medium text-emerald-600">
                          {formatCurrency(participant.refundAmount || 0)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
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
              <p className="text-sm text-gray-500">Payment Mode</p>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                booking.paymentMode === 'partial' ? 'bg-orange-100 text-orange-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {booking.paymentMode === 'partial' ? 'Partial Payment' : 'Full Payment'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Status</p>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                booking.status === 'payment_confirmed_partial' ? 'bg-orange-100 text-orange-800' :
                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {booking.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="font-medium text-gray-900">{formatCurrency(booking.totalPrice)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Amount Paid</p>
              <p className="font-medium text-lg text-emerald-600">
                {formatCurrency(booking.amountPaid || booking.totalPrice)}
              </p>
            </div>
            
            {/* Partial Payment Details */}
            {booking.paymentMode === 'partial' && booking.partialPaymentDetails && (
              <>
                <div>
                  <p className="text-sm text-gray-500">Initial Payment</p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(booking.partialPaymentDetails.initialAmount || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Remaining Balance</p>
                  <p className="font-medium text-orange-600">
                    {formatCurrency(booking.partialPaymentDetails.remainingAmount || 0)}
                  </p>
                </div>
                {booking.partialPaymentDetails.finalPaymentDueDate && (
                  <div>
                    <p className="text-sm text-gray-500">Final Payment Due Date</p>
                    <p className="font-medium text-red-600">
                      {formatDate(booking.partialPaymentDetails.finalPaymentDueDate)}
                    </p>
                  </div>
                )}
                {booking.partialPaymentDetails.finalPaymentDate && (
                  <div>
                    <p className="text-sm text-gray-500">Final Payment Date</p>
                    <p className="font-medium text-green-600">
                      {formatDate(booking.partialPaymentDetails.finalPaymentDate)}
                    </p>
                  </div>
                )}
              </>
            )}
            
            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-medium text-gray-900">{booking.paymentMethod || 'Not specified'}</p>
            </div>
          </div>
          
          {/* Refund Information */}
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
                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600 font-medium">Refunded Amount: {formatCurrency(refunded)}</p>
                </div>
              );
            }
            return null;
          })()}
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