const axios = require('axios');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

/**
 * Fetch Google reviews for a place using the Places API
 * @param {Object} options
 * @param {string} [options.placeId] - Google Place ID
 * @param {string} [options.placeName] - Place name (if no placeId)
 * @returns {Promise<Array>} - Array of review objects
 */
async function fetchGoogleReviews({ placeId, placeName }) {
  if (!GOOGLE_API_KEY) throw new Error('GOOGLE_API_KEY not set in environment');

  let resolvedPlaceId = placeId;

  // If no placeId, use placeName to search for placeId
  if (!resolvedPlaceId && placeName) {
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(placeName)}&key=${GOOGLE_API_KEY}`;
    const textSearchRes = await axios.get(textSearchUrl);
    if (textSearchRes.data.status !== 'OK') {
      console.error('Google Places Text Search API error:', textSearchRes.data);
      throw new Error(`Google Places API error: ${textSearchRes.data.status} - ${textSearchRes.data.error_message || 'No results found for the given name.'}`);
    }
    if (textSearchRes.data.results && textSearchRes.data.results.length > 0) {
      resolvedPlaceId = textSearchRes.data.results[0].place_id;
    } else {
      console.error('No place found for the given name. API response:', textSearchRes.data);
      throw new Error('No place found for the given name. Please check the spelling or try a more specific name.');
    }
  }

  if (!resolvedPlaceId) throw new Error('Could not resolve placeId');

  // Fetch place details (including reviews)
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${resolvedPlaceId}&fields=review,rating,user_ratings_total,name,formatted_address,photos,url&key=${GOOGLE_API_KEY}`;
  const detailsRes = await axios.get(detailsUrl);
  if (detailsRes.data.result && detailsRes.data.result.reviews) {
    return detailsRes.data.result.reviews;
  } else {
    return [];
  }
}

module.exports = { fetchGoogleReviews }; 