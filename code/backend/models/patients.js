const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    patientID: {
        type: String,
        required: true,
        unique: true
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
    report: {
        type: String 
    }
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
