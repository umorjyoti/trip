const { fetchGoogleReviews } = require('../utils/googleReviews');

/**
 * Controller to fetch Google reviews for a place
 * @route GET /api/google/reviews
 * @param {string} req.query.placeId - Google Place ID (preferred)
 * @param {string} req.query.placeName - Place name (optional, fallback)
 */
exports.getGoogleReviews = async (req, res) => {
  try {
    const { placeId, placeName } = req.query;
    if (!placeId && !placeName) {
      return res.status(400).json({ success: false, message: 'placeId or placeName is required' });
    }
    const reviews = await fetchGoogleReviews({ placeId, placeName });
    res.json({ success: true, reviews });
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch Google reviews', error: error.message });
  }
}; 