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