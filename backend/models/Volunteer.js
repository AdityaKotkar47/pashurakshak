const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const volunteerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide volunteer name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide email'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Please provide password'],
        minlength: 6,
        select: false
    },
    ngo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ngo',
        required: [true, 'Volunteer must belong to an NGO']
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    activeRescues: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RescueRequest'
    }],
    completedRescues: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Hash password before saving
volunteerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to check password
volunteerSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Volunteer', volunteerSchema);