const Volunteer = require('../models/Volunteer');
const { sendVolunteerEmail } = require('../utils/emailService');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const RescueRequest = require('../models/RescueRequest');

// Generate JWT Token
const generateToken = (id) => {
    // Make sure we're using the same secret as in the auth middleware
    console.log(`Generating token for volunteer ID: ${id}`);
    // Use consistent field name '_id' instead of 'id' to match document fields
    const payload = { _id: id, id: id, role: 'volunteer' };
    console.log(`Token payload:`, JSON.stringify(payload));
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Login volunteer
exports.loginVolunteer = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`Volunteer login attempt for: ${email}`);

        // Check if volunteer exists
        const volunteer = await Volunteer.findOne({ email }).select('+password');

        if (!volunteer) {
            console.log(`No volunteer found with email: ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if password matches
        const isMatch = await volunteer.comparePassword(password);

        if (!isMatch) {
            console.log(`Password mismatch for volunteer: ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if volunteer is active
        if (volunteer.status !== 'active') {
            console.log(`Inactive volunteer: ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Your account is currently inactive. Please contact your NGO.'
            });
        }

        const token = generateToken(volunteer._id);
        console.log(`Generated token for volunteer: ${volunteer._id}, token: ${token.substring(0, 20)}...`);

        // Remove password from response
        const volunteerResponse = volunteer.toObject();
        delete volunteerResponse.password;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                volunteer: volunteerResponse
            }
        });
    } catch (error) {
        console.error('Volunteer login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    }
};

// Add a new volunteer
exports.addVolunteer = async (req, res) => {
    try {
        const { name, email } = req.body;
        const ngoId = req.user._id;

        // Check if volunteer with this email already exists
        const existingVolunteer = await Volunteer.findOne({ email });
        if (existingVolunteer) {
            return res.status(400).json({
                success: false,
                message: 'A volunteer with this email already exists'
            });
        }

        // Generate a random password
        const password = crypto.randomBytes(4).toString('hex');

        // Create volunteer
        const volunteer = await Volunteer.create({
            name,
            email,
            password,
            ngo: ngoId
        });

        // Send email with credentials
        await sendVolunteerEmail(email, password, name, req.user.name);

        // Remove password from response
        const volunteerResponse = volunteer.toObject();
        delete volunteerResponse.password;

        res.status(201).json({
            success: true,
            message: 'Volunteer added successfully',
            data: volunteerResponse
        });
    } catch (error) {
        console.error('Add volunteer error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding volunteer',
            error: error.message
        });
    }
};

// Get all volunteers for an NGO
exports.getVolunteers = async (req, res) => {
    try {
        const ngoId = req.user._id;

        const volunteers = await Volunteer.find({ ngo: ngoId })
            .select('-password')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: volunteers.length,
            data: volunteers
        });
    } catch (error) {
        console.error('Get volunteers error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching volunteers',
            error: error.message
        });
    }
};

// Delete a volunteer
exports.deleteVolunteer = async (req, res) => {
    try {
        const { volunteerId } = req.params;
        const ngoId = req.user._id;

        // Find volunteer and check if belongs to the NGO
        const volunteer = await Volunteer.findOne({
            _id: volunteerId,
            ngo: ngoId
        });

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: 'Volunteer not found or not authorized'
            });
        }

        // Delete the volunteer
        await Volunteer.deleteOne({ _id: volunteerId });

        res.status(200).json({
            success: true,
            message: 'Volunteer deleted successfully'
        });
    } catch (error) {
        console.error('Delete volunteer error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting volunteer',
            error: error.message
        });
    }
};

// Get volunteer profile
exports.getVolunteerProfile = async (req, res) => {
    try {
        const volunteerId = req.user._id;

        const volunteer = await Volunteer.findById(volunteerId)
            .select('-password')
            .populate('ngo', 'name')
            .populate('activeRescues');

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: 'Volunteer not found'
            });
        }

        res.status(200).json({
            success: true,
            data: volunteer
        });
    } catch (error) {
        console.error('Get volunteer profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching volunteer profile',
            error: error.message
        });
    }
};

// Get assigned rescue missions for a volunteer
exports.getMissions = async (req, res) => {
    try {
        const volunteerId = req.user._id;

        const volunteer = await Volunteer.findById(volunteerId)
            .select('-password')
            .populate({
                path: 'activeRescues',
                populate: [
                    { path: 'userId', select: 'name' },
                    { path: 'assignedTo.ngo', select: 'name' }
                ]
            });

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: 'Volunteer not found'
            });
        }

        res.status(200).json({
            success: true,
            count: volunteer.activeRescues.length,
            data: volunteer.activeRescues
        });
    } catch (error) {
        console.error('Get volunteer missions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching volunteer missions',
            error: error.message
        });
    }
};

// Update mission status
exports.updateMissionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const volunteerId = req.user._id;

        // Validate status
        const validStatuses = [
            'volunteer_dispatched',
            'reached_location',
            'animal_rescued',
            'returning_to_center',
            'treatment_started'
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Find the rescue request and check if it's assigned to this volunteer
        const rescueRequest = await RescueRequest.findOne({
            _id: id,
            'assignedTo.volunteer': volunteerId
        });

        if (!rescueRequest) {
            return res.status(404).json({
                success: false,
                message: 'Rescue mission not found or not assigned to you'
            });
        }

        // Update rescue request status if needed
        if (status === 'volunteer_dispatched' && rescueRequest.status === 'accepted') {
            rescueRequest.status = 'in_progress';
        } else if (status === 'treatment_started' && rescueRequest.status === 'in_progress') {
            rescueRequest.status = 'completed';
            
            // Update volunteer completed rescues count and remove from active rescues
            await Volunteer.findByIdAndUpdate(volunteerId, {
                $inc: { completedRescues: 1 },
                $pull: { activeRescues: id }
            });
        }

        // Add timeline entry
        rescueRequest.rescueTimeline.push({
            status,
            timestamp: Date.now(),
            notes: notes || `Status updated to ${status}`
        });

        await rescueRequest.save();

        res.status(200).json({
            success: true,
            message: 'Mission status updated successfully',
            data: rescueRequest
        });
    } catch (error) {
        console.error('Update mission status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating mission status',
            error: error.message
        });
    }
};

// Add notes to mission
exports.addMissionNotes = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const volunteerId = req.user._id;

        if (!notes || notes.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Notes cannot be empty'
            });
        }

        // Find the rescue request and check if it's assigned to this volunteer
        const rescueRequest = await RescueRequest.findOne({
            _id: id,
            'assignedTo.volunteer': volunteerId
        });

        if (!rescueRequest) {
            return res.status(404).json({
                success: false,
                message: 'Rescue mission not found or not assigned to you'
            });
        }

        // Add notes to timeline
        rescueRequest.rescueTimeline.push({
            status: rescueRequest.rescueTimeline[rescueRequest.rescueTimeline.length - 1].status,
            timestamp: Date.now(),
            notes: notes
        });

        await rescueRequest.save();

        res.status(200).json({
            success: true,
            message: 'Notes added successfully',
            data: rescueRequest
        });
    } catch (error) {
        console.error('Add mission notes error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding mission notes',
            error: error.message
        });
    }
};