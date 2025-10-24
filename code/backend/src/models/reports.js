const mongoose = require('mongoose');

// Report Schema Definition
const reportSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    originalReportUrl: {
        type: String,
        required: true
    },
    ocrText: {
        type: String
    },
    llmGeneratedReport: {
        type: String
    },
    normalizedScore: {
        type: Number
    },
    doctorVerification: {
        isVerified: {
            type: Boolean,
            default: false
        },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        doctorComments: {
            type: String
        },
        doctorScore: {
            type: Number
        },
        verificationDate: {
            type: Date
        }
    },
    status: {
        type: String,
        enum: ['In Progress', 'Completed'],
        default: 'In Progress'
    }
}, {
    timestamps: true
});

// Add indexes for better query performance
reportSchema.index({ patient: 1 });
reportSchema.index({ normalizedScore: -1 });
reportSchema.index({ status: 1 });

// Create and export the Report model
module.exports = mongoose.model('Report', reportSchema);
