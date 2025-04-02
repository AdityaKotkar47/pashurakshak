const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
    createRescueRequest,
    getRescueRequests,
    getRescueRequest,
    acceptRescueRequest,
    updateRescueStatus
} = require('../controllers/rescueController');

// POST /api/rescue/request - Create a new rescue request
router.post('/request', protect, createRescueRequest);

// GET /api/rescue/requests - Get all rescue requests (paginated)
router.get('/requests', protect, getRescueRequests);

// GET /api/rescue/requests/:id - Get rescue request details
router.get('/requests/:id', protect, getRescueRequest);

// PUT /api/rescue/requests/:id/accept - NGO accepts a rescue request
router.put('/requests/:id/accept', protect, restrictTo('ngo'), acceptRescueRequest);

// PUT /api/rescue/requests/:id/status - Update rescue request status
router.put('/requests/:id/status', protect, restrictTo('ngo'), updateRescueStatus);

module.exports = router; 