const RescueRequest = require('../models/RescueRequest');

// @desc    Create a new rescue request
// @route   POST /api/rescue/request
// @access  Private
exports.createRescueRequest = async (req, res) => {
    try {
        // Create request with authenticated user's ID
        const rescueRequest = new RescueRequest({
            ...req.body,
            userId: req.user._id
        });

        // Add initial timeline entry
        rescueRequest.rescueTimeline.push({
            status: 'request_received',
            notes: 'Rescue request submitted by user'
        });

        await rescueRequest.save();

        res.status(201).json({
            success: true,
            data: rescueRequest
        });
    } catch (error) {
        console.error('Error creating rescue request:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all rescue requests (with optional filtering)
// @route   GET /api/rescue/requests
// @access  Private
exports.getRescueRequests = async (req, res) => {
    try {
        // Base query
        let query = {};

        // Filter by status if provided
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Filter by emergency if provided
        if (req.query.emergency) {
            query.emergency = req.query.emergency === 'true';
        }

        // For NGO users, show only their assigned rescues
        if (req.userType === 'ngo') {
            query['assignedTo.ngo'] = req.user._id;
        }

        // For regular users, show only their own requests
        if (req.userType === 'user') {
            query.userId = req.user._id;
        }

        // Admin can see all

        const rescueRequests = await RescueRequest.find(query)
            .sort({ createdAt: -1 }) // Most recent first
            .populate('userId', 'name email')
            .populate('assignedTo.ngo', 'name')
            .populate('assignedTo.volunteer', 'name');

        res.status(200).json({
            success: true,
            count: rescueRequests.length,
            data: rescueRequests
        });
    } catch (error) {
        console.error('Error fetching rescue requests:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get single rescue request
// @route   GET /api/rescue/requests/:id
// @access  Private
exports.getRescueRequest = async (req, res) => {
    try {
        const rescueRequest = await RescueRequest.findById(req.params.id)
            .populate('userId', 'name email')
            .populate('assignedTo.ngo', 'name')
            .populate('assignedTo.volunteer', 'name');

        if (!rescueRequest) {
            return res.status(404).json({
                success: false,
                message: 'Rescue request not found'
            });
        }

        // Check permission
        if (req.userType === 'user' && 
            rescueRequest.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this rescue request'
            });
        }

        res.status(200).json({
            success: true,
            data: rescueRequest
        });
    } catch (error) {
        console.error('Error fetching rescue request:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    NGO accepts a rescue request
// @route   PUT /api/rescue/requests/:id/accept
// @access  Private (NGO only)
exports.acceptRescueRequest = async (req, res) => {
    try {
        const rescueRequest = await RescueRequest.findById(req.params.id);

        if (!rescueRequest) {
            return res.status(404).json({
                success: false,
                message: 'Rescue request not found'
            });
        }

        if (rescueRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot accept rescue that is already ${rescueRequest.status}`
            });
        }

        // Update status
        rescueRequest.status = 'accepted';
        
        // Assign the NGO
        rescueRequest.assignedTo = {
            ngo: req.user._id,
            assignedAt: Date.now()
        };

        // Add timeline entry
        rescueRequest.rescueTimeline.push({
            status: 'ngo_assigned',
            notes: `Rescue accepted by NGO: ${req.user.name}`
        });

        await rescueRequest.save();

        res.status(200).json({
            success: true,
            data: rescueRequest
        });
    } catch (error) {
        console.error('Error accepting rescue request:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update rescue request status
// @route   PUT /api/rescue/requests/:id/status
// @access  Private (NGO only)
exports.updateRescueStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;
        
        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Please provide status'
            });
        }

        const validStatuses = [
            'pending', 
            'accepted', 
            'in_progress', 
            'completed', 
            'cancelled'
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const rescueRequest = await RescueRequest.findById(req.params.id);

        if (!rescueRequest) {
            return res.status(404).json({
                success: false,
                message: 'Rescue request not found'
            });
        }

        // Check if this NGO is assigned to this rescue
        if (
            !rescueRequest.assignedTo ||
            !rescueRequest.assignedTo.ngo ||
            rescueRequest.assignedTo.ngo.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this rescue request'
            });
        }

        // Update status
        rescueRequest.status = status;

        // Add timeline entry if relevant
        let timelineStatus = null;
        
        switch (status) {
            case 'in_progress':
                timelineStatus = 'volunteer_dispatched';
                break;
            case 'completed':
                timelineStatus = 'completed';
                break;
            case 'cancelled':
                timelineStatus = 'cancelled';
                break;
        }

        if (timelineStatus) {
            rescueRequest.rescueTimeline.push({
                status: timelineStatus,
                notes: notes || `Status updated to ${status}`
            });
        }

        await rescueRequest.save();

        res.status(200).json({
            success: true,
            data: rescueRequest
        });
    } catch (error) {
        console.error('Error updating rescue status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
}; 