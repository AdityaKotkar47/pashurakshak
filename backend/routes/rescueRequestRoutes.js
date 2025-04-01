const express = require('express');
const router = express.Router();
const RescueRequest = require('../models/RescueRequest');

// POST /api/rescue/request - Create a new rescue request
router.post('/request', async (req, res) => {
    try {
        const rescueRequest = new RescueRequest(req.body);
        await rescueRequest.save();
        res.status(201).json(rescueRequest);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/rescue/requests - Get all rescue requests (paginated)
router.get('/requests', async (req, res) => {
    try {
        const rescueRequests = await RescueRequest.find();
        res.json(rescueRequests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/rescue/requests/:id - Get rescue request details
router.get('/requests/:id', async (req, res) => {
    try {
        const rescueRequest = await RescueRequest.findById(req.params.id);
        if (!rescueRequest) {
            return res.status(404).json({ error: 'Rescue request not found' });
        }
        res.json(rescueRequest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/rescue/requests/:id/accept - NGO accepts a rescue request
router.put('/requests/:id/accept', async (req, res) => {
    try {
        const rescueRequest = await RescueRequest.findById(req.params.id);
        if (!rescueRequest) {
            return res.status(404).json({ error: 'Rescue request not found' });
        }
        rescueRequest.status = 'accepted';
        await rescueRequest.save();
        res.json(rescueRequest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/rescue/requests/:id/status - Update rescue request status
router.put('/requests/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const rescueRequest = await RescueRequest.findById(req.params.id);
        if (!rescueRequest) {
            return res.status(404).json({ error: 'Rescue request not found' });
        }
        rescueRequest.status = status;
        await rescueRequest.save();
        res.json(rescueRequest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 