const express = require('express');
const router = express.Router();
const googleReviewsController = require('../controllers/googleReviewsController');

// GET /api/google/reviews?placeId=... or ?placeName=...
router.get('/reviews', googleReviewsController.getGoogleReviews);

module.exports = router; 