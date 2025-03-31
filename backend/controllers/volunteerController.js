const Volunteer = require('../models/Volunteer');
const { sendVolunteerEmail } = require('../utils/emailService');
const crypto = require('crypto');

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