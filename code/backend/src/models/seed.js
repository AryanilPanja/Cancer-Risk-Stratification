require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./users');
const Patient = require('./patients');
const Report = require('./reports');

const connectDB = require('../config/db'); // db.js exports connectDB

const seedData = async () => {
    await connectDB();

    // Create admin user
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
        await User.create({ username: 'admin', password: 'admin123', role: 'admin' });
        console.log('Admin user created');
    }

    // Create a sample patient
    const patientExists = await Patient.findOne({ patientId: 'P001' });
    if (!patientExists) {
        const patient = await Patient.create({ patientId: 'P001', name: 'John Doe', gender: 'Male' });
        console.log('Sample patient created');

        // Create a sample report
        const report = await Report.create({
            patient: patient._id,
            normalizedScore: 0,
            llmGeneratedReport: 'Sample report'
        });

        // Link report to patient
        patient.reports.push(report._id);
        await patient.save();
        console.log('Sample report created and linked to patient');
    }

    console.log('Seeding complete');
    process.exit();
};

seedData();
