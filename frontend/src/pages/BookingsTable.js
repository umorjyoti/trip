import React from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

function BookingsTable({ bookings, loading, error, openCancelModal, cancelModal, closeCancelModal, handleCancelBooking, cancelLoading, calculateRefund, onSendPartialReminder, onMarkPartialComplete }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Booking ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trek
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Participants
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Mode
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Price (INR)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <tr key={booking._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking._id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.trek?.name || 'Unknown Trek'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {booking.user?.name || 'Unknown User'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.user?.email || 'No email'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.participants}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.paymentMode === 'partial' ? 'Partial' : 'Full'}
                    </div>
                    {booking.paymentMode === 'partial' && booking.partialPaymentDetails && (
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>₹{booking.partialPaymentDetails.initialAmount?.toFixed(2) || '0'} / ₹{booking.totalPrice?.toFixed(2) || '0'}</div>
                        {booking.status === 'payment_confirmed_partial' && (
                          <div className="text-orange-600 font-medium">Awaiting Final Payment</div>
                        )}
                        {booking.partialPaymentDetails.reminderSent && (
                          <div className="text-yellow-600 text-xs">Reminder Sent</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(() => {
                      const paid = booking.totalPrice;
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
                      
                      // Show partial payment details if applicable
                      if (booking.paymentMode === 'partial' && booking.partialPaymentDetails) {
                        const initialAmount = booking.partialPaymentDetails.initialAmount || 0;
                        const remainingAmount = booking.partialPaymentDetails.remainingAmount || 0;
                        
                        return (
                          <div>
                            <div className="font-medium text-emerald-600">₹{initialAmount.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">Total: ₹{paid.toFixed(2)}</div>
                            <div className="text-xs text-red-600 font-medium">Remaining: ₹{remainingAmount.toFixed(2)}</div>
                            {booking.partialPaymentDetails.finalPaymentDueDate && (
                              <div className="text-xs text-red-600">Due: {new Date(booking.partialPaymentDetails.finalPaymentDueDate).toLocaleDateString()}</div>
                            )}
                          </div>
                        );
                      }
                      
                      // Show refunded amount for any booking that has refunds, not just cancelled ones
                      if (refunded > 0) {
                        return (
                          <div>
                            <div className="font-medium">₹{paid}</div>
                            <div className="text-xs text-red-600">Refunded: ₹{refunded}</div>
                          </div>
                        );
                      }
                      return `₹${paid}`;
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      booking.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : booking.status === 'payment_confirmed_partial'
                        ? 'bg-orange-100 text-orange-800'
                        : booking.status === 'payment_completed'
                        ? 'bg-blue-100 text-blue-800'
                        : booking.status === 'pending_payment'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {booking.status}
                    </span>
                    {booking.paymentMode === 'partial' && booking.partialPaymentDetails && (
                      <div className="text-xs text-gray-600 mt-1 space-y-1">
                        {booking.status === 'payment_confirmed_partial' && (
                          <>
                            <div className="text-orange-600 font-medium">Partial Payment Confirmed</div>
                            {booking.partialPaymentDetails.finalPaymentDueDate && (
                              <div className="text-red-600">Due: {new Date(booking.partialPaymentDetails.finalPaymentDueDate).toLocaleDateString()}</div>
                            )}
                          </>
                        )}
                        {booking.status === 'confirmed' && booking.paymentMode === 'partial' && (
                          <div className="text-green-600 font-medium">Full Payment Complete</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/admin/bookings/${booking._id}`}
                      className="text-emerald-600 hover:text-emerald-900 mr-3"
                    >
                      View
                    </Link>
                    {booking.status !== 'cancelled' && (
                      <Link
                        to={`/admin/bookings/${booking._id}/edit`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </Link>
                    )}
                    
                    {/* Partial Payment Actions */}
                    {booking.status === 'payment_confirmed_partial' && booking.paymentMode === 'partial' && (
                      <>
                        {onSendPartialReminder && !booking.partialPaymentDetails?.reminderSent && (
                          <button
                            onClick={() => onSendPartialReminder(booking._id)}
                            className="text-yellow-600 hover:text-yellow-800 text-sm font-medium mr-3"
                            title="Send Partial Payment Reminder"
                          >
                            Send Reminder
                          </button>
                        )}
                        {onMarkPartialComplete && (
                          <button
                            onClick={() => onMarkPartialComplete(booking._id)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium mr-3"
                            title="Mark Partial Payment Complete"
                          >
                            Mark Complete
                          </button>
                        )}
                      </>
                    )}
                    
                    <button
                      onClick={() => openCancelModal(booking)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                      disabled={booking.status === 'cancelled'}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                  No bookings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cancel Modal */}
      {cancelModal && cancelModal.open && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Cancel Booking
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to cancel this booking? This action cannot be undone.<br/>
                      Refund to user: <span className="font-semibold">₹{calculateRefund(cancelModal.booking, cancelModal.refundType)}</span>
                    </p>
                    <div className="mt-4 flex justify-center gap-4">
                      <button
                        className={`px-3 py-1 rounded ${cancelModal.refundType === 'auto' ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}
                        onClick={() => cancelModal.setRefundType('auto')}
                        disabled={cancelLoading}
                      >
                        Auto Refund
                      </button>
                      <button
                        className={`px-3 py-1 rounded ${cancelModal.refundType === 'full' ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}
                        onClick={() => cancelModal.setRefundType('full')}
                        disabled={cancelLoading}
                      >
                        100% Refund
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                  onClick={handleCancelBooking}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? 'Processing...' : 'Cancel Booking & Refund'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={closeCancelModal}
                  disabled={cancelLoading}
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingsTable; 