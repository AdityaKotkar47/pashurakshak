const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
    addVolunteer,
    getVolunteers,
    deleteVolunteer,
    loginVolunteer
} = require('../controllers/volunteerController');

// Public route for volunteer login
router.post('/login', loginVolunteer);

// NGO-only routes
router.use(protect);
router.use(restrictTo('ngo'));

// Volunteer routes
router.post('/add', addVolunteer);
router.get('/', getVolunteers);
router.delete('/remove/:volunteerId', deleteVolunteer);

module.exports = router;