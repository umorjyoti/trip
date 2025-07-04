import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTreks, deleteTrek, toggleTrekStatus, getAllTreksWithCustomToggle, sendCustomTrekLink } from '../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { PlusIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { FaEye, FaEyeSlash, FaEdit, FaTrash, FaChartLine } from 'react-icons/fa';

function AdminTrekList() {
  const [treks, setTreks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [trekToDelete, setTrekToDelete] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'enabled', 'disabled', 'with-bookings', 'most-booked'
  const [expandedTreks, setExpandedTreks] = useState(new Set());
  const [showCustomTreks, setShowCustomTreks] = useState(false);
  const [emailInputs, setEmailInputs] = useState({}); // { [trekId]: email }
  const [showEmailInput, setShowEmailInput] = useState({}); // { [trekId]: boolean }
  const [sending, setSending] = useState({}); // { [trekId]: boolean }

  useEffect(() => {
    fetchTreks();
  }, [showCustomTreks]);

  const fetchTreks = async () => {
    try {
      setLoading(true);
      const data = await getAllTreksWithCustomToggle(showCustomTreks);
      setTreks(data);
    } catch (err) {
      console.error('Error fetching treks:', err);
      setError('Failed to load treks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const response = await toggleTrekStatus(id, !currentStatus);
      setTreks(prevTreks => 
        prevTreks.map(trek => 
          trek._id === id ? { ...trek, isEnabled: !currentStatus } : trek
        )
      );
      toast.success(`Trek ${!currentStatus ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      console.error('Error toggling trek status:', error);
      toast.error('Failed to update trek status');
    }
  };

  const openDeleteModal = (trek) => {
    setTrekToDelete(trek);
    setDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setDeleteModal(false);
    setTrekToDelete(null);
  };

  const handleDeleteTrek = async () => {
    if (!trekToDelete) return;
    
    try {
      await deleteTrek(trekToDelete._id);
      setTreks(treks.filter(trek => trek._id !== trekToDelete._id));
      toast.success('Trek deleted successfully!');
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting trek:', error);
      toast.error('Failed to delete trek');
    }
  };

  const getFilteredAndSortedTreks = () => {
    let filteredTreks = [...treks];

    // Hide custom treks unless showCustomTreks is true
    if (!showCustomTreks) {
      filteredTreks = filteredTreks.filter(trek => !trek.isCustom);
    }

    // Apply filters
    switch (filterStatus) {
      case 'enabled':
        filteredTreks = filteredTreks.filter(trek => trek.isEnabled);
        break;
      case 'disabled':
        filteredTreks = filteredTreks.filter(trek => !trek.isEnabled);
        break;
      case 'with-bookings':
        filteredTreks = filteredTreks.filter(trek => trek.bookings && trek.bookings.length > 0);
        break;
      case 'most-booked':
        filteredTreks = filteredTreks.filter(trek => trek.bookings && trek.bookings.length > 0)
          .sort((a, b) => (b.bookings?.length || 0) - (a.bookings?.length || 0));
        break;
      default:
        // 'all' case - no filtering needed
        break;
    }

    return filteredTreks;
  };

  const toggleTrekExpansion = (trekId) => {
    setExpandedTreks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trekId)) {
        newSet.delete(trekId);
      } else {
        newSet.add(trekId);
      }
      return newSet;
    });
  };

  // Helper to get custom trek link
  const getCustomTrekLink = (trek) => {
    const frontendUrl = process.env.REACT_APP_FRONTEND_URL || window.location.origin;
    return `${frontendUrl}/custom-trek/${trek._id}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  console.log("trek",treks)

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Manage Treks</h1>
        <div className="flex items-center space-x-4">
          {/* Custom Trek Toggle */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Show:</label>
            <button
              onClick={() => setShowCustomTreks(false)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                !showCustomTreks
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Regular Treks
            </button>
            <button
              onClick={() => setShowCustomTreks(true)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                showCustomTreks
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Custom Treks
            </button>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
          >
            <option value="all">All Treks</option>
            <option value="enabled">Enabled Treks</option>
            <option value="disabled">Disabled Treks</option>
            <option value="with-bookings">Treks with Bookings</option>
            <option value="most-booked">Most Booked Treks</option>
          </select>
          <Link
            to="/admin/treks/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add New Trek
          </Link>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {getFilteredAndSortedTreks().length > 0 ? (
            getFilteredAndSortedTreks().map((trek) => (
              <li key={trek._id} className={`${!trek.isEnabled ? 'bg-gray-50' : ''}`}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <img 
                          className={`h-12 w-12 rounded-md object-cover ${!trek.isEnabled ? 'opacity-50' : ''}`}
                          src={trek.images && trek.images.length > 0 ? trek.images[0] : 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'} 
                          alt={trek.name} 
                        />
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm font-medium ${!trek.isEnabled ? 'text-gray-500' : 'text-gray-900'}`}>
                          {trek.name}
                          {trek.isCustom && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              Custom
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {trek.region} • {trek.difficulty} • {trek.duration} days
                          {trek.bookings && trek.bookings.length > 0 && (
                            <span className="ml-2 text-emerald-600">
                              • {trek.bookings.length} {trek.bookings.length === 1 ? 'booking' : 'bookings'}
                            </span>
                          )}
                          {trek.isCustom && trek.customLinkExpiry && (
                            <span className="ml-2 text-orange-600">
                              • Expires {new Date(trek.customLinkExpiry).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleTrekExpansion(trek._id)}
                        className="p-2 rounded-full hover:bg-gray-100"
                        title="Show Batches"
                      >
                        <ChevronDownIcon 
                          className={`w-5 h-5 transform transition-transform ${expandedTreks.has(trek._id) ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <Link
                        to={`/admin/treks/${trek._id}/performance`}
                        className="p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                        title="View Performance"
                      >
                        <FaChartLine className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(trek._id, trek.isEnabled)}
                        className={`p-2 rounded-full ${
                          trek.isEnabled
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                        title={trek.isEnabled ? 'Disable Trek' : 'Enable Trek'}
                      >
                        {trek.isEnabled ? <FaEye className="w-4 h-4" /> : <FaEyeSlash className="w-4 h-4" />}
                      </button>
                      <Link
                        to={`/admin/treks/edit/${trek._id}`}
                        className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                      >
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => openDeleteModal(trek)}
                        className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                      >
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Batch Information */}
                  {expandedTreks.has(trek._id) && (
                    <div className="mt-4 border-t pt-4">
                      <div className="space-y-4">
                        {trek.batches && trek.batches.length > 0 ? (
                          trek.batches.map((batch) => (
                            <div 
                              key={batch._id} 
                              className="bg-gray-50 p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                              onClick={() => {
                                window.location.href = `/admin/treks/${trek._id}/performance?batchId=${batch._id}`;
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900">
                                    Batch {new Date(batch.startDate).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })} - {new Date(batch.endDate).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </h4>
                                  <div className="mt-1 text-sm text-gray-500">
                                    <p>Price: ₹{batch.price}</p>
                                    <p>Total Slots: {batch.maxParticipants}</p>
                                    <p>Available Slots: {batch.maxParticipants - (batch.currentParticipants || 0)}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {batch.currentParticipants || 0} Bookings
                                  </span>
                                </div>
                              </div>
                              {batch.bookings && batch.bookings.length > 0 && (
                                <div className="mt-3">
                                  <h5 className="text-sm font-medium text-gray-900 mb-2">Recent Bookings</h5>
                                  <div className="space-y-2">
                                    {batch.bookings.slice(0, 3).map((booking) => (
                                      <div key={booking._id} className="flex justify-between text-sm">
                                        <span>{booking.customerName}</span>
                                        <span>{new Date(booking.bookingDate).toLocaleDateString('en-GB', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric'
                                        })}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-gray-500 py-4">
                            No batches available for this trek
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Custom Trek Link and Email Buttons */}
                  {trek.isCustom && (
                    <div className="mt-2 flex flex-col md:flex-row md:items-center gap-2">
                      {/* Copy Link Button */}
                      <button
                        className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 text-xs font-medium"
                        onClick={() => {
                          navigator.clipboard.writeText(getCustomTrekLink(trek));
                          toast.success('Custom trek link copied!');
                        }}
                      >
                        Copy Link
                      </button>
                      {/* Share via Email Button */}
                      <button
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-medium"
                        onClick={() => setShowEmailInput(prev => ({ ...prev, [trek._id]: !prev[trek._id] }))}
                      >
                        Share via Email
                      </button>
                      {/* Email Input and Send Button */}
                      {showEmailInput[trek._id] && (
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mt-2">
                          <input
                            type="email"
                            placeholder="Enter email address"
                            className="border px-2 py-1 rounded text-sm"
                            value={emailInputs[trek._id] || ''}
                            onChange={e => setEmailInputs(prev => ({ ...prev, [trek._id]: e.target.value }))}
                            disabled={sending[trek._id]}
                            style={{ minWidth: 220 }}
                          />
                          <button
                            className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-xs font-medium"
                            disabled={sending[trek._id]}
                            onClick={async () => {
                              const email = emailInputs[trek._id];
                              if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                                toast.error('Please enter a valid email address.');
                                return;
                              }
                              setSending(prev => ({ ...prev, [trek._id]: true }));
                              try {
                                await sendCustomTrekLink(trek._id, email);
                                toast.success('Custom trek link sent!');
                                setShowEmailInput(prev => ({ ...prev, [trek._id]: false }));
                                setEmailInputs(prev => ({ ...prev, [trek._id]: '' }));
                              } catch (err) {
                                toast.error('Failed to send email.');
                              } finally {
                                setSending(prev => ({ ...prev, [trek._id]: false }));
                              }
                            }}
                          >
                            {sending[trek._id] ? 'Sending...' : 'Send'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-5 sm:px-6">
              <div className="text-center text-gray-500">
                No treks found. Click "Add New Trek" to create one.
              </div>
            </li>
          )}
        </ul>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Trek</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete "{trekToDelete?.name}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteTrek}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTrekList; 