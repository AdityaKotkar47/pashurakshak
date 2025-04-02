const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
    addVolunteer,
    getVolunteers,
    deleteVolunteer,
    loginVolunteer,
    getVolunteerProfile,
    getMissions,
    updateMissionStatus,
    addMissionNotes
} = require('../controllers/volunteerController');

// Public test endpoint - no auth required
router.get('/public-test', (req, res) => {
    console.log('PUBLIC TEST: Reached the public test endpoint');
    res.status(200).json({
        success: true,
        message: "Public API test successful",
        timestamp: new Date().toISOString(),
        headers: {
            authorization: req.headers.authorization ? 'Present' : 'Absent',
            contentType: req.headers['content-type'],
            origin: req.headers.origin,
            host: req.headers.host
        }
    });
});

// Simple test endpoint - no auth required
router.get('/test', (req, res) => {
    res.status(200).json({
        success: true,
        message: "Volunteer routes are working",
        timestamp: new Date().toISOString()
    });
});

// Simple token info endpoint - only basic auth, no role restriction
router.get('/token-info', (req, res) => {
    const token = req.headers.authorization && req.headers.authorization.startsWith('Bearer') 
        ? req.headers.authorization.split(' ')[1] 
        : req.headers.authorization;
    
    if (!token) {
        return res.status(400).json({
            success: false,
            message: "No token provided in Authorization header"
        });
    }
    
    try {
        // Just decode without verification to see what's in the token
        const decoded = jwt.decode(token);
        res.status(200).json({
            success: true,
            message: "Token decoded (but not verified)",
            token_info: {
                header: decoded ? decoded.header : null,
                payload: decoded,
                token_parts: token.split('.').length
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to decode token",
            error: error.message
        });
    }
});

// Public route for volunteer login
router.post('/login', loginVolunteer);

// Public route for direct mobile login
router.post('/m-login', (req, res) => {
    console.log('M-LOGIN: Using mobile-friendly login endpoint');
    return loginVolunteer(req, res);
});

// Debug route to verify token - no role restriction
router.get('/verify-token', protect, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Token is valid",
        data: {
            user: {
                id: req.user._id,
                name: req.user.name,
                userType: req.userType
            }
        }
    });
});

// Test missions endpoint with basic protection only (no role check)
router.get('/debug-missions', protect, async (req, res) => {
    try {
        const volunteerId = req.user._id;
        
        // Log the volunteer ID from the request
        console.log(`Debug missions: Volunteer ID from request: ${volunteerId}`);
        
        // Check if the ID is valid
        const mongoose = require('mongoose');
        const isValidId = mongoose.Types.ObjectId.isValid(volunteerId);
        console.log(`Debug missions: Is valid ObjectId: ${isValidId}`);
        
        // Log user type
        console.log(`Debug missions: User type: ${req.userType}`);
        
        // Get the user from DB directly to verify it exists
        const Volunteer = require('../models/Volunteer');
        const volunteer = await Volunteer.findById(volunteerId).select('-password');
        
        if (!volunteer) {
            console.log(`Debug missions: No volunteer found with ID: ${volunteerId}`);
            return res.status(404).json({
                success: false,
                message: 'Volunteer not found in database',
                userFromToken: {
                    id: volunteerId,
                    type: req.userType
                }
            });
        }
        
        console.log(`Debug missions: Found volunteer: ${volunteer.name}`);
        
        // Respond with basic volunteer info
        res.status(200).json({
            success: true,
            message: 'Volunteer found',
            userType: req.userType,
            volunteer: {
                id: volunteer._id,
                name: volunteer.name,
                email: volunteer.email,
                ngo: volunteer.ngo,
                activeRescuesCount: volunteer.activeRescues?.length || 0
            }
        });
    } catch (error) {
        console.error('Debug missions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error in debug missions endpoint',
            error: error.message,
            stack: error.stack
        });
    }
});

