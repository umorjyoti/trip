/**
 * Get the frontend URL with proper fallback
 * @returns {string} The frontend URL
 */
const getFrontendUrl = () => {
  return process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' 
    ? 'https://bengalurutrekkers.com' 
    : 'http://localhost:3000');
};

module.exports = {
  getFrontendUrl
}; 