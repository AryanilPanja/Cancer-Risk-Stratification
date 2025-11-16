const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    patientId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    dateOfBirth: { type: Date },
    gender: { type: String },
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }]
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
