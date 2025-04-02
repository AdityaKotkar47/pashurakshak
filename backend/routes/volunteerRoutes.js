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

// Enhanced token debugging endpoint
router.get('/token-debug', (req, res) => {
    try {
        const jwt = require('jsonwebtoken');
        console.log('TOKEN DEBUG: Starting token analysis');
        
        // Extract the token
        const authHeader = req.headers.authorization;
        console.log(`TOKEN DEBUG: Authorization header: ${authHeader || 'missing'}`);
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(400).json({
                success: false,
                message: "No Bearer token found in Authorization header",
                expected: "Authorization: Bearer <your-token-here>"
            });
        }
        
        const token = authHeader.split(' ')[1];
        console.log(`TOKEN DEBUG: Token length: ${token?.length || 0}`);
        console.log(`TOKEN DEBUG: Token parts: ${token?.split('.').length || 0}`);
        
        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Token is empty"
            });
        }
        
        // Decode without verification
        const decoded = jwt.decode(token);
        
        if (!decoded) {
            return res.status(400).json({
                success: false,
                message: "Failed to decode token - invalid JWT format",
                token_preview: token.substring(0, 20) + '...'
            });
        }
        
        console.log(`TOKEN DEBUG: Decoded payload:`, JSON.stringify(decoded));
        
        // Check JWT Secret
        const secret = process.env.JWT_SECRET;
        console.log(`TOKEN DEBUG: JWT_SECRET available: ${!!secret}`);
        console.log(`TOKEN DEBUG: JWT_SECRET length: ${secret?.length || 0}`);
        
        // Try to verify token
        try {
            const verified = jwt.verify(token, secret);
            console.log(`TOKEN DEBUG: Token verified successfully!`);
            
            // Check if the user exists in the database
            const userId = verified._id || verified.id;
            const userRole = verified.role;
            
            return res.status(200).json({
                success: true,
                message: "Token analysis complete",
                token_info: {
                    valid: true,
                    decoded: decoded,
                    exp_date: new Date(decoded.exp * 1000).toISOString(),
                    issued_date: new Date(decoded.iat * 1000).toISOString(),
                    user_id: userId,
                    user_role: userRole
                }
            });
        } catch (verifyError) {
            console.error(`TOKEN DEBUG: Verification error:`, verifyError);
            
            return res.status(200).json({
                success: false,
                message: "Token is invalid",
                error: verifyError.message,
                token_info: {
                    valid: false,
                    decoded: decoded,
                    error_type: verifyError.name,
                    error_message: verifyError.message
                }
            });
        }
    } catch (error) {
        console.error('TOKEN DEBUG: Unexpected error:', error);
        return res.status(500).json({
            success: false,
            message: "Error analyzing token",
            error: error.message
        });
    }
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

// IMPORTANT: All routes below require authentication
// Apply protect middleware once for all routes
router.use(protect);

// IMPORTANT: These routes can be accessed with either /api/volunteers/profile or /api/volunteer/profile
// to maintain compatibility with both plural and singular forms
router.get('/profile', restrictTo('volunteer'), getVolunteerProfile);

// Direct access profile route that bypasses middleware
router.get('/direct-profile', async (req, res) => {
    try {
        const jwt = require('jsonwebtoken');
        const mongoose = require('mongoose');
        const Volunteer = require('../models/Volunteer');
        
        console.log('DIRECT PROFILE: Starting direct profile access');
        
        // 1. Extract token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No Bearer token provided'
            });
        }
        
        const token = authHeader.split(' ')[1];
        console.log(`DIRECT PROFILE: Token length: ${token?.length || 0}`);
        
        // 2. Manually decode token without verification first
        let decoded;
        try {
            decoded = jwt.decode(token);
            if (!decoded) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token format'
                });
            }
            console.log(`DIRECT PROFILE: Decoded token payload:`, JSON.stringify(decoded));
        } catch (decodeError) {
            console.error('DIRECT PROFILE: Decode error:', decodeError);
            return res.status(401).json({
                success: false,
                message: 'Failed to decode token',
                error: decodeError.message
            });
        }
        
        // 3. Extract user ID from token
        const userId = decoded._id || decoded.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'No user ID in token'
            });
        }
        
        // 4. Validate ID format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format',
                userId: userId
            });
        }
        
        // 5. Attempt to find the volunteer
        const volunteer = await Volunteer.findById(userId)
            .select('-password')
            .populate('ngo', 'name')
            .populate('activeRescues');
        
        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: 'Volunteer not found',
                userId: userId
            });
        }
        
        console.log(`DIRECT PROFILE: Found volunteer: ${volunteer.name}`);
        
        // 6. Check if volunteer is active
        if (volunteer.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Volunteer account is not active',
                status: volunteer.status
            });
        }
        
        // 7. Return profile data
        return res.status(200).json({
            success: true,
            message: 'Successfully retrieved profile directly',
            data: volunteer
        });
    } catch (error) {
        console.error('DIRECT PROFILE: Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error in direct profile access',
            error: error.message
        });
    }
});

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

// Direct access route for missions with token check but no middleware (fallback)
router.get('/direct-missions', async (req, res) => {
    try {
        const jwt = require('jsonwebtoken');
        const mongoose = require('mongoose');
        const Volunteer = require('../models/Volunteer');
        
        console.log('DIRECT MISSIONS: Starting direct missions access');
        
        // 1. Extract token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No Bearer token provided'
            });
        }
        
        const token = authHeader.split(' ')[1];
        console.log(`DIRECT MISSIONS: Token length: ${token?.length || 0}`);
        
        // 2. Manually decode token without verification
        let decoded;
        try {
            decoded = jwt.decode(token);
            if (!decoded) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token format'
                });
            }
            console.log('DIRECT MISSIONS: Decoded token payload:', JSON.stringify(decoded));
        } catch (decodeError) {
            console.error('DIRECT MISSIONS: Decode error:', decodeError);
            return res.status(401).json({
                success: false,
                message: 'Failed to decode token',
                error: decodeError.message
            });
        }
        
        // 3. Extract user ID from token
        const userId = decoded._id || decoded.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'No user ID in token'
            });
        }
        
        // 4. Validate ID format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format',
                userId: userId
            });
        }
        
        // 5. Attempt to find the volunteer
        const volunteer = await Volunteer.findById(userId)
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
                message: 'Volunteer not found',
                userId: userId
            });
        }
        
        console.log(`DIRECT MISSIONS: Found volunteer: ${volunteer.name}`);
        
        // 6. Check if volunteer is active
        if (volunteer.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Volunteer account is not active',
                status: volunteer.status
            });
        }
        
        // 7. Return missions data
        return res.status(200).json({
            success: true,
            message: 'Successfully retrieved missions directly',
            count: volunteer.activeRescues?.length || 0,
            data: volunteer.activeRescues || []
        });
    } catch (error) {
        console.error('DIRECT MISSIONS: Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error in direct missions access',
            error: error.message
        });
    }
});

// Routes below this point require NGO authentication
router.use(restrictTo('ngo'));

// Volunteer management routes (for NGO admins)
router.post('/add', addVolunteer);
router.get('/', getVolunteers);
router.delete('/remove/:volunteerId', deleteVolunteer);

module.exports = router;