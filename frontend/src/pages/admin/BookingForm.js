import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createBooking, updateBooking, getBookingById, getTreks, getUsers } from '../../services/api';

const BookingForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [treks, setTreks] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    userId: '',
    trekId: '',
    batchId: '',
    participants: [{ name: '', age: '', gender: '' }],
    status: 'pending',
    paymentStatus: 'pending',
    totalAmount: 0,
    notes: ''
  });

  useEffect(() => {
    fetchData();
    if (id) {
      fetchBooking();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      const [treksData, usersData] = await Promise.all([
        getTreks(),
        getUsers()
      ]);
      setTreks(treksData);
      setUsers(usersData);
    } catch (err) {
      setError('Failed to fetch required data');
    }
  };

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const booking = await getBookingById(id);
      setFormData(booking);
    } catch (err) {
      setError('Failed to fetch booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleParticipantChange = (index, field, value) => {
    const updatedParticipants = [...formData.participants];
    updatedParticipants[index] = {
      ...updatedParticipants[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      participants: updatedParticipants
    }));
  };

  const addParticipant = () => {
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, { name: '', age: '', gender: '' }]
    }));
  };

  const removeParticipant = (index) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (id) {
        await updateBooking(id, formData);
      } else {
        await createBooking(formData);
      }
      navigate('/admin/bookings');
    } catch (err) {
      setError('Failed to save booking');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {id ? 'Edit Booking' : 'Create New Booking'}
      </h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">User</label>
          <select
            name="userId"
            value={formData.userId}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            <option value="">Select User</option>
            {users.map(user => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Trek</label>
          <select
            name="trekId"
            value={formData.trekId}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            <option value="">Select Trek</option>
            {treks.map(trek => (
              <option key={trek._id} value={trek._id}>
                {trek.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            <option value="pending">Pending</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="payment_completed">Payment Completed</option>
            <option value="confirmed">Confirmed</option>
            <option value="trek_completed">Trek Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Payment Status</label>
          <select
            name="paymentStatus"
            value={formData.paymentStatus}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Total Amount</label>
          <input
            type="number"
            name="totalAmount"
            value={formData.totalAmount}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Participants</label>
          {formData.participants.map((participant, index) => (
            <div key={index} className="mt-2 grid grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Name"
                value={participant.name}
                onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                required
                className="rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
              <input
                type="number"
                placeholder="Age"
                value={participant.age}
                onChange={(e) => handleParticipantChange(index, 'age', e.target.value)}
                required
                className="rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
              <select
                value={participant.gender}
                onChange={(e) => handleParticipantChange(index, 'gender', e.target.value)}
                required
                className="rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeParticipant(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addParticipant}
            className="mt-2 text-emerald-600 hover:text-emerald-800"
          >
            Add Participant
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/bookings')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            {id ? 'Update' : 'Create'} Booking
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm; 