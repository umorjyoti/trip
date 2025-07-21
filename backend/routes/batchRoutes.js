const express = require('express');
const router = express.Router();
const trekController = require('../controllers/trekController');

// Public batch details route
router.get('/:batchId', trekController.getBatchById);

module.exports = router; 