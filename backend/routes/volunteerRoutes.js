const express = require('express');
const router = express.Router();
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
        : null;
    
    if (!token) {
        return res.status(400).json({
            success: false,
            message: "No token provided in Authorization header"
        });
    }
    
    try {
        // Just decode without verification to see what's in the token
        const decoded = require('jsonwebtoken').decode(token);
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

// Middleware to protect routes
router.use(protect);

// IMPORTANT: These routes can be accessed with either /api/volunteers/profile or /api/volunteer/profile
// to maintain compatibility with both plural and singular forms
router.get('/profile', restrictTo('volunteer'), getVolunteerProfile);
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