import axios from 'axios';

// Remove accidental wrapping quotes that sometimes appear when an env variable
// is defined like REACT_APP_API_URL="https://example.com/api" (the quotes end
// up being part of the final bundled string).
let API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
if (API_URL) {
  API_URL = API_URL.replace(/^['"](.*)['"]$/, '$1');
}
console.log('Environment:', process.env.NODE_ENV);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('Final API_URL:', API_URL);

// Create axios instance with base URL and credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});


//test push
// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication APIs
export const register = async (userData) => {
  try {
    console.log('API service sending registration data:', userData);
    
    // Ensure username is not null or undefined
    if (!userData.username) {
      throw new Error('Username is required');
    }
    
    // Use the correct API endpoint
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('API service registration error:', error);
    throw error;
  }
};

export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  
  // Set the Authorization header with the token from the response
  if (response.data.token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
  }
  
  return response.data;
};

export const logout = async () => {
  try {
    const response = await api.post('/auth/logout');
    
    // Clear the Authorization header after logout
    api.defaults.headers.common['Authorization'] = '';
    
    // Clear any cookies by setting them to expire
    document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    return response.data;
  } catch (error) {
    console.error('Logout API error:', error);
    // Even if the API call fails, we should still clear local state
    api.defaults.headers.common['Authorization'] = '';
    document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    throw error;
  }
};

// Forgot password
export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    console.error('Forgot password API error:', error);
    throw error;
  }
};

// Reset password
export const resetPassword = async (token, password) => {
  try {
    const response = await api.post('/auth/reset-password', { token, password });
    
    // Set the Authorization header with the token from the response
    if (response.data.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    }
    
    return response.data;
  } catch (error) {
    console.error('Reset password API error:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    console.log('API Response from /auth/me:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    throw error;
  }
};

export const updateUserProfile = async (userData) => {
  const response = await api.put('/auth/profile', userData);
  return response.data;
};

// Trek APIs
export const getTreks = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/treks${queryString ? `?${queryString}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching treks:', error);
    throw error;
  }
};

export const getTrekById = async (id) => {
  const response = await api.get(`/treks/${id}`);
  return response.data;
};

export const getTrekByIdForAdmin = async (id) => {
  const response = await api.get(`/treks/${id}?admin=true`);
  return response.data;
};



// Settings APIs
export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSettings = async (settingsData) => {
  const response = await api.put('/settings', settingsData);
  return response.data;
};

export const getEnquiryBannerSettings = async () => {
  const response = await api.get('/settings/enquiry-banner');
  return response.data;
};

export const getLandingPageSettings = async () => {
  const response = await api.get('/settings/landing-page');
  return response.data;
};

export const getBlogPageSettings = async () => {
  const response = await api.get('/settings/blog-page');
  return response.data;
};

export const getWeekendGetawayPageSettings = async () => {
  const response = await api.get('/settings/weekend-getaway-page');
  return response.data;
};

export const getAboutPageSettings = async () => {
  const response = await api.get('/settings/about-page');
  return response.data;
};

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Custom trek APIs
export const getCustomTrekByToken = async (token) => {
  try {
    const response = await api.get(`/treks/custom/${token}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching custom trek:', error);
    throw error;
  }
};

