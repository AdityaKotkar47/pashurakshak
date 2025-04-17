const Volunteer = require('../models/Volunteer');
const { sendVolunteerEmail } = require('../utils/emailService');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const RescueRequest = require('../models/RescueRequest');
const mongoose = require('mongoose');

// Generate JWT Token
const generateToken = (id) => {
    // Make sure we're using the same secret as in the auth middleware
    console.log(`Generating token for volunteer ID: ${id}`);
    console.log(`ID type: ${typeof id}`);
    
    // Convert to string if it's an ObjectId
    const idStr = id.toString();
    console.log(`ID string: ${idStr}, length: ${idStr.length}`);
    
    // IMPORTANT: Use a consistent payload structure
    // Simplify payload to reduce token size and potential issues
    const payload = { 
        id: idStr,  // Use 'id' as primary identifier  
        role: 'volunteer',
        timestamp: Date.now()
    };
    console.log(`Token payload:`, JSON.stringify(payload));
    
    // Verify JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not defined in environment variables');
        throw new Error('JWT_SECRET is not defined');
    }
    
    // Use the full JWT_SECRET to match the auth middleware
    const secret = process.env.JWT_SECRET;
    console.log(`Using full JWT_SECRET length: ${secret.length}`);
    
    // Use HS256 algorithm explicitly 
    const token = jwt.sign(payload, secret, {
        algorithm: 'HS256',
        expiresIn: '30d',
    });
    
    console.log(`Generated token (first 30 chars): ${token.substring(0, 30)}...`);
    return token;
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

        console.log(`Volunteer found: ${volunteer.name}, ID: ${volunteer._id}`);
        const token = generateToken(volunteer._id);
        console.log(`Generated token for volunteer: ${volunteer._id}, token length: ${token.length}`);

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
        console.log(`--------------------------------------------------------`);
        console.log(`GET MISSIONS: Starting request for volunteer missions`);
        const volunteerId = req.user._id;
        console.log(`GET MISSIONS: Volunteer ID from request: ${volunteerId}`);
        console.log(`GET MISSIONS: Volunteer user type: ${req.userType}`);
        
        // Add check for valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(volunteerId)) {
            console.log(`GET MISSIONS: Invalid ObjectId: ${volunteerId}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid volunteer ID format'
            });
        }
        
        console.log(`GET MISSIONS: Finding volunteer in database`);

        // First get the volunteer without populating activeRescues to check if they exist
        const volunteerCheck = await Volunteer.findById(volunteerId).select('-password');
        
        if (!volunteerCheck) {
            console.log(`GET MISSIONS: No volunteer found with ID: ${volunteerId}`);
            return res.status(404).json({
                success: false,
                message: 'Volunteer not found'
            });
        }
        
        console.log(`GET MISSIONS: Found volunteer: ${volunteerCheck.name}`);
        console.log(`GET MISSIONS: Active rescues IDs: ${JSON.stringify(volunteerCheck.activeRescues || [])}`);
        
        // Check if volunteer has any active rescue IDs stored
        if (!volunteerCheck.activeRescues || volunteerCheck.activeRescues.length === 0) {
            console.log(`GET MISSIONS: Volunteer has no active rescue missions in their record`);
            return res.status(200).json({
                success: true,
                message: 'No active rescue missions found for this volunteer',
                count: 0,
                data: []
            });
        }
        
        // Now try to populate the missions
        try {
            console.log(`GET MISSIONS: Attempting to populate rescue missions`);
            const volunteer = await Volunteer.findById(volunteerId)
                .select('-password')
                .populate({
                    path: 'activeRescues',
                    populate: [
                        { path: 'userId', select: 'name' },
                        { path: 'assignedTo.ngo', select: 'name' }
                    ]
                });
                
            console.log(`GET MISSIONS: Successfully populated missions`);
            
            // Guard against bad data in the populated result
            if (!volunteer.activeRescues || !Array.isArray(volunteer.activeRescues)) {
                console.log(`GET MISSIONS: Populated activeRescues is not an array or is missing`);
                return res.status(200).json({
                    success: true,
                    message: 'No valid rescue missions found',
                    count: 0,
                    data: []
                });
            }
            
            // Filter out any null/undefined entries that might have come from bad references
            const validMissions = volunteer.activeRescues.filter(mission => mission);
            
            if (validMissions.length === 0) {
                console.log(`GET MISSIONS: No valid missions after filtering`);
                return res.status(200).json({
                    success: true,
                    message: 'No valid rescue missions found after filtering',
                    count: 0,
                    data: []
                });
            }
            
            console.log(`GET MISSIONS: Returning ${validMissions.length} valid missions`);
            
            // Return the missions
            return res.status(200).json({
                success: true,
                count: validMissions.length,
                data: validMissions
            });
        } catch (populateError) {
            console.error(`GET MISSIONS: Error populating missions:`, populateError);
            // If population fails, try to get the raw missions by ID
            
            try {
                console.log(`GET MISSIONS: Attempting direct rescue request lookup`);
                const missionIds = volunteerCheck.activeRescues;
                const missions = await RescueRequest.find({
                    _id: { $in: missionIds }
                });
                
                console.log(`GET MISSIONS: Direct lookup found ${missions.length} missions`);
                
                return res.status(200).json({
                    success: true,
                    message: 'Retrieved missions via direct lookup',
                    count: missions.length,
                    data: missions
                });
            } catch (directLookupError) {
                console.error(`GET MISSIONS: Direct lookup also failed:`, directLookupError);
                
                // Return at least the IDs if nothing else works
                return res.status(200).json({
                    success: true,
                    message: 'Could not populate missions, returning IDs only',
                    count: volunteerCheck.activeRescues.length,
                    data: volunteerCheck.activeRescues.map(id => ({ _id: id, rawId: true }))
                });
            }
        }
    } catch (error) {
        console.error('GET MISSIONS: Error fetching volunteer missions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching volunteer missions',
            error: error.message,
            stack: error.stack
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