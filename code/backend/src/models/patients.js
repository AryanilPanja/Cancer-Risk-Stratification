const mongoose = require('mongoose');

// Patient Schema Definition
const patientSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    reports: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report'
    }]
}, {
    timestamps: true
});

// Create and export the Patient model
module.exports = mongoose.model('Patient', patientSchema);