export const getTrekByIdWithCustomToken = async (id, customToken) => {
  try {
    const response = await api.get(`/treks/${id}?customToken=${customToken}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching trek with custom token:', error);
    throw error;
  }
};

export const getAllTreksWithCustomToggle = async (showCustom = false) => {
  try {
    const response = await api.get(`/treks/all?showCustom=${showCustom}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching treks with custom toggle:', error);
    throw error;
  }
};

export const createTrek = async (trekData) => {
  try {
    console.log('Creating trek with data:', trekData);
    const response = await api.post('/treks', trekData);
    return response.data;
  } catch (error) {
    console.error('Error creating trek:', error);
    throw error;
  }
};

export const updateTrek = async (id, trekData) => {
  try {
    console.log('Updating trek with ID:', id, 'and data:', trekData);
    const response = await api.put(`/treks/${id}`, trekData);
    return response.data;
  } catch (error) {
    console.error('Error updating trek:', error);
    throw error;
  }
};

export const deleteTrek = async (id) => {
  const response = await api.delete(`/treks/${id}`);
  return response.data;
};

export const toggleTrekStatus = async (id, isEnabled) => {
  const response = await api.patch(`/treks/${id}/toggle-status`, { isEnabled });
  return response.data;
};

export const getTrekStats = async () => {
  const response = await api.get('/treks/stats');
  return response.data;
};

// Region APIs
export const getRegions = async () => {
  const response = await api.get('/regions');
  return response.data;
};

export const getAllRegions = async () => {
  try {
    const response = await api.get('/regions');
    return response.data;
  } catch (error) {
    console.error('Error fetching all regions:', error);
    throw error;
  }
};

export const createRegion = async (regionData) => {
  try {
    console.log('API createRegion - sending data:', regionData);
    
    // Split the request if it's too large
    if (JSON.stringify(regionData).length > 1000000) {
      console.warn('Large payload detected, consider implementing chunked uploads');
    }
    
    const response = await api.post('/regions', regionData);
    console.log('API createRegion - received response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API createRegion - error:', error.response?.data || error.message);
    throw error;
  }
};

export const updateRegion = async (id, regionData) => {
  try {
    console.log('API updateRegion - sending data for ID:', id, regionData);
    
    // Split the request if it's too large
    if (JSON.stringify(regionData).length > 1000000) {
      console.warn('Large payload detected, consider implementing chunked uploads');
    }
    
    const response = await api.put(`/regions/${id}`, regionData);
    console.log('API updateRegion - received response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API updateRegion - error:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteRegion = async (id) => {
  try {
    const response = await api.delete(`/regions/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting region:', error);
    throw error;
  }
};

// Booking APIs
export const createBooking = async (bookingData) => {
  try {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to create booking';
    throw new Error(errorMessage);
  }
};

// Custom trek booking API
export const createCustomTrekBooking = async (bookingData) => {
  try {
    const response = await api.post('/bookings/custom', bookingData);
    return response.data;
  } catch (error) {
    console.error('Error creating custom trek booking:', error);
    throw error;
  }
};

export const getBookingById = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data;
};

export const downloadInvoice = async (bookingId) => {
  try {
    const response = await api.get(`/bookings/${bookingId}/invoice`, {
      responseType: 'blob'
    });
    
    // Create a blob URL and trigger download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${bookingId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error downloading invoice:', error);
    throw error;
  }
};

export const getUserBookings = async () => {
  try {
    const response = await api.get('/bookings/user/mybookings');
    return response.data;
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

export const cancelBooking = async (id, cancellationData = {}) => {
  const response = await api.put(`/bookings/${id}/cancel`, cancellationData);
  return response.data;
};

// Cancel a participant from a booking
export const cancelParticipant = async (bookingId, participantId) => {
  const response = await api.put(`/bookings/${bookingId}/participants/${participantId}/cancel`);
  return response.data;
};

// Restore a cancelled participant
export const restoreParticipant = async (bookingId, participantId) => {
  const response = await api.put(`/bookings/${bookingId}/participants/${participantId}/restore`);
  return response.data;
};

// Update booking details
export const updateBooking = async (bookingId, data) => {
  const response = await api.put(`/bookings/${bookingId}`, data);
  return response.data;
};

// Update participant details after payment
export const updateParticipantDetails = async (bookingId, data) => {
  const response = await api.put(`/bookings/${bookingId}/participants`, data);
  return response.data;
};

// Update admin remarks
export const updateAdminRemarks = async (bookingId, remarks) => {
  const response = await api.put(`/bookings/${bookingId}/remarks`, { adminRemarks: remarks });
  return response.data;
};

// Send reminder email
export const sendReminderEmail = async (bookingId) => {
  const response = await api.post(`/bookings/${bookingId}/send-reminder`);
  return response.data;
};

export const sendPartialPaymentReminder = async (bookingId) => {
  try {
    const response = await api.post(`/bookings/${bookingId}/send-partial-reminder`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to send partial payment reminder';
    throw new Error(errorMessage);
  }
};

export const markPartialPaymentComplete = async (bookingId) => {
  try {
    const response = await api.put(`/bookings/${bookingId}/mark-partial-complete`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to mark partial payment as complete';
    throw new Error(errorMessage);
  }
};

// Send confirmation email
export const sendConfirmationEmail = async (bookingId) => {
  const response = await api.post(`/bookings/${bookingId}/send-confirmation`);
  return response.data;
};

// Send invoice email
export const sendInvoiceEmail = async (bookingId) => {
  const response = await api.post(`/bookings/${bookingId}/send-invoice`);
  return response.data;
};



// Shift booking to another batch
export const shiftBookingToBatch = async (bookingId, newBatchId) => {
  const response = await api.put(`/bookings/${bookingId}/shift-batch`, { newBatchId });
  return response.data;
};



// Batch APIs
export const addBatch = async (trekId, batchData) => {
  const response = await api.post(`/treks/${trekId}/batches`, batchData);
  return response.data;
};

export const removeBatch = async (trekId, batchId) => {
  const response = await api.delete(`/treks/${trekId}/batches/${batchId}`);
  return response.data;
};

export const updateBatch = async (trekId, batchId, batchData) => {
  try {
    const response = await api.patch(`/treks/${trekId}/batches/${batchId}`, batchData);
    return response.data;
  } catch (error) {
    console.error('Error updating batch:', error);
    throw error;
  }
};

// Admin APIs
export const getAllUsers = async () => {
  try {
    const response = await api.get('/auth/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    const response = await api.patch(`/auth/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

export const getAllBookings = async (page = 1, filters = {}) => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      ...(filters.trekId && { trekId: filters.trekId }),
      ...(filters.batchId && { batchId: filters.batchId }),
      ...(filters.startDate && { startDate: filters.startDate }),
      ...(filters.endDate && { endDate: filters.endDate }),
      ...(filters.status && filters.status !== 'all' && { status: filters.status }),
      ...(filters.search && { search: filters.search })
    });

    const response = await api.get(`/bookings?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    throw error;
  }
};

export const updateBookingStatus = async (bookingId, status) => {
  try {
    if (!status || !['pending', 'pending_payment', 'payment_completed', 'confirmed', 'trek_completed', 'cancelled'].includes(status)) {
      throw new Error('Invalid status value');
    }
    
    const response = await api.put(`/bookings/${bookingId}/status`, { status });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to update booking status';
    throw new Error(errorMessage);
  }
};

export const checkExistingPendingBooking = async (trekId, batchId) => {
  try {
    const response = await api.get('/bookings/check-pending', {
      params: { trekId, batchId }
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to check existing pending booking';
    throw new Error(errorMessage);
  }
};

export const deletePendingBooking = async (bookingId) => {
  try {
    const response = await api.delete(`/bookings/pending/${bookingId}`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to delete pending booking';
    throw new Error(errorMessage);
  }
};

export const cleanupExpiredBookings = async () => {
  try {
    const response = await api.post('/bookings/cleanup-expired');
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to cleanup expired bookings';
    throw new Error(errorMessage);
  }
};

// Failed Bookings API functions
export const getFailedBookings = async (params = {}) => {
  try {
    const response = await api.get('/failed-bookings', { params });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to fetch failed bookings';
    throw new Error(errorMessage);
  }
};

export const getFailedBookingById = async (id) => {
  try {
    const response = await api.get(`/failed-bookings/${id}`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to fetch failed booking';
    throw new Error(errorMessage);
  }
};

export const restoreFailedBooking = async (id) => {
  try {
    const response = await api.post(`/failed-bookings/${id}/restore`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to restore failed booking';
    throw new Error(errorMessage);
  }
};

export const deleteFailedBooking = async (id) => {
  try {
    const response = await api.delete(`/failed-bookings/${id}`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to delete failed booking';
    throw new Error(errorMessage);
  }
};

export const exportFailedBookings = async (params = {}) => {
  try {
    const response = await api.get('/failed-bookings/export/excel', { 
      params,
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to export failed bookings';
    throw new Error(errorMessage);
  }
};

export const markTrekCompleted = async (bookingId) => {
  try {
    const response = await api.put(`/bookings/${bookingId}/complete-trek`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to mark trek as completed';
    throw new Error(errorMessage);
  }
};

export const getDashboardStats = async () => {
  try {
    console.log('Fetching dashboard stats...');
    const response = await api.get('/stats/dashboard');
    console.log('Dashboard stats API response:', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error.response?.data || error.message);
    throw error;
  }
};

// Ticket APIs
export const createTicket = async (ticketData) => {
  try {
    const response = await api.post('/tickets', ticketData);
    return response.data;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
};

export const getUserTickets = async () => {
  try {
    const response = await api.get('/tickets/user');
    return response.data;
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    throw error;
  }
};

export const getTicketById = async (id) => {
  try {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching ticket:', error);
    throw error;
  }
};

export const addTicketResponse = async (ticketId, message) => {
  try {
    const response = await api.post(`/tickets/${ticketId}/responses`, { message });
    return response.data;
  } catch (error) {
    console.error('Error adding ticket response:', error);
    throw error;
  }
};

export const updateTicketStatus = async (ticketId, status) => {
  try {
    const response = await api.patch(`/tickets/${ticketId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating ticket status:', error);
    throw error;
  }
};

export const getAllTickets = async (page = 1, limit = 10, status = 'all') => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status: status
    });
    const response = await api.get(`/tickets?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    throw error;
  }
};

// Sales Dashboard APIs
export const getSalesStats = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/stats/sales${queryString ? `?${queryString}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sales stats:', error);
    throw error;
  }
};

export const getSalesTreks = async () => {
  try {
    const response = await api.get('/stats/sales/treks');
    return response.data;
  } catch (error) {
    console.error('Error fetching sales treks:', error);
    throw error;
  }
};

export const getSalesBatches = async (trekId = null) => {
  try {
    const params = trekId ? { trekId } : {};
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/stats/sales/batches${queryString ? `?${queryString}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sales batches:', error);
    throw error;
  }
};

// Promo Code APIs
export const getAllPromoCodes = async () => {
  try {
    const response = await api.get('/promos');
    return response.data;
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    throw error;
  }
};

export const createPromoCode = async (promoData) => {
  try {
    const response = await api.post('/promos', promoData);
    return response.data;
  } catch (error) {
    console.error('Error creating promo code:', error);
    throw error;
  }
};

export const updatePromoCode = async (id, promoData) => {
  try {
    const response = await api.put(`/promos/${id}`, promoData);
    return response.data;
  } catch (error) {
    console.error('Error updating promo code:', error);
    throw error;
  }
};

export const deletePromoCode = async (id) => {
  try {
    const response = await api.delete(`/promos/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting promo code:', error);
    throw error;
  }
};

export const validateCoupon = async (couponCode, trekId, orderValue) => {
  try {
    const response = await api.post('/promos/validate', { 
      code: couponCode, 
      trekId: trekId,
      orderValue: orderValue 
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to validate coupon');
  }
};

// Offer APIs
export const getAllOffers = async () => {
  try {
    const response = await api.get('/offers');
    return response.data;
  } catch (error) {
    console.error('Error fetching offers:', error);
    throw error;
  }
};

export const createOffer = async (offerData) => {
  try {
    const response = await api.post('/offers', offerData);
    return response.data;
  } catch (error) {
    console.error('Error creating offer:', error);
    throw error;
  }
};

export const updateOffer = async (id, offerData) => {
  try {
    const response = await api.put(`/offers/${id}`, offerData);
    return response.data;
  } catch (error) {
    console.error('Error updating offer:', error);
    throw error;
  }
};

export const deleteOffer = async (id) => {
  try {
    const response = await api.delete(`/offers/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting offer:', error);
    throw error;
  }
};

export const getActiveOffers = async () => {
  try {
    console.log('API call: getActiveOffers');
    const response = await api.get('/offers/active');
    console.log('Active offers response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching active offers:', error);
    return []; // Return empty array instead of throwing
  }
};

// Create a new lead
export const createLead = async (leadData) => {
  const response = await api.post('/leads', leadData);
  return response.data;
};

// Get all leads (admin only)
export const getLeads = async (filters = {}) => {
  const queryString = new URLSearchParams(filters).toString();
  const response = await api.get(`/leads?${queryString}`);
  return response.data;
};

// Get lead by ID (admin only)
export const getLeadById = async (id) => {
  const response = await api.get(`/leads/${id}`);
  return response.data;
};

// Update lead (admin only)
export const updateLead = async (id, leadData) => {
  try {
    console.log(`Updating lead ${id} with data:`, leadData);
    const response = await api.put(`/leads/${id}`, leadData);
    return response.data;
  } catch (error) {
    console.error(`Error updating lead ${id}:`, error);
    
    // Log more details about the error
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    throw error;
  }
};

// Delete lead (admin only)
export const deleteLead = async (id) => {
  const response = await api.delete(`/leads/${id}`);
  return response.data;
};

// Get all users (admin only)
export const getUsers = async () => {
  try {
    const response = await api.get('/auth/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response || error);
    
    if (error.response && error.response.status === 401) {
      console.log('Unauthorized access detected');
    }
    
    return Promise.reject(error);
  }
);

// Add this function to set the auth token for all requests
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Helper function to get auth headers
export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: token ? `Bearer ${token}` : ''
  };
};

export const formatCurrency = (amount) => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

export default api;

// Trek Sections API
export const getTrekSections = async () => {
  try {
    const response = await api.get('/trek-sections');
    return response.data;
  } catch (error) {
    console.error('Error fetching trek sections:', error);
    throw error;
  }
};

export const getTrekSectionById = async (id) => {
  try {
    const response = await api.get(`/trek-sections/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching trek section:', error);
    throw error;
  }
};

export const createTrekSection = async (sectionData) => {
  try {
    const response = await api.post('/trek-sections', sectionData);
    return response.data;
  } catch (error) {
    console.error('Error creating trek section:', error);
    throw error;
  }
};

export const updateTrekSection = async (id, sectionData) => {
  try {
    const response = await api.put(`/trek-sections/${id}`, sectionData);
    return response.data;
  } catch (error) {
    console.error('Error updating trek section:', error);
    throw error;
  }
};

export const deleteTrekSection = async (id) => {
  try {
    const response = await api.delete(`/trek-sections/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting trek section:', error);
    throw error;
  }
};

// Get active trek sections for homepage
export const getActiveTrekSections = async () => {
  try {
    console.log('API call: getActiveTrekSections');
    const response = await api.get('/trek-sections/active');
    console.log('API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching active trek sections:', error);
    throw error;
  }
};

// Get all treks without pagination
export const getAllTreks = async () => {
  try {
    console.log('API call: getAllTreks');
    const response = await api.get('/treks/all');
    console.log('All treks response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching all treks:', error);
    return []; // Return empty array instead of throwing
  }
};

// Get region by ID
export const getRegionById = async (id) => {
  try {
    const response = await api.get(`/regions/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching region:', error);
    throw error;
  }
};

// Get region by slug
export const getRegionBySlug = async (slug) => {
  try {
    const response = await api.get(`/regions/slug/${slug}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching region by slug:', error);
    throw error;
  }
};

// Helper function to convert region name to URL-friendly slug
export const createRegionSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Get treks by region name
export const getTreksByRegion = async (regionName) => {
  try {
    console.log('Fetching treks for region name:', regionName);
    
    const response = await api.get('/treks', {
      params: { 
        region: regionName,
        enabledOnly: 'true'
      }
    });
    
    console.log('Treks data received:', response.data);
    
    // Handle different response structures
    const treks = response.data.treks || response.data;
    
    if (!Array.isArray(treks)) {
      console.error('Expected array of treks but got:', treks);
      return [];
    }
    
    return treks;
  } catch (error) {
    console.error('Error fetching treks by region:', error.response?.data || error.message);
    throw error;
  }
};

// Get treks by exact region ID match
export const getTreksByExactRegion = async (regionId) => {
  try {
    console.log('Fetching treks for exact region ID match:', regionId);
    
    // Make sure regionId is a string
    const region = String(regionId);
    
    // Use the regular treks endpoint with region parameter
    const response = await api.get('/treks', {
      params: { 
        regionId: region,
        enabledOnly: 'true'
      }
    });
    
    console.log('Region treks data received:', response.data);
    
    // Handle different response structures
    const treks = response.data.treks || response.data;
    
    if (!Array.isArray(treks)) {
      console.error('Expected array of treks but got:', treks);
      return [];
    }
    
    return treks;
  } catch (error) {
    console.error('Error fetching treks by region ID:', error.response?.data || error.message);
    // Return empty array instead of throwing
    return [];
  }
};

// Get weekend getaways
export const getWeekendGetaways = async (params = {}) => {
  try {
    const queryString = Object.keys(params)
      .filter(key => params[key] !== '')
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const response = await api.get(`/treks/weekend-getaways?${queryString}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching weekend getaways:', error);
    throw error;
  }
};

// Toggle weekend getaway status
export const toggleWeekendGetaway = async (id, weekendData) => {
  try {
    console.log(`Updating weekend getaway for trek ID: ${id}`);
    console.log('Weekend data:', weekendData);
    
    // Make sure the ID is valid
    if (!id || typeof id !== 'string' || id.length < 24) {
      throw new Error(`Invalid trek ID: ${id}`);
    }
    
    const response = await api.put(`/treks/weekend-getaway/${id}`, weekendData);
    return response.data;
  } catch (error) {
    console.error('Error updating weekend getaway status:', error);
    throw error;
  }
};

// Get all weekend getaway galleries
export const getWeekendGetawayGalleries = async () => {
  try {
    const response = await api.get('/treks/weekend-getaways/galleries');
    return response.data;
  } catch (error) {
    console.error('Error fetching weekend getaway galleries:', error);
    throw error;
  }
};

// Get all weekend getaway blogs
export const getWeekendGetawayBlogs = async () => {
  try {
    const response = await api.get('/treks/weekend-getaways/blogs');
    return response.data;
  } catch (error) {
    console.error('Error fetching weekend getaway blogs:', error);
    throw error;
  }
};

// Get all weekend getaway activities
export const getWeekendGetawayActivities = async () => {
  try {
    const response = await api.get('/treks/weekend-getaways/activities');
    return response.data;
  } catch (error) {
    console.error('Error fetching weekend getaway activities:', error);
    throw error;
  }
};

// Get weekend getaway details
export const getWeekendGetawayDetails = async (id) => {
  try {
    const response = await api.get(`/treks/weekend-getaways/${id}/details`);
    return response.data;
  } catch (error) {
    console.error('Error fetching weekend getaway details:', error);
    throw error;
  }
};

// Update weekend getaway gallery
export const updateWeekendGetawayGallery = async (id, gallery) => {
  try {
    const response = await api.put(`/treks/weekend-getaways/${id}/gallery`, { gallery });
    return response.data;
  } catch (error) {
    console.error('Error updating weekend getaway gallery:', error);
    throw error;
  }
};

export const getBatchPerformance = async (trekId, batchId) => {
  try {
    const response = await api.get(`/treks/${trekId}/batches/${batchId}/performance`, {
      params: {
        _t: new Date().getTime() // Add timestamp to prevent caching
      },
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching batch performance:', error);
    throw error;
  }
};

export const exportBatchParticipants = async (trekId, batchId, fields = [], fileType = 'pdf') => {
  try {
    const queryParams = new URLSearchParams();
    if (fields.length > 0) {
      queryParams.append('fields', fields.join(','));
    }
    queryParams.append('fileType', fileType);

    const response = await api.get(`/treks/${trekId}/batches/${batchId}/export-participants?${queryParams.toString()}`, {
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    console.error('Error exporting batch participants:', error);
    throw error;
  }
};

export const getTrekPerformance = async (trekId) => {
  try {
    const response = await api.get(`/treks/${trekId}/performance`, {
      params: {
        _t: new Date().getTime() // Add timestamp to prevent caching
      },
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching trek performance:', error);
    throw error;
  }
};

export const addParticipant = async (bookingId, participantData) => {
  try {
    const response = await api.post(`/bookings/${bookingId}/participants`, participantData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateParticipant = async (bookingId, participantId, participantData) => {
  try {
    const response = await api.put(`/bookings/${bookingId}/participants/${participantId}`, participantData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// User Group APIs
export const getAllUserGroups = async () => {
  try {
    const response = await api.get('/user-groups');
    return response.data;
  } catch (error) {
    console.error('Error fetching user groups:', error);
    throw error;
  }
};

export const updateUserGroupAssignment = async (userId, groupId) => {
  try {
    const response = await api.put(`/users/${userId}/group`, { groupId });
    return response.data;
  } catch (error) {
    console.error('Error updating user group assignment:', error);
    throw error;
  }
};

export const createUserGroup = async (groupData) => {
  try {
    const response = await api.post('/user-groups', groupData);
    return response.data;
  } catch (error) {
    console.error('Error creating user group:', error);
    throw error;
  }
};

export const updateUserGroup = async (groupId, groupData) => {
  try {
    const response = await api.put(`/user-groups/${groupId}`, groupData);
    return response.data;
  } catch (error) {
    console.error('Error updating user group:', error);
    throw error;
  }
};

export const deleteUserGroup = async (groupId) => {
  try {
    const response = await api.delete(`/user-groups/${groupId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user group:', error);
    throw error;
  }
};

export const getUserGroup = async (groupId) => {
  try {
    const response = await api.get(`/user-groups/${groupId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user group:', error);
    throw error;
  }
};

export const getUsersInGroup = async (groupId) => {
  try {
    const response = await api.get(`/user-groups/${groupId}/users`);
    return response.data;
  } catch (error) {
    console.error('Error fetching users in group:', error);
    throw error;
  }
};

export const getAdmins = async () => {
  try {
    const response = await api.get('/users/admins');
    return response.data;
  } catch (error) {
    console.error('Error fetching admins:', error);
    throw error;
  }
};

export const exportLeads = async (data) => {
  try {
    const response = await api.post('/leads/export', data, {
      responseType: 'blob' // Important for handling file downloads
    });
    return response;
  } catch (error) {
    console.error('Error exporting leads:', error);
    throw error;
  }
};

export const exportBookings = async (options) => {
  try {
    const { fields, fileType, filters } = options;
    const queryParams = new URLSearchParams({
      fields: fields.join(','),
      fileType,
      ...(filters.status && { status: filters.status }),
      ...(filters.trekId && { trekId: filters.trekId }),
      ...(filters.batchId && { batchId: filters.batchId }),
      ...(filters.startDate && { startDate: filters.startDate }),
      ...(filters.endDate && { endDate: filters.endDate })
    });

    const response = await api.get(`/bookings/admin/export?${queryParams.toString()}`, {
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    console.error('Error exporting bookings:', error);
    throw error;
  }
};

// Payment API endpoints
export const getRazorpayKey = async () => {
  try {
    console.log('Fetching Razorpay key from:', `${API_URL}/payments/get-key`);
    const response = await api.get('/payments/get-key', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'If-None-Match': '',
        'If-Modified-Since': '',
        'Accept': 'application/json'
      },
      params: {
        _t: new Date().getTime() // Add timestamp to prevent caching
      },
      withCredentials: true
    });
    console.log('Razorpay key response:', response.data);
    return response.data.key;
  } catch (error) {
    console.error('Error fetching Razorpay key:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    throw error;
  }
};

export const createPaymentOrder = async (amount, bookingId) => {
  try {
    const response = await api.post(
      '/payments/create-order',
      { amount, bookingId },
      {
        headers: getAuthHeader()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating payment order:', error);
    throw error;
  }
};

export const verifyPayment = async (paymentData) => {
  try {
    const response = await api.post(
      '/payments/verify',
      paymentData,
      {
        headers: getAuthHeader()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

export const createRemainingBalanceOrder = async (bookingId) => {
  try {
    const response = await api.post('/payments/create-remaining-balance-order', { bookingId });
    return response.data;
  } catch (error) {
    console.error('Error creating remaining balance order:', error);
    throw error;
  }
};

export async function adminCancelBooking({ bookingId, refund, refundType, participantId, reason }) {
  const res = await fetch(`/admin/bookings/${bookingId}/cancel`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ refund, refundType, participantId, reason }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to cancel booking');
  return res.json();
}

export const sendCustomTrekLink = async (trekId, email) => {
  try {
    const response = await api.post(`/treks/${trekId}/send-custom-link`, { email });
    return response.data;
  } catch (error) {
    console.error('Error sending custom trek link:', error);
    throw error;
  }
};

// Blog APIs
export const getBlogs = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/blogs${queryString ? `?${queryString}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching blogs:', error);
    throw error;
  }
};

export const getBlogBySlug = async (slug) => {
  const response = await api.get(`/blogs/${slug}`);
  return response.data;
};

export const createBlog = async (blogData) => {
  const response = await api.post('/blogs', blogData);
  return response.data;
};

export const updateBlog = async (id, blogData) => {
  const response = await api.put(`/blogs/${id}`, blogData);
  return response.data;
};

export const deleteBlog = async (id) => {
  const response = await api.delete(`/blogs/${id}`);
  return response.data;
};

export const getAdminBlogs = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await api.get(`/blogs/admin${queryString ? `?${queryString}` : ''}`);
  return response.data;
};

export const getAdminBlog = async (id) => {
  const response = await api.get(`/blogs/admin/${id}`);
  return response.data;
};

export const uploadBlogImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/blogs/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// Blog Region APIs
export const getBlogRegions = async () => {
  const response = await api.get('/blog-regions/enabled');
  return response.data;
};

export const getAllBlogRegions = async () => {
  const response = await api.get('/blog-regions');
  return response.data;
};

export const getBlogRegionBySlug = async (slug) => {
  const response = await api.get(`/blog-regions/slug/${slug}`);
  return response.data;
};

export const getBlogRegionById = async (id) => {
  const response = await api.get(`/blog-regions/${id}`);
  return response.data;
};

export const createBlogRegion = async (regionData) => {
  const response = await api.post('/blog-regions', regionData);
  return response.data;
};

export const updateBlogRegion = async (id, regionData) => {
  const response = await api.put(`/blog-regions/${id}`, regionData);
  return response.data;
};

export const deleteBlogRegion = async (id) => {
  const response = await api.delete(`/blog-regions/${id}`);
  return response.data;
};

export const getBlogsByRegion = async (regionId, params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/blogs/region/${regionId}${queryString ? `?${queryString}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching blogs by region:', error);
    throw error;
  }
};

export const getRelatedBlogs = async (blogId, regionId, limit = 3) => {
  try {
    const response = await api.get(`/blogs/related/${blogId}/${regionId}?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching related blogs:', error);
    throw error;
  }
};

// Helper function to convert trek name to URL-friendly slug
export const createTrekSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Helper function to get trek ID from slug
export const getTrekIdFromSlug = async (slug) => {
  try {
    const response = await api.get(`/treks/slug/${slug}`);
    return response.data._id;
  } catch (error) {
    console.error('Error fetching trek ID from slug:', error);
    throw error;
  }
};

export const getTrekBySlug = async (slug) => {
  try {
    const response = await api.get(`/treks/slug/${slug}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching trek by slug:', error);
    throw error;
  }
};

// Cancellation/Reschedule request APIs
export const createCancellationRequest = async (bookingId, requestData) => {
  try {
    const response = await api.post(`/bookings/${bookingId}/cancellation-request`, requestData);
    return response.data;
  } catch (error) {
    console.error('Error creating cancellation request:', error);
    throw error;
  }
};

export const updateCancellationRequest = async (bookingId, updateData) => {
  try {
    const response = await api.put(`/bookings/${bookingId}/cancellation-request`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating cancellation request:', error);
    throw error;
  }
};

export const calculateRefund = async (refundData) => {
  try {
    const { bookingId, ...otherData } = refundData;
    const response = await api.post(`/bookings/${bookingId}/calculate-refund`, otherData);
    return response.data;
  } catch (error) {
    console.error('Error calculating refund:', error);
    throw error;
  }
};

// Fetch a batch by its ID (requires backend endpoint to exist)
export const getBatchById = async (batchId) => {
  const response = await api.get(`/batches/${batchId}`);
  return response.data;
};