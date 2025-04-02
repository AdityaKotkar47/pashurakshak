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

    // Enhanced CORS configuration for mobile apps
    const corsOptions = {
        origin: '*', // Allow all origins
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
        credentials: true,
        maxAge: 86400, // 24 hours
        preflightContinue: false,
        optionsSuccessStatus: 204
    };
    
    // Middleware
    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(morgan('dev'));

    // Enhanced security headers for Vercel deployment
    app.use((req, res, next) => {
        // Multiple bot detection bypass techniques
        res.setHeader('X-Vercel-Skip-Bot-Detection', 'true');
        
        // Security related headers
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        
        // Ensure Access-Control headers are set for all responses
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        
        // No cache for API responses
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        next();
    });

    // Improved handling for OPTIONS requests (preflight)
    app.use((req, res, next) => {
        if (req.method === 'OPTIONS') {
            console.log('Handling OPTIONS request for:', req.path);
            // Return 204 No Content for OPTIONS preflight requests
            return res.status(204).end();
        }
        next();
    });

    // Serve static files
    app.use(express.static(path.join(__dirname, '../public')));

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
        res.json({ 
            message: 'PashuRakshak API is running',
            version: '1.0.0',
            status: 'online',
            timestamp: new Date().toISOString() 
        });
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