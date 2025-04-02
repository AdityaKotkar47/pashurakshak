const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Ngo = require('../models/Ngo');
const Volunteer = require('../models/Volunteer');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check for role in the JWT token for role-based authentication
      if (decoded.role) {
        if (decoded.role === 'volunteer') {
          // Check if it's a volunteer
          const volunteer = await Volunteer.findById(decoded.id).select('-password');
          if (volunteer) {
            if (volunteer.status !== 'active') {
              return res.status(403).json({
                success: false,
                message: 'Your account is inactive. Please contact your NGO.'
              });
            }
            req.user = volunteer;
            req.userType = 'volunteer';
            return next();
          }
        } else if (decoded.role === 'admin' || decoded.role === 'user') {
          // Check if it's a user (admin or regular user)
          const user = await User.findById(decoded.id);
          if (user) {
            req.user = user;
            req.userType = user.role;
            return next();
          }
        }
      }
      
      // If no role specified or not found with role, try legacy checks
      // First check if it's an admin user
      const adminUser = await User.findById(decoded.id);
      if (adminUser) {
        req.user = adminUser;
        req.userType = adminUser.role; // 'admin' or 'user'
        return next();
      }

      // If not admin, check NGO
      const ngo = await Ngo.findById(decoded.id);
      if (ngo) {
        req.user = ngo;
        req.userType = 'ngo';
        return next();
      }

      throw new Error('User not found');
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
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
    if (!roles.includes(req.userType)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
}; 