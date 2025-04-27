import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBookings } from '../../services/api';
import { formatDate } from '../../utils/helpers';

const BookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await getBookings();
      setBookings(data);
    } catch (err) {
      setError('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = filters.status === 'all' || booking.status === filters.status;
    const matchesSearch = booking.bookingId.toLowerCase().includes(filters.search.toLowerCase()) ||
                         booking.user.name.toLowerCase().includes(filters.search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bookings</h1>
        <div className="flex space-x-4">
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search bookings..."
            className="px-4 py-2 border rounded-md"
          />
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredBookings.map(booking => (
            <li key={booking._id}>
              <Link to={`/admin/bookings/${booking._id}`} className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-emerald-600 truncate">
                        Booking #{booking.bookingId}
                      </p>
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="text-sm text-gray-500">
                        {formatDate(booking.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {booking.user.name}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        {booking.trek.name}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        ₹{booking.totalAmount}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BookingList; 