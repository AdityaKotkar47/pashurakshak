const mongoose = require('mongoose');

const rescueRequestSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        animalType: {
            type: String,
            required: [true, 'Animal type is required'],
            enum: ['Dog', 'Cat', 'Bird', 'Cattle', 'Wildlife', 'Other'],
        },
        animalDetails: {
            breed: String,
            color: String,
            approximateAge: String,
            condition: {
                type: String,
                enum: ['Critical', 'Injured', 'Sick', 'Healthy', 'Unknown'],
                default: 'Unknown',
            },
            specialNeeds: String,
        },
        location: {
            address: String,
            landmark: String,
            city: {
                type: String,
                required: [true, 'City is required'],
            },
            state: {
                type: String,
                required: [true, 'State is required'],
            },
            pincode: String,
            coordinates: {
                latitude: Number,
                longitude: Number,
            },
        },
        images: [
            {
                url: String,
                caption: String,
            },
        ],
        status: {
            type: String,
            enum: [
                'pending',
                'accepted',
                'in_progress',
                'completed',
                'cancelled',
            ],
            default: 'pending',
        },
        emergency: {
            type: Boolean,
            default: false,
        },
        assignedTo: {
            ngo: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Ngo',
            },
            volunteer: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Volunteer',
            },
            assignedAt: Date,
        },
        rescueTimeline: [
            {
                status: {
                    type: String,
                    enum: [
                        'request_received',
                        'ngo_assigned',
                        'volunteer_assigned',
                        'volunteer_dispatched',
                        'reached_location',
                        'animal_rescued',
                        'returning_to_center',
                        'treatment_started',
                        'completed',
                    ],
                },
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
                notes: String,
            },
        ],
        contactInfo: {
            name: String,
            phone: {
                type: String,
                required: [true, 'Contact phone is required'],
            },
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('RescueRequest', rescueRequestSchema); 