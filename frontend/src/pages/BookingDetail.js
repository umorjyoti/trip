import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { getBookingById, cancelParticipant, cancelBooking } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import CreateTicketModal from '../components/CreateTicketModal';

function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const paymentStatus = location.state?.paymentStatus;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const data = await getBookingById(id);
        console.log('Booking data:', data);
        
        if (!data) {
          throw new Error('Booking not found');
        }
        
        // Ensure all required fields are present
        const bookingData = {
          ...data,
          trek: data.trek || {},
          batch: data.batch || {},
          participants: data.participants || 0,
          totalPrice: data.totalPrice || 0,
          status: data.status || 'unknown',
          createdAt: data.createdAt || new Date(),
          cancelledAt: data.cancelledAt || null,
          participantDetails: Array.isArray(data.participantDetails) ? data.participantDetails : []
        };
        
        setBooking(bookingData);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError(err.response?.data?.message || 'Failed to load booking details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const openCancelModal = (participant = null) => {
    setSelectedParticipant(participant);
    setCancelModal(true);
  };

  const closeCancelModal = () => {
    setSelectedParticipant(null);
    setCancelModal(false);
  };

  const handleCancelBooking = async () => {
    try {
      if (selectedParticipant) {
        // Cancel individual participant
        await cancelParticipant(id, selectedParticipant._id);
        toast.success('Participant cancelled successfully');
        // Update the booking state
        setBooking(prev => ({
          ...prev,
          participantDetails: prev.participantDetails.filter(p => p._id !== selectedParticipant._id),
          participants: prev.participants - 1
        }));
      }
      closeCancelModal();
    } catch (error) {
      console.error('Error cancelling:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateTicket = () => {
    setShowTicketModal(true);
  };

  // Cancel a single participant
  const handleCancelParticipant = async (participant) => {
    if (!window.confirm(`Are you sure you want to cancel ${participant.name}?`)) return;
    setCancelling(true);
    try {
      await cancelParticipant(id, participant._id, { reason: 'User requested cancellation' });
      toast.success('Participant cancelled successfully');
      const updatedBooking = await getBookingById(id);
      setBooking(updatedBooking);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel participant');
    } finally {
      setCancelling(false);
    }
  };

  // Cancel the entire booking
  const handleCancelEntireBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel the entire booking?')) return;
    setCancelling(true);
    try {
      await cancelBooking(id, { reason: 'User requested full cancellation' });
      toast.success('Booking cancelled successfully');
      const updatedBooking = await getBookingById(id);
      setBooking(updatedBooking);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">Booking not found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ParticipantList = ({ participants }) => {
    return (
      <div className="space-y-4">
        {participants.map((participant) => (
          <div key={participant._id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
            <div>
              <h4 className="font-medium">{participant.name}</h4>
              <p className="text-sm text-gray-600">Age: {participant.age}</p>
              <p className="text-sm text-gray-600">Gender: {participant.gender}</p>
              <div className="text-xs text-gray-500">Status: {participant.status || (participant.isCancelled ? 'bookingCancelled' : 'confirmed')}</div>
            </div>
            {participant.status === 'confirmed' && (
              <button
                className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50"
                onClick={() => handleCancelParticipant(participant)}
                disabled={cancelling}
              >
                Cancel
              </button>
            )}
            {participant.status === 'bookingCancelled' && (
              <span className="text-xs text-red-500">Cancelled</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Payment Status Alert */}
      {paymentStatus === 'success' && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">Payment completed successfully!</p>
            </div>
          </div>
        </div>
      )}
      {paymentStatus === 'failure' && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">Payment failed. Please try again or contact support.</p>
            </div>
          </div>
        </div>
      )}
      <div className="mb-8">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <div>
                <Link to="/" className="text-gray-400 hover:text-gray-500">
                  <svg className="flex-shrink-0 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  <span className="sr-only">Home</span>
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
                <Link to="/bookings" className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">My Bookings</Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
                <span className="ml-4 text-sm font-medium text-gray-500">Booking Details</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Booking Details */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Booking Details</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Booking ID: {booking._id}
              </p>
            </div>
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(booking.status)}`}>
              {booking.status}
            </span>
          </div>
          
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Trek</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {booking.trek && (
                    <Link to={`/treks/${booking.trek._id}`} className="text-emerald-600 hover:text-emerald-900">
                      {booking.trek.name}
                    </Link>
                  )}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Booking Date</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(booking.createdAt)}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Batch Information</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {booking.batch && (
                    <>
                      {booking.batch.name && <div><strong>Name:</strong> {booking.batch.name}</div>}
                      <div><strong>Start Date:</strong> {booking.batch.startDate ? formatDate(booking.batch.startDate) : 'N/A'}</div>
                      <div><strong>End Date:</strong> {booking.batch.endDate ? formatDate(booking.batch.endDate) : 'N/A'}</div>
                      {booking.batch.price && <div><strong>Price:</strong> ₹{booking.batch.price}</div>}
                    </>
                  )}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Number of Participants</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{booking.participants || 0}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Total Amount (INR)</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">₹{booking.totalPrice?.toFixed(2) || '0.00'}</dd>
              </div>
              {booking.status === 'cancelled' && booking.cancelledAt && (
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Cancelled Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(booking.cancelledAt)}</dd>
                </div>
              )}
              {booking.status === 'cancelled' && (
                <>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Refund Status</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {booking.refundStatus && booking.refundStatus !== 'not_applicable' ? (
                        <>
                          <span className="capitalize">{booking.refundStatus}</span>
                          {booking.refundAmount > 0 && (
                            <span> &mdash; Amount: <span className="font-semibold">₹{booking.refundAmount}</span></span>
                          )}
                          {booking.refundDate && (
                            <span> &mdash; Date: {formatDate(booking.refundDate)}</span>
                          )}
                        </>
                      ) : (
                        <span>No refund</span>
                      )}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </div>
        </div>

        {/* Participants Details */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Participants</h3>
          </div>
          <div className="border-t border-gray-200">
            <div className="divide-y divide-gray-200">
              <ParticipantList participants={booking.participantDetails} />
            </div>
          </div>
          {/* Full booking cancel button */}
          {booking.participantDetails.some(p => (p.status || (p.isCancelled ? 'bookingCancelled' : 'confirmed')) === 'confirmed') && (
            <button
              className="mt-4 px-4 py-2 bg-red-700 text-white rounded disabled:opacity-50"
              onClick={handleCancelEntireBooking}
              disabled={cancelling}
            >
              Cancel Entire Booking
            </button>
          )}
        </div>
      </div>

      {booking.status !== 'cancelled' && (
        <div className="mt-6 space-x-4">
          <button
            type="button"
            onClick={handleCreateTicket}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Need Help? Create Support Ticket
          </button>
        </div>
      )}

      {cancelModal && selectedParticipant && (
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
                    Cancel Participant
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to cancel {selectedParticipant.name}'s participation? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                  onClick={handleCancelBooking}
                >
                  Cancel Participant
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={closeCancelModal}
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTicketModal && (
        <CreateTicketModal
          bookingId={booking._id}
          onClose={() => setShowTicketModal(false)}
          onSuccess={() => {
            toast.success('Support ticket created successfully');
          }}
        />
      )}
    </div>
  );
}

export default BookingDetail; 