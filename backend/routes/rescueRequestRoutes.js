const express = require('express');
const router = express.Router();
const RescueRequest = require('../models/RescueRequest');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// Validation middleware
const validateRescueRequest = [
    check('animalType').isIn(['Dog', 'Cat', 'Bird', 'Cattle', 'Wildlife', 'Other']),
    check('location.city').notEmpty().withMessage('City is required'),
    check('location.state').notEmpty().withMessage('State is required'),
    check('contactInfo.phone').notEmpty().withMessage('Contact phone is required'),
];

// POST /api/rescue/request - Create a new rescue request
router.post('/request', [auth, validateRescueRequest], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const rescueRequest = new RescueRequest({
            ...req.body,
            userId: req.user.id,
            rescueTimeline: [{
                status: 'request_received',
                timestamp: Date.now(),
                notes: 'Rescue request received'
            }]
        });

        await rescueRequest.save();
        res.status(201).json(rescueRequest);
    } catch (error) {
        console.error('Error creating rescue request:', error);
        res.status(500).json({ error: 'Server error while creating rescue request' });
    }
});

// GET /api/rescue/requests - Get all rescue requests (paginated)
router.get('/requests', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const emergency = req.query.emergency;

        let query = {};
        if (status) query.status = status;
        if (emergency) query.emergency = emergency === 'true';

        const totalRequests = await RescueRequest.countDocuments(query);
        const rescueRequests = await RescueRequest.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('userId', 'name')
            .populate('assignedTo.ngo', 'name')
            .populate('assignedTo.volunteer', 'name');

        res.json({
            requests: rescueRequests,
            currentPage: page,
            totalPages: Math.ceil(totalRequests / limit),
            totalRequests
        });
    } catch (error) {
        console.error('Error fetching rescue requests:', error);
        res.status(500).json({ error: 'Server error while fetching rescue requests' });
    }
});

// GET /api/rescue/requests/:id - Get rescue request details
router.get('/requests/:id', auth, async (req, res) => {
    try {
        const rescueRequest = await RescueRequest.findById(req.params.id)
            .populate('userId', 'name')
            .populate('assignedTo.ngo', 'name')
            .populate('assignedTo.volunteer', 'name');

        if (!rescueRequest) {
            return res.status(404).json({ error: 'Rescue request not found' });
        }

        res.json(rescueRequest);
    } catch (error) {
        console.error('Error fetching rescue request:', error);
        res.status(500).json({ error: 'Server error while fetching rescue request' });
    }
});

// PUT /api/rescue/requests/:id/accept - NGO accepts a rescue request
router.put('/requests/:id/accept', auth, async (req, res) => {
    try {
        const rescueRequest = await RescueRequest.findById(req.params.id);
        if (!rescueRequest) {
            return res.status(404).json({ error: 'Rescue request not found' });
        }

        // Update status and assigned NGO
        rescueRequest.status = 'accepted';
        rescueRequest.assignedTo.ngo = req.user.ngoId;
        rescueRequest.assignedTo.assignedAt = Date.now();

        // Add timeline entry
        rescueRequest.rescueTimeline.push({
            status: 'ngo_assigned',
            timestamp: Date.now(),
            notes: `Request accepted by NGO: ${req.user.ngoName}`
        });

        await rescueRequest.save();
        res.json(rescueRequest);
    } catch (error) {
        console.error('Error accepting rescue request:', error);
        res.status(500).json({ error: 'Server error while accepting rescue request' });
    }
});

// PUT /api/rescue/requests/:id/status - Update rescue request status
router.put('/requests/:id/status', auth, async (req, res) => {
    try {
        const { status, notes } = req.body;
        const rescueRequest = await RescueRequest.findById(req.params.id);
        
        if (!rescueRequest) {
            return res.status(404).json({ error: 'Rescue request not found' });
        }

        // Validate status transition
        const validTransitions = {
            pending: ['accepted', 'cancelled'],
            accepted: ['in_progress', 'cancelled'],
            in_progress: ['completed', 'cancelled'],
            completed: [],
            cancelled: []
        };

        if (!validTransitions[rescueRequest.status].includes(status)) {
            return res.status(400).json({ 
                error: `Invalid status transition from ${rescueRequest.status} to ${status}` 
            });
        }

        // Update status
        rescueRequest.status = status;
        
        // Add timeline entry
        rescueRequest.rescueTimeline.push({
            status,
            timestamp: Date.now(),
            notes: notes || `Status updated to ${status}`
        });

        await rescueRequest.save();
        res.json(rescueRequest);
    } catch (error) {
        console.error('Error updating rescue request status:', error);
        res.status(500).json({ error: 'Server error while updating rescue request status' });
    }
});

// GET /api/rescue/requests/user/:userId - Get user's rescue requests
router.get('/requests/user/:userId', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const totalRequests = await RescueRequest.countDocuments({ userId: req.params.userId });
        const rescueRequests = await RescueRequest.find({ userId: req.params.userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('assignedTo.ngo', 'name')
            .populate('assignedTo.volunteer', 'name');

        res.json({
            requests: rescueRequests,
            currentPage: page,
            totalPages: Math.ceil(totalRequests / limit),
            totalRequests
        });
    } catch (error) {
        console.error('Error fetching user rescue requests:', error);
        res.status(500).json({ error: 'Server error while fetching user rescue requests' });
    }
});

module.exports = router; 