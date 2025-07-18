import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getBookingById,
  cancelParticipant,
  restoreParticipant,
  adminCancelBooking,
  downloadInvoice,
} from "../services/api";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";
import AdminLayout from "../components/AdminLayout";
import ParticipantList from "../components/ParticipantList";
import {
  FaCalendarAlt,
  FaUsers,
  FaMoneyBillWave,
  FaMapMarkerAlt,
  FaUserFriends,
  FaPhoneAlt,
  FaEnvelope,
  FaHome,
  FaUser,
  FaExclamationTriangle,
  FaTrash,
  FaUndo,
  FaDownload,
} from "react-icons/fa";

function BookingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [refundType, setRefundType] = useState('auto');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const data = await getBookingById(id);
      // Ensure participantDetails is always an array
      const bookingData = {
        ...data,
        participantDetails: data.participantDetails || []
      };
      setBooking(bookingData);
    } catch (err) {
      console.error("Error fetching booking:", err);
      setError("Failed to load booking details");
      toast.error("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelParticipant = async (participantId) => {
    try {
      await cancelParticipant(id, participantId);
      toast.success("Participant cancelled successfully");
      fetchBooking(); // Refresh the booking data
    } catch (err) {
      console.error("Error cancelling participant:", err);
      toast.error(err.message || "Failed to cancel participant");
    }
  };

  const handleRestoreParticipant = async (participantId) => {
    try {
      await restoreParticipant(id, participantId);
      toast.success("Participant restored successfully");
      fetchBooking(); // Refresh the booking data
    } catch (err) {
      console.error("Error restoring participant:", err);
      toast.error(err.message || "Failed to restore participant");
    }
  };

  const calculateRefund = (booking, refundType = 'auto') => {
    if (!booking) return 0;
    const start = new Date(booking.batch?.startDate);
    const now = new Date();
    const total = booking.totalPrice;
    if (refundType === 'full') return total;
    const diffDays = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
    if (diffDays > 7) return Math.round(total * 0.9);
    if (diffDays >= 3) return Math.round(total * 0.5);
    return 0;
  };

  const handleCancelBooking = async () => {
    setCancelLoading(true);
    try {
      await adminCancelBooking({
        bookingId: booking._id,
        refund: true,
        refundType,
        reason: 'Admin cancelled booking',
      });
      toast.success('Booking cancelled and refund processed');
      setShowCancelModal(false);
      fetchBooking();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel booking');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      await downloadInvoice(booking._id);
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice. Please try again.');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FaExclamationTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {error || "Booking not found"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
          <div className="flex space-x-3">
            <button
              onClick={handleDownloadInvoice}
              disabled={downloadingInvoice}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {downloadingInvoice ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <FaDownload className="mr-2 -ml-1 h-4 w-4" />
              )}
              {downloadingInvoice ? 'Downloading...' : 'Download Invoice'}
            </button>
            <button
              onClick={() => navigate(`/admin/bookings/${id}/edit`)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Edit Booking
            </button>
            <button
              onClick={() => navigate("/admin/bookings")}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Bookings
            </button>
            <button
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              disabled={booking.status === 'cancelled'}
            >
              Cancel Booking
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Booking Information
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Details and participant information
          </p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Trek</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {booking.trek?.name || "Unknown Trek"}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Booking ID</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {booking._id}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    booking.status === "confirmed"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {booking.status}
                </span>
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Price</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="font-medium">₹{booking.totalPrice}</div>
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
                        Refunded: ₹{refunded}
                      </div>
                    );
                  }
                  return null;
                })()}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Number of Participants
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {booking.participants}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Booking Date
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(booking.createdAt).toLocaleDateString()}
              </dd>
            </div>
            {booking.specialRequirements && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Special Requirements
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {booking.specialRequirements}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Participants</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              <div className="border-t border-gray-200">
                <div className="divide-y divide-gray-200">
                  <ParticipantList 
                    participants={booking?.participantDetails || []} 
                    onCancelParticipant={handleCancelParticipant}
                    onRestoreParticipant={handleRestoreParticipant}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <FaTrash className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Cancel Booking
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to cancel this booking? This action cannot be undone.<br/>
                      Refund to user: <span className="font-semibold">₹{calculateRefund(booking, refundType)}</span>
                    </p>
                    <div className="mt-4 flex justify-center gap-4">
                      <button
                        className={`px-3 py-1 rounded ${refundType === 'auto' ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}
                        onClick={() => setRefundType('auto')}
                        disabled={cancelLoading}
                      >
                        Auto Refund
                      </button>
                      <button
                        className={`px-3 py-1 rounded ${refundType === 'full' ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}
                        onClick={() => setRefundType('full')}
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
                  onClick={() => setShowCancelModal(false)}
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

export default BookingDetailsPage;
