const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Create fileUpload middleware configuration
const fileUploadConfig = {
    useTempFiles: true,
    tempFileDir: '/tmp',
    createParentPath: true,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    debug: true,
    abortOnLimit: true,
    responseOnLimit: 'File size limit has been reached'
};

const createApp = () => {
    const app = express();

    // Middleware
    app.use(cors({
        origin: '*',
        credentials: true
    }));

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Create /tmp directory if it doesn't exist
    const tmpDir = '/tmp';
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Set up EJS as the view engine
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '../views'));

    // Basic route for API health check
    app.get('/', (req, res) => {
        res.json({ message: 'API is running' });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error('Error:', err);
        res.status(500).json({
            success: false,
            message: 'Something went wrong!',
            error: err.message
        });
    });

    return app;
};

module.exports = createApp;
module.exports.fileUploadConfig = fileUploadConfig; 