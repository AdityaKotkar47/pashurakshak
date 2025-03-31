const Volunteer = require('../models/Volunteer');
const { sendVolunteerEmail } = require('../utils/emailService');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id, role: 'volunteer' }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Login volunteer
exports.loginVolunteer = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if volunteer exists
        const volunteer = await Volunteer.findOne({ email }).select('+password');

        if (!volunteer) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if password matches
        const isMatch = await volunteer.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if volunteer is active
        if (volunteer.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Your account is currently inactive. Please contact your NGO.'
            });
        }

        const token = generateToken(volunteer._id);

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