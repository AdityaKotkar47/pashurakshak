const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Ngo = require('../models/Ngo');
const Volunteer = require('../models/Volunteer');

exports.protect = async (req, res, next) => {
  try {
    let token;
    console.log('Auth middleware: Checking for token');
    
    // Get full authorization header for debugging
    const fullAuthHeader = req.headers.authorization;
    console.log(`Auth middleware: Authorization header present: ${!!fullAuthHeader}`);
    
    // Start by checking Authorization: Bearer
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log(`Auth middleware: Token from Auth header, length: ${token?.length || 0}`);
      
      // Check token format is correct (three parts separated by periods)
      if (token && token.split('.').length !== 3) {
        console.log(`Auth middleware: Malformed token detected, parts: ${token.split('.').length}`);
        return res.status(401).json({
          success: false,
          message: 'Invalid token format'
        });
      }
    } 
    // Fallback to cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
      console.log('Auth middleware: Token found in cookies');
    } 
    // Fallback to query params
    else if (req.query && req.query.token) {
      token = req.query.token;
      console.log('Auth middleware: Token found in query params');
    }

    if (!token) {
      console.log('Auth middleware: No token provided');
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }

    // Attempt to verify the token
    try {
      console.log(`Auth middleware: JWT_SECRET length: ${process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'undefined'}`);
      console.log('Auth middleware: Verifying token');
      
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtError) {
        console.error(`Auth middleware: JWT Verification failed: ${jwtError.message}`);
        
        // Special handling for different JWT errors
        if (jwtError.name === 'JsonWebTokenError') {
          return res.status(401).json({
            success: false,
            message: 'Invalid token signature',
            details: 'The token signature does not match. This may be due to different JWT_SECRET values between environments.'
          });
        } else if (jwtError.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token expired',
            details: 'Please login again to get a new token'
          });
        } else {
          return res.status(401).json({
            success: false,
            message: 'Token verification failed',
            error: jwtError.message
          });
        }
      }
      
      console.log(`Auth middleware: Token decoded successfully`);
      
      // Use either _id or id from the token
      const userId = decoded._id || decoded.id;
      if (!userId) {
        console.log('Auth middleware: No user ID found in token');
        return res.status(401).json({
          success: false,
          message: 'Invalid token: No user ID found'
        });
      }
      
      console.log(`Auth middleware: User ID from token: ${userId}`);
      
      // Check if it's a valid MongoDB ObjectId
      const isValidObjectId = mongoose.Types.ObjectId.isValid(userId);
      console.log(`Auth middleware: Is valid ObjectId: ${isValidObjectId}`);
      
      if (!isValidObjectId) {
        console.log(`Auth middleware: Invalid ObjectId format: ${userId}`);
        return res.status(401).json({
          success: false,
          message: 'Not authorized, invalid user ID format'
        });
      }
      
      // Get role from token
      const role = decoded.role;
      console.log(`Auth middleware: Role from token: ${role || 'undefined'}`);
      
      // Simplify the flow - first try to find the user based on role
      if (role === 'volunteer') {
        // Special handling for volunteers
        try {
          console.log(`Auth middleware: Looking for volunteer with ID: ${userId}`);
          const volunteer = await Volunteer.findById(userId).select('-password');
          
          if (volunteer) {
            console.log(`Auth middleware: Volunteer found: ${volunteer.name}, status: ${volunteer.status}`);
            
            if (volunteer.status !== 'active') {
              console.log(`Auth middleware: Volunteer not active: ${volunteer.status}`);
              return res.status(403).json({
                success: false,
                message: 'Your account is inactive. Please contact your NGO.'
              });
            }
            
            req.user = volunteer;
            req.userType = 'volunteer';
            console.log(`Auth middleware: Setting userType to: volunteer`);
            return next();
          } else {
            console.log(`Auth middleware: No volunteer found with ID: ${userId}`);
          }
        } catch (error) {
          console.error(`Auth middleware: Error finding volunteer:`, error);
        }
      } else if (role === 'admin' || role === 'user') {
        // Regular user or admin
        try {
          console.log(`Auth middleware: Looking for user with ID: ${userId}`);
          const user = await User.findById(userId);
          if (user) {
            console.log(`Auth middleware: User found: ${user.name}, role: ${user.role}`);
            req.user = user;
            req.userType = user.role;
            return next();
          } else {
            console.log(`Auth middleware: No user found with ID: ${userId}`);
          }
        } catch (error) {
          console.error(`Auth middleware: Error finding user:`, error);
        }
      } else if (role === 'ngo') {
        // NGO
        try {
          console.log(`Auth middleware: Looking for NGO with ID: ${userId}`);
          const ngo = await Ngo.findById(userId);
          if (ngo) {
            console.log(`Auth middleware: NGO found: ${ngo.name}`);
            req.user = ngo;
            req.userType = 'ngo';
            return next();
          } else {
            console.log(`Auth middleware: No NGO found with ID: ${userId}`);
          }
        } catch (error) {
          console.error(`Auth middleware: Error finding NGO:`, error);
        }
      }
      
      // If we couldn't find the user based on role, try all collections
      console.log(`Auth middleware: Trying all collections to find user`);
      
      // Try volunteer first (most common for this application)
      try {
        const volunteer = await Volunteer.findById(userId).select('-password');
        if (volunteer) {
          console.log(`Auth middleware: Volunteer found in all-collections search: ${volunteer.name}`);
          
          if (volunteer.status !== 'active') {
            console.log(`Auth middleware: Volunteer not active: ${volunteer.status}`);
            return res.status(403).json({
              success: false,
              message: 'Your account is inactive. Please contact your NGO.'
            });
          }
          
          req.user = volunteer;
          req.userType = 'volunteer';
          return next();
        }
      } catch (error) {
        console.error(`Auth middleware: Error in volunteer search:`, error);
      }
      
      // Try user next
      try {
        const user = await User.findById(userId);
        if (user) {
          console.log(`Auth middleware: User found in all-collections search: ${user.name}`);
          req.user = user;
          req.userType = user.role;
          return next();
        }
      } catch (error) {
        console.error(`Auth middleware: Error in user search:`, error);
      }
      
      // Try NGO last
      try {
        const ngo = await Ngo.findById(userId);
        if (ngo) {
          console.log(`Auth middleware: NGO found in all-collections search: ${ngo.name}`);
          req.user = ngo;
          req.userType = 'ngo';
          return next();
        }
      } catch (error) {
        console.error(`Auth middleware: Error in NGO search:`, error);
      }
      
      // If we get here, we couldn't find the user in any collection
      console.log(`Auth middleware: User not found in any collection: ${userId}`);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    } catch (error) {
      console.error(`Auth middleware general error:`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authentication',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Auth middleware fatal error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication',
      error: error.message
    });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    console.log(`restrictTo middleware: Checking if ${req.userType} is allowed among [${roles.join(', ')}]`);
    
    if (!req.userType) {
      console.log('restrictTo middleware: No userType set');
      return res.status(401).json({
        success: false,
        message: 'Authentication required before role check'
      });
    }
    
    if (!roles.includes(req.userType)) {
      console.log(`restrictTo middleware: Access denied for ${req.userType}`);
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    
    console.log(`restrictTo middleware: Access granted for ${req.userType}`);
    next();
  };
}; 