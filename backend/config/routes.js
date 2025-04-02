const { fileUploadConfig } = require('./app');
const fileUpload = require('express-fileupload');

const setupRoutes = (app) => {
    // Basic health check route
    app.get('/', (req, res) => {
        res.status(200).json({
            success: true,
            message: 'PashuRakshak API is running',
            timestamp: new Date().toISOString()
        });
    });

    // API Routes
    app.use('/api/auth', require('../routes/authRoutes'));
    app.use('/api/admin', require('../routes/adminRoutes'));
    app.use('/api/ngo', require('../routes/ngoRoutes'));
    
    // Use the same volunteer routes for both plural and singular endpoints
    const volunteerRoutes = require('../routes/volunteerRoutes');
    app.use('/api/volunteers', volunteerRoutes);
    app.use('/api/volunteer', volunteerRoutes); // Support singular form for mobile app
    
    app.use('/api/rescue', require('../routes/rescueRequestRoutes'));

    // Apply fileUpload middleware only to upload routes
    app.use('/api/upload', fileUpload(fileUploadConfig), require('../routes/uploadRoutes'));

    // 404 handler for undefined routes
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Endpoint not found'
        });
    });

    // Return the configured app
    return app;
};

module.exports = setupRoutes; 