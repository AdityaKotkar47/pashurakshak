const Ngo = require('../models/Ngo');
const jwt = require('jsonwebtoken');
const { sendApprovalEmail, sendRejectionEmail, sendRegistrationEmail } = require('../utils/emailService');
const crypto = require('crypto');

// Generate JWT Token
const generateToken = (id) => {
  // Use the full JWT_SECRET to match the auth middleware
  const secret = process.env.JWT_SECRET;
  return jwt.sign({ id, role: 'ngo' }, secret, {
    expiresIn: '30d',
    algorithm: 'HS256'
  });
};

// Register NGO
exports.registerNgo = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      contactPerson,
      organizationType,
      registrationNumber,
      address,
      focusAreas,
      website,
      documents
    } = req.body;

    // Check if NGO already exists
    const existingNgo = await Ngo.findOne({ email });
    
    if (existingNgo) {
      return res.status(400).json({
        success: false,
        message: 'NGO with this email already exists'
      });
    }

    // Validate documents - ensure they have URLs to Cloudinary
    if (!documents || !documents.registrationCertificate) {
      return res.status(400).json({
        success: false,
        message: 'Registration certificate URL is required'
      });
    }

    // Validate registration certificate URL is from Cloudinary
    if (!documents.registrationCertificate.includes('cloudinary.com')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Cloudinary URL for the registration certificate'
      });
    }

    // Create NGO
    const ngo = await Ngo.create({
      name,
      email,
      password,
      contactPerson,
      organizationType,
      registrationNumber,
      address,
      focusAreas,
      website,
      documents,
      status: 'pending'
    });

    // Send registration confirmation email
    await sendRegistrationEmail(email, name, ngo._id);

    res.status(201).json({
      success: true,
      message: 'NGO registration submitted successfully',
      data: {
        id: ngo._id,
        name: ngo.name,
        email: ngo.email,
        status: ngo.status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in NGO registration',
      error: error.message
    });
  }
};

// Login NGO
exports.loginNgo = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if NGO exists and is approved
    const ngo = await Ngo.findOne({ email }).select('+password');
    
    if (!ngo || !(await ngo.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (ngo.status !== 'approved') {
      return res.status(401).json({
        success: false,
        message: 'Your registration is not approved yet'
      });
    }

    // Generate token
    const token = generateToken(ngo._id);

    res.status(200).json({
      success: true,
      token,
      data: {
        id: ngo._id,
        name: ngo.name,
        email: ngo.email,
        status: ngo.status,
        state: ngo.state,
        district: ngo.district
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in NGO login',
      error: error.message
    });
  }
};

// Get all NGOs (Admin only)
exports.getAllNgos = async (req, res) => {
  try {
    const ngos = await Ngo.find().select('-password -registrationCertificate -panCard');
    
    res.status(200).json({
      success: true,
      count: ngos.length,
      data: ngos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching NGOs',
      error: error.message
    });
  }
};

// Get pending NGO requests (Admin only)
exports.getNgoPendingRequests = async (req, res) => {
  try {
    const pendingNgos = await Ngo.find({ status: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: pendingNgos.length,
      data: pendingNgos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending NGO requests',
      error: error.message
    });
  }
};

// Approve NGO
exports.approveNgo = async (req, res) => {
  try {
    // Find the NGO
    const ngo = await Ngo.findById(req.params.id);
    
    if (!ngo) {
      return res.status(404).json({
        success: false,
        message: 'NGO not found'
      });
    }

    // Check if already approved
    if (ngo.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'NGO is already approved'
      });
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    
    console.log('Processing approval for NGO:', ngo.name);
    console.log('Email will be sent to:', ngo.email);

    // Send approval email first
    const emailSent = await sendApprovalEmail(ngo.email, tempPassword, ngo.name);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send approval email. Please try again.'
      });
    }

    // If email sent successfully, update NGO status
    ngo.status = 'approved';
    ngo.password = tempPassword;
    await ngo.save();

    res.status(200).json({
      success: true,
      message: 'NGO approved successfully. Login credentials have been sent to ' + ngo.email
    });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in NGO approval process',
      error: error.message
    });
  }
};

// Reject NGO (Admin only)
exports.rejectNgo = async (req, res) => {
  try {
    const { reason } = req.body;
    const ngo = await Ngo.findById(req.params.id);
    
    if (!ngo) {
      return res.status(404).json({
        success: false,
        message: 'NGO not found'
      });
    }

    if (ngo.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'NGO is already rejected'
      });
    }

    // Update NGO status
    ngo.status = 'rejected';
    ngo.rejectionReason = reason;
    await ngo.save();

    // Send rejection email
    await sendRejectionEmail(ngo.email, ngo.name, reason);

    res.status(200).json({
      success: true,
      message: 'NGO rejected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting NGO',
      error: error.message
    });
  }
};

// Get NGO Profile
exports.getNgoProfile = async (req, res) => {
  try {
    const ngo = await Ngo.findById(req.user.id)
      .select('-password -registrationCertificate -panCard');
    
    if (!ngo) {
      return res.status(404).json({
        success: false,
        message: 'NGO not found'
      });
    }

    res.status(200).json({
      success: true,
      data: ngo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching NGO profile',
      error: error.message
    });
  }
}; 