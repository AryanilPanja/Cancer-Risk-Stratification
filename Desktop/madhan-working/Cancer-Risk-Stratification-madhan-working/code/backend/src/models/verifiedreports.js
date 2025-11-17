const mongoose = require('mongoose');

const verifiedReportSchema = new mongoose.Schema({
    patientID: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true
    },
    llmScore: {
        type: Number,
        required: true
    },
    severity: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        required: true
    },
    originalReport: {
        type: String,
        required: true
    },
    llmReport: {
        type: String
    },
    uploadedOn: {
        type: Date,
        default: Date.now
    },
    verificationStatus: {
        type: Boolean,
        default: true
    },
    verifiedBy: {
        type: String, // username of the verifier
        required: true
    },
    verifiedDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('VerifiedReport', verifiedReportSchema);
