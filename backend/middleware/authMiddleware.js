const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Ngo = require('../models/Ngo');
const Volunteer = require('../models/Volunteer');

exports.protect = async (req, res, next) => {
  try {
    let token;
    console.log('Auth middleware: Checking for token');
    console.log('Auth Headers:', JSON.stringify(req.headers));

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log(`Auth middleware: Token found in Authorization header: ${token ? token.substring(0, 15) + '...' : 'undefined'}`);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
      console.log('Auth middleware: Token found in cookies');
    } else if (req.query && req.query.token) {
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

    try {
      console.log(`Auth middleware: JWT_SECRET length: ${process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'undefined'}`);
      console.log('Auth middleware: Verifying token');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`Auth middleware: Decoded token:`, JSON.stringify(decoded));
      
      // Use either _id or id from the token
      const userId = decoded._id || decoded.id;
      if (!userId) {
        console.log('Auth middleware: No user ID found in token');
        throw new Error('Invalid token: No user ID');
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
          console.log(`Auth middleware: Checking for volunteer with ID: ${userId}`);
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
          console.log(`Auth middleware: Checking for user with ID: ${userId}`);
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
          console.log(`Auth middleware: Checking for NGO with ID: ${userId}`);
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
      
      // If we couldn't find the user based on role or no role was provided,
      // try to find by ID in all collections as a fallback
      console.log(`Auth middleware: Trying to find user in all collections`);
      
      // Try volunteer first (most common for this application)
      try {
        const volunteer = await Volunteer.findById(userId).select('-password');
        if (volunteer) {
          console.log(`Auth middleware: Volunteer found in fallback search: ${volunteer.name}`);
          
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
        console.error(`Auth middleware: Error in fallback volunteer search:`, error);
      }
      
      // Try admin user
      try {
        const user = await User.findById(userId);
        if (user) {
          console.log(`Auth middleware: User found in fallback search: ${user.name}`);
          req.user = user;
          req.userType = user.role;
          return next();
        }
      } catch (error) {
        console.error(`Auth middleware: Error in fallback user search:`, error);
      }
      
      // Try NGO
      try {
        const ngo = await Ngo.findById(userId);
        if (ngo) {
          console.log(`Auth middleware: NGO found in fallback search: ${ngo.name}`);
          req.user = ngo;
          req.userType = 'ngo';
          return next();
        }
      } catch (error) {
        console.error(`Auth middleware: Error in fallback NGO search:`, error);
      }
      
      console.log(`Auth middleware: User not found for token ID: ${userId}`);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    } catch (err) {
      console.error(`Auth middleware: Token verification failed:`, err);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
        error: err.message
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
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