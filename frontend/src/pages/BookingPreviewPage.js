import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBookingById, getTrekById } from "../services/api";
import { FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaMoneyBillWave, FaUser, FaPhoneAlt, FaEnvelope, FaUserShield, FaPlusCircle } from 'react-icons/fa';

function BookingPreviewPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const data = await getBookingById(bookingId);
        setBooking(data);
      } catch (error) {
        console.error('Error fetching booking:', error);
        setBooking(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!booking) return <div className="p-8 text-red-600">Booking not found.</div>;

  const trek = booking.trek || {};
  const batchToShow = booking.batch || {};
  const participantList = booking.participantDetails || [];
  const numberOfParticipants = booking.participants || participantList.length || 0;

  // Helper for formatting currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Helper for formatting date
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  // Responsive sidebar for summary
  return (
    <div className="max-w-5xl mx-auto py-8 px-2 md:px-4 flex flex-col md:flex-row gap-8">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Stepper */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold">
            <span className="rounded-full bg-emerald-600 text-white w-8 h-8 flex items-center justify-center">1</span>
            <span>Details</span>
            <span className="mx-2">→</span>
            <span className="rounded-full bg-emerald-600 text-white w-8 h-8 flex items-center justify-center">2</span>
            <span>Review</span>
            <span className="mx-2">→</span>
            <span className="rounded-full bg-gray-200 text-gray-500 w-8 h-8 flex items-center justify-center">3</span>
            <span className="text-gray-500">Confirm</span>
          </div>
        </div>

        {/* Trek & Batch Card */}
        <div className="bg-white rounded-xl shadow p-6 border border-emerald-100">
          <div className="flex items-center gap-3 mb-2">
            <FaMapMarkerAlt className="text-emerald-500" />
            <span className="text-xl font-bold text-emerald-800">{trek.name}</span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <FaCalendarAlt className="text-emerald-500" />
            <span className="text-gray-700">{formatDate(batchToShow.startDate)} - {formatDate(batchToShow.endDate)}</span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <FaMoneyBillWave className="text-emerald-500" />
            <span className="text-gray-700">Price per Person: <span className="font-semibold">{formatCurrency(batchToShow.price)}</span></span>
          </div>
          <div className="flex items-center gap-3">
            <FaUsers className="text-emerald-500" />
            <span className="text-gray-700">Max Participants: <span className="font-semibold">{batchToShow.maxParticipants || '-'}</span></span>
          </div>
        </div>

        {/* Contact Card */}
        <div className="bg-white rounded-xl shadow p-6 border border-emerald-100">
          <div className="flex items-center gap-3 mb-2">
            <FaUser className="text-emerald-500" />
            <span className="text-lg font-semibold text-emerald-700">Contact Information</span>
          </div>
          <div className="ml-7 space-y-1">
            <div className="flex items-center gap-2"><FaUser className="text-gray-400" /><span>{booking.userDetails?.name || '-'}</span></div>
            <div className="flex items-center gap-2"><FaEnvelope className="text-gray-400" /><span>{booking.userDetails?.email || '-'}</span></div>
            <div className="flex items-center gap-2"><FaPhoneAlt className="text-gray-400" /><span>{booking.userDetails?.phone || '-'}</span></div>
          </div>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-xl shadow p-6 border border-emerald-100">
          <div className="flex items-center gap-3 mb-2">
            <FaUsers className="text-emerald-500" />
            <span className="text-lg font-semibold text-emerald-700">Booking Details</span>
          </div>
          <div className="ml-7 space-y-1">
            <div className="flex items-center gap-2"><FaUsers className="text-gray-400" /><span>Number of Participants: <strong>{numberOfParticipants}</strong></span></div>
            <div className="flex items-center gap-2"><FaMoneyBillWave className="text-gray-400" /><span>Total Price: <strong>{formatCurrency(booking.totalPrice)}</strong></span></div>
            <div className="flex items-center gap-2"><span className="text-gray-400">Status:</span><span className="capitalize font-semibold text-emerald-600">{booking.status}</span></div>
          </div>
        </div>

        {/* Add-ons Card */}
        <div className="bg-white rounded-xl shadow p-6 border border-emerald-100">
          <div className="flex items-center gap-3 mb-2">
            <FaPlusCircle className="text-emerald-500" />
            <span className="text-lg font-semibold text-emerald-700">Add-ons</span>
          </div>
          <div className="ml-7 text-gray-700">
            {booking.addOns && booking.addOns.length > 0 ? (
              <ul className="list-disc ml-4">
                {booking.addOns.map((addOn, idx) => (
                  <li key={idx}>{addOn.name} - ₹{addOn.price}</li>
                ))}
              </ul>
            ) : (
              <span>None</span>
            )}
          </div>
        </div>

        {/* Participants Card */}
        <div className="bg-white rounded-xl shadow p-6 border border-emerald-100">
          <div className="flex items-center gap-3 mb-2">
            <FaUsers className="text-emerald-500" />
            <span className="text-lg font-semibold text-emerald-700">Participants ({participantList.length})</span>
          </div>
          {participantList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {participantList.map?.((p, idx) => (
                <div key={idx} className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                  <div className="font-semibold text-emerald-800 mb-1">Participant {idx + 1}</div>
                  <div className="text-sm text-gray-700"><strong>Name:</strong> {p.name || '-'}</div>
                  <div className="text-sm text-gray-700"><strong>Email:</strong> {p.email || '-'}</div>
                  <div className="text-sm text-gray-700"><strong>Phone:</strong> {p.phone || '-'}</div>
                  <div className="text-sm text-gray-700"><strong>Age:</strong> {p.age || '-'}</div>
                  <div className="text-sm text-gray-700"><strong>Gender:</strong> {p.gender || '-'}</div>
                  {p._id && <div className="text-sm text-gray-700"><strong>ID:</strong> {p._id}</div>}
                  {p.allergies && <div className="text-sm text-gray-700"><strong>Allergies:</strong> {p.allergies}</div>}
                  {p.extraComment && <div className="text-sm text-gray-700"><strong>Extra Comment:</strong> {p.extraComment}</div>}
                  {Array.isArray(p.customFieldResponses) && p.customFieldResponses.length > 0 && (
                    <div className="text-sm text-gray-700 mt-2">
                      <strong>Custom Field Responses:</strong>
                      <ul className="list-disc ml-5">
                        {p.customFieldResponses.map((resp, rIdx) => (
                          <li key={rIdx}>
                            {resp.fieldName ? <>{resp.fieldName}: </> : null}{resp.value !== undefined ? resp.value.toString() : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="ml-7 text-gray-500 italic">No participant details available</div>
          )}
        </div>
      </div>

      {/* Sidebar Summary (sticky on desktop, bottom on mobile) */}
      <div className="md:w-80 w-full md:sticky md:top-24 flex-shrink-0">
        <div className="bg-emerald-700 text-white rounded-2xl shadow-xl p-6 flex flex-col gap-4 sticky bottom-0 md:static">
          <div className="flex items-center gap-3 mb-2">
            <FaMoneyBillWave className="text-2xl" />
            <span className="text-xl font-bold">Total Price</span>
          </div>
          <div className="text-3xl font-extrabold text-center">{formatCurrency(booking.totalPrice)}</div>
          <button
            className="mt-4 bg-white text-emerald-700 font-bold text-lg py-3 rounded-xl shadow hover:bg-emerald-50 transition-all duration-200 border border-emerald-200"
            onClick={() => navigate(`/booking-detail/${booking._id}`)}
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingPreviewPage; 