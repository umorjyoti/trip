import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with base URL and credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

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
  const response = await api.post('/bookings', bookingData);
  return response.data;
};

export const getBookingById = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data;
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

export const cancelBooking = async (id) => {
  const response = await api.put(`/bookings/${id}/cancel`);
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

// Batch APIs
export const addBatch = async (trekId, batchData) => {
  const response = await api.post(`/treks/${trekId}/batches`, batchData);
  return response.data;
};

export const removeBatch = async (trekId, batchId) => {
  const response = await api.delete(`/treks/${trekId}/batches/${batchId}`);
  return response.data;
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
      ...(filters.endDate && { endDate: filters.endDate })
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
    if (!status || !['confirmed', 'cancelled'].includes(status)) {
      throw new Error('Invalid status value');
    }
    
    const response = await api.put(`/bookings/${bookingId}/status`, { status });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to update booking status';
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

export const getAllTickets = async () => {
  try {
    const response = await api.get('/tickets');
    return response.data;
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    throw error;
  }
};

// Sales Dashboard APIs
export const getSalesStats = async (timeRange = 'month') => {
  try {
    const response = await api.get(`/stats/sales?timeRange=${timeRange}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sales stats:', error);
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

export const validatePromoCode = async (code, trekId, orderValue) => {
  try {
    const response = await api.post('/promos/validate', { code, trekId, orderValue });
    return response.data;
  } catch (error) {
    console.error('Error validating promo code:', error);
    throw error;
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

// Get user's wishlist
export const getUserWishlist = async () => {
  try {
    const response = await api.get('/wishlist');
    return response.data;
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    throw error;
  }
};

// Add trek to wishlist
export const addToWishlist = async (trekId) => {
  try {
    const response = await api.post(`/wishlist/${trekId}`);
    return response.data;
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    throw error;
  }
};

// Remove trek from wishlist
export const removeFromWishlist = async (trekId) => {
  try {
    const response = await api.delete(`/wishlist/${trekId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    throw error;
  }
};

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
    
    const response = await axios.get(`/api/treks/weekend-getaways?${queryString}`);
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
    
    const response = await axios.put(`/api/treks/weekend-getaway/${id}`, weekendData);
    return response.data;
  } catch (error) {
    console.error('Error updating weekend getaway status:', error);
    throw error;
  }
};

// Get all weekend getaway galleries
export const getWeekendGetawayGalleries = async () => {
  try {
    const response = await axios.get('/api/treks/weekend-getaways/galleries');
    return response.data;
  } catch (error) {
    console.error('Error fetching weekend getaway galleries:', error);
    throw error;
  }
};

// Get all weekend getaway blogs
export const getWeekendGetawayBlogs = async () => {
  try {
    const response = await axios.get('/api/treks/weekend-getaways/blogs');
    return response.data;
  } catch (error) {
    console.error('Error fetching weekend getaway blogs:', error);
    throw error;
  }
};

// Get all weekend getaway activities
export const getWeekendGetawayActivities = async () => {
  try {
    const response = await axios.get('/api/treks/weekend-getaways/activities');
    return response.data;
  } catch (error) {
    console.error('Error fetching weekend getaway activities:', error);
    throw error;
  }
};

// Get weekend getaway details
export const getWeekendGetawayDetails = async (id) => {
  try {
    const response = await axios.get(`/api/treks/weekend-getaways/${id}/details`);
    return response.data;
  } catch (error) {
    console.error('Error fetching weekend getaway details:', error);
    throw error;
  }
};

// Update weekend getaway gallery
export const updateWeekendGetawayGallery = async (id, gallery) => {
  try {
    const response = await axios.put(`/api/treks/weekend-getaways/${id}/gallery`, { gallery });
    return response.data;
  } catch (error) {
    console.error('Error updating weekend getaway gallery:', error);
    throw error;
  }
};

export const getBatchPerformance = async (trekId, batchId) => {
  try {
    const response = await api.get(`/treks/${trekId}/batches/${batchId}/performance`);
    return response.data;
  } catch (error) {
    console.error('Error fetching batch performance:', error);
    throw error;
  }
};

export const getTrekPerformance = async (trekId) => {
  try {
    const response = await api.get(`/treks/${trekId}/performance`);
    return response.data;
  } catch (error) {
    console.error('Error fetching trek performance:', error);
    throw error;
  }
};

export const addParticipant = async (bookingId, participantData) => {
  try {
    const response = await axios.post(
      `${API_URL}/bookings/${bookingId}/participants`,
      participantData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateParticipant = async (bookingId, participantId, participantData) => {
  try {
    const response = await axios.put(
      `${API_URL}/bookings/${bookingId}/participants/${participantId}`,
      participantData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
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
    const response = await api.get('/users');
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
    const response = await api.get('/payments/get-key');
    return response.data.key;
  } catch (error) {
    console.error('Error fetching Razorpay key:', error);
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

export async function adminCancelBooking({ bookingId, refund, refundType, participantId }) {
  const res = await fetch(`/api/admin/bookings/${bookingId}/cancel`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ refund, refundType, participantId }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to cancel booking');
  return res.json();
}