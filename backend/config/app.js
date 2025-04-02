const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
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
    responseOnLimit: 'File size limit exceeded (10MB)'
};

const createApp = () => {
    const app = express();

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(morgan('dev'));

    // Serve static files
    app.use(express.static(path.join(__dirname, '../public')));

    // Add Vercel Bot detection bypass header
    app.use((req, res, next) => {
        res.setHeader('X-Vercel-Bot-Detection-Bypass', 'true');
        next();
    });

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