// Mobile-friendly version of all routes with m- prefix
// This helps bypass Vercel security checkpoints for mobile apps
router.get('/m-profile', protect, (req, res) => {
    console.log('M-PROFILE: Using mobile-friendly profile endpoint');
    return getVolunteerProfile(req, res);
});
router.get('/m-missions', protect, (req, res) => {
    console.log('M-MISSIONS: Using mobile-friendly missions endpoint');
    return getMissions(req, res);
});
router.put('/m-missions/:id/status', protect, (req, res) => {
    console.log('M-STATUS: Using mobile-friendly status update endpoint');
    return updateMissionStatus(req, res);
});
router.post('/m-missions/:id/notes', protect, (req, res) => {
    console.log('M-NOTES: Using mobile-friendly notes endpoint');
    return addMissionNotes(req, res);
});

// IMPORTANT: All routes below require authentication
// Apply protect middleware once for all routes
router.use(protect);

// IMPORTANT: These routes can be accessed with either /api/volunteers/profile or /api/volunteer/profile
// to maintain compatibility with both plural and singular forms
router.get('/profile', restrictTo('volunteer'), getVolunteerProfile);

// Special error handler for missions route that bypasses restrictTo
router.get('/missions-safe', async (req, res) => {
    try {
        console.log(`MISSIONS-SAFE: Starting with user type: ${req.userType}`);
        
        // Check user type manually to handle edge cases
        if (req.userType !== 'volunteer') {
            console.log(`MISSIONS-SAFE: User type mismatch: ${req.userType} vs volunteer`);
            console.log(`MISSIONS-SAFE: Will try fallback methods`);
            
            // Try to verify the user is a volunteer regardless of the type
            const mongoose = require('mongoose');
            const Volunteer = require('../models/Volunteer');
            const volunteerId = req.user._id;
            
            // Avoid ObjectID errors
            if (!mongoose.Types.ObjectId.isValid(volunteerId)) {
                console.log(`MISSIONS-SAFE: Invalid ObjectID: ${volunteerId}`);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid ID format',
                    userInfo: {
                        id: volunteerId,
                        type: req.userType
                    }
                });
            }
            
            // Try to find the volunteer directly
            const volunteer = await Volunteer.findById(volunteerId).select('name email status');
            
            if (!volunteer) {
                console.log(`MISSIONS-SAFE: Could not find volunteer with ID: ${volunteerId}`);
                return res.status(404).json({
                    success: false,
                    message: 'No volunteer found with the provided ID',
                    userInfo: {
                        id: volunteerId,
                        type: req.userType
                    }
                });
            }
            
            if (volunteer.status !== 'active') {
                console.log(`MISSIONS-SAFE: Volunteer found but not active: ${volunteer.status}`);
                return res.status(403).json({
                    success: false,
                    message: 'Volunteer account is not active',
                    volunteerStatus: volunteer.status
                });
            }
            
            // Override the userType to force it to be 'volunteer'
            console.log(`MISSIONS-SAFE: Volunteer found: ${volunteer.name}, correcting userType`);
            req.userType = 'volunteer';
        }
        
        // Now we can process the request using the same controller
        return getMissions(req, res);
    } catch (error) {
        console.error('MISSIONS-SAFE: Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error processing safe missions request',
            error: error.message,
            stack: error.stack
        });
    }
});

// Mission management routes for volunteers
router.get('/missions', restrictTo('volunteer'), getMissions);
router.put('/missions/:id/status', restrictTo('volunteer'), updateMissionStatus);
router.post('/missions/:id/notes', restrictTo('volunteer'), addMissionNotes);

// Routes below this point require NGO authentication
router.use(restrictTo('ngo'));

// Volunteer management routes (for NGO admins)
router.post('/add', addVolunteer);
router.get('/', getVolunteers);
router.delete('/remove/:volunteerId', deleteVolunteer);

module.exports = router;