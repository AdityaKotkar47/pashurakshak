const express = require('express');
const router = express.Router();
const RescueRequest = require('../models/RescueRequest');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { check, validationResult } = require('express-validator');

// Validation middleware
const validateRescueRequest = [
    check('animalType').isIn(['Dog', 'Cat', 'Bird', 'Cattle', 'Wildlife', 'Other']),
    check('location.city').notEmpty().withMessage('City is required'),
    check('location.state').notEmpty().withMessage('State is required'),
    check('contactInfo.phone').notEmpty().withMessage('Contact phone is required'),
];

// POST /api/rescue/request - Create a new rescue request
router.post('/request', [protect, validateRescueRequest], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        const rescueRequest = new RescueRequest({
            ...req.body,
            userId: req.user._id,
            rescueTimeline: [{
                status: 'request_received',
                timestamp: Date.now(),
                notes: 'Rescue request received'
            }]
        });

        await rescueRequest.save();
        
        res.status(201).json({
            success: true,
            data: rescueRequest
        });
    } catch (error) {
        console.error('Error creating rescue request:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while creating rescue request',
            error: error.message
        });
    }
});

// GET /api/rescue/requests - Get all rescue requests (paginated)
router.get('/requests', protect, async (req, res) => {
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
            success: true,
            data: {
                requests: rescueRequests,
                currentPage: page,
                totalPages: Math.ceil(totalRequests / limit),
                totalRequests
            }
        });
    } catch (error) {
        console.error('Error fetching rescue requests:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while fetching rescue requests',
            error: error.message 
        });
    }
});

// GET /api/rescue/requests/:id - Get rescue request details
router.get('/requests/:id', protect, async (req, res) => {
    try {
        const rescueRequest = await RescueRequest.findById(req.params.id)
            .populate('userId', 'name')
            .populate('assignedTo.ngo', 'name')
            .populate('assignedTo.volunteer', 'name');

        if (!rescueRequest) {
            return res.status(404).json({ 
                success: false,
                message: 'Rescue request not found' 
            });
        }

        res.json({
            success: true,
            data: rescueRequest
        });
    } catch (error) {
        console.error('Error fetching rescue request:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while fetching rescue request',
            error: error.message
        });
    }
});

// PUT /api/rescue/requests/:id/accept - NGO accepts a rescue request
router.put('/requests/:id/accept', protect, restrictTo('ngo'), async (req, res) => {
    try {
        const { volunteerId } = req.body; // Get volunteerId from request body
        
        const rescueRequest = await RescueRequest.findById(req.params.id);
        if (!rescueRequest) {
            return res.status(404).json({ 
                success: false,
                message: 'Rescue request not found' 
            });
        }

        // Update status and assigned NGO and volunteer
        rescueRequest.status = 'accepted';
        rescueRequest.assignedTo.ngo = req.user._id;
        if (volunteerId) {
            rescueRequest.assignedTo.volunteer = volunteerId;
        }
        rescueRequest.assignedTo.assignedAt = Date.now();

        // Add timeline entries
        rescueRequest.rescueTimeline.push({
            status: 'ngo_assigned',
            timestamp: Date.now(),
            notes: `Request accepted by NGO: ${req.user.name}`
        });

        if (volunteerId) {
            rescueRequest.rescueTimeline.push({
                status: 'volunteer_assigned',
                timestamp: Date.now(),
                notes: `Volunteer assigned to the request`
            });
        }

        await rescueRequest.save();
        
        // Populate the response with NGO and volunteer details
        await rescueRequest.populate('assignedTo.ngo', 'name');
        await rescueRequest.populate('assignedTo.volunteer', 'name');
        
        res.json({
            success: true,
            data: rescueRequest
        });
    } catch (error) {
        console.error('Error accepting rescue request:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while accepting rescue request',
            error: error.message
        });
    }
});

// PUT /api/rescue/requests/:id/status - Update rescue request status
router.put('/requests/:id/status', protect, async (req, res) => {
    try {
        const { status, notes } = req.body;
        const rescueRequest = await RescueRequest.findById(req.params.id);
        
        if (!rescueRequest) {
            return res.status(404).json({ 
                success: false,
                message: 'Rescue request not found' 
            });
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
                success: false,
                message: `Invalid status transition from ${rescueRequest.status} to ${status}` 
            });
        }

        // Update status
        rescueRequest.status = status;
        
        // Map main status to timeline status
        const statusToTimelineStatus = {
            'in_progress': 'volunteer_dispatched',
            'completed': 'completed',
            'cancelled': 'cancelled'
        };

        // Add timeline entry with mapped status
        const timelineStatus = statusToTimelineStatus[status] || status;
        rescueRequest.rescueTimeline.push({
            status: timelineStatus,
            timestamp: Date.now(),
            notes: notes || `Status updated to ${status}`
        });

        await rescueRequest.save();
        
        res.json({
            success: true,
            data: rescueRequest
        });
    } catch (error) {
        console.error('Error updating rescue request status:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while updating rescue request status',
            error: error.message
        });
    }
});

// GET /api/rescue/requests/user/:userId - Get user's rescue requests
router.get('/requests/user/:userId', protect, async (req, res) => {
    try {
        // Ensure user can only access their own requests
        if (req.user._id.toString() !== req.params.userId && req.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access these rescue requests'
            });
        }

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
            success: true,
            data: {
                requests: rescueRequests,
                currentPage: page,
                totalPages: Math.ceil(totalRequests / limit),
                totalRequests
            }
        });
    } catch (error) {
        console.error('Error fetching user rescue requests:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while fetching user rescue requests',
            error: error.message
        });
    }
});

// Mobile-friendly endpoints with m- prefix - these bypass Vercel security checks
// GET /api/rescue/m-requests/user/:userId - Mobile-friendly version to get user's rescue requests
router.get('/m-requests/user/:userId', protect, async (req, res) => {
    try {
        console.log(`M-USER-REQUESTS: Using mobile-friendly user requests endpoint for user: ${req.params.userId}`);
        
        // Ensure user can only access their own requests
        if (req.user._id.toString() !== req.params.userId && req.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access these rescue requests'
            });
        }

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
            success: true,
            data: {
                requests: rescueRequests,
                currentPage: page,
                totalPages: Math.ceil(totalRequests / limit),
                totalRequests
            }
        });
    } catch (error) {
        console.error('Error fetching user rescue requests:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while fetching user rescue requests',
            error: error.message
        });
    }
});

// GET /api/rescue/m-requests/:id/timeline - Mobile-friendly version to get rescue timeline
router.get('/m-requests/:id/timeline', protect, async (req, res) => {
    try {
        console.log(`M-TIMELINE: Using mobile-friendly timeline endpoint for request: ${req.params.id}`);
        
        const rescueRequest = await RescueRequest.findById(req.params.id)
            .select('rescueTimeline status');

        if (!rescueRequest) {
            return res.status(404).json({ 
                success: false,
                message: 'Rescue request not found' 
            });
        }

        res.json({
            success: true,
            data: {
                timeline: rescueRequest.rescueTimeline,
                status: rescueRequest.status
            }
        });
    } catch (error) {
        console.error('Error fetching rescue timeline:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while fetching rescue timeline',
            error: error.message
        });
    }
});

// Direct route for assigning volunteer (without /requests prefix)
router.put('/:id/assign-volunteer', protect, restrictTo('ngo', 'admin'), async (req, res) => {
    try {
        const { volunteerId } = req.body;
        
        if (!volunteerId) {
            return res.status(400).json({
                success: false,
                message: 'Volunteer ID is required'
            });
        }

        const rescueRequest = await RescueRequest.findById(req.params.id);
        
        if (!rescueRequest) {
            return res.status(404).json({ 
                success: false,
                message: 'Rescue request not found' 
            });
        }

        // Ensure request has been accepted first
        if (rescueRequest.status !== 'accepted') {
            return res.status(400).json({
                success: false,
                message: 'Rescue request must be accepted before assigning a volunteer'
            });
        }

        // Only the NGO that accepted the request or an admin can assign volunteers
        if (rescueRequest.assignedTo.ngo && 
            req.userType === 'ngo' && 
            rescueRequest.assignedTo.ngo.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only the assigned NGO or an admin can assign volunteers to this request'
            });
        }

        // Check if volunteer exists and is active
        const Volunteer = require('../models/Volunteer');
        const volunteer = await Volunteer.findById(volunteerId);
        
        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: 'Volunteer not found'
            });
        }

        if (volunteer.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Volunteer is not active'
            });
        }

        // Update status to in_progress and assign volunteer
        rescueRequest.status = 'in_progress';
        rescueRequest.assignedTo.volunteer = volunteerId;
        
        // Add timeline entry
        rescueRequest.rescueTimeline.push({
            status: 'volunteer_assigned',
            timestamp: Date.now(),
            notes: `Volunteer ${volunteer.name} assigned to the rescue`
        });

        // Add the rescue to volunteer's active rescues
        if (!volunteer.activeRescues.includes(rescueRequest._id)) {
            volunteer.activeRescues.push(rescueRequest._id);
            await volunteer.save();
        }

        await rescueRequest.save();
        
        res.json({
            success: true,
            message: 'Volunteer assigned successfully',
            data: {
                rescueId: rescueRequest._id,
                volunteerId: volunteer._id,
                volunteerName: volunteer.name,
                status: rescueRequest.status
            }
        });
    } catch (error) {
        console.error('Error assigning volunteer:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while assigning volunteer',
            error: error.message
        });
    }
});

module.exports = router; 