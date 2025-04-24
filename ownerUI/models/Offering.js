const mongoose = require('mongoose');

const offeringSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ownerRegister',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    paymentPlans: [{
        type: {
            type: String,
            required: true,
            enum: ['monthly', 'quarterly', 'half-yearly', 'yearly']
        },
        amount: {
            type: Number,
            required: true
        }
    }],
    entryCode: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        required: true,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    serviceId: {
        type: String,
        required: true,
        unique: true
    },
    clientCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to update the 'updatedAt' field on document update
offeringSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

// Add a check endpoint to verify if a serviceId is unique
offeringSchema.statics.isServiceIdUnique = async function(serviceId) {
    const count = await this.countDocuments({ serviceId });
    return count === 0;
};

const Offering = mongoose.model('Offering', offeringSchema);

module.exports = Offering; 