const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
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
        type: String, // PDF URL or path
        required: true
    },
    llmReport: {
        type: String // processed text by LLM
    },
    uploadedOn: {
        type: Date,
        default: Date.now
    },
    verificationStatus: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Report', reportSchema);
