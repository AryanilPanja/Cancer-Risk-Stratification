// services/reportService.js
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const Patient = require('../models/patients');
const Report = require('../models/reports');

/**
 * Upload file to backend/uploads directory with MongoDB ID
 * @param {Object} file - Multer file object
 * @param {String} mongoId - MongoDB ObjectId for unique naming
 * @returns {Promise<String>} - Relative path to saved file
 */
async function uploadFileToBackend(file, mongoId) {
    const uploadsDir = path.join(__dirname, '../../uploads');
    
    // Ensure uploads directory exists
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Create filename: mongoId_originalName
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${mongoId}_${sanitizedName}`;
    const filePath = path.join(uploadsDir, fileName);
    
    // Write file
    if (file.buffer) {
        await fs.writeFile(filePath, file.buffer);
    } else if (file.path) {
        await fs.copyFile(file.path, filePath);
    } else {
        throw new Error('File has neither buffer nor path');
    }
    
    // Return relative path for storage in DB
    return `/uploads/${fileName}`;
}

/**
 * Call Python LLM service to process report file directly
 * @param {String} filePath - Absolute path to the uploaded file
 * @returns {Promise<Object>} - { metadata, analysis }
 */
async function callLLMService(filePath) {
    return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, 'llmService.py');
        
        // Spawn Python process with file path as argument
        const python = spawn('python3', [pythonScript, filePath]);
        
        let stdout = '';
        let stderr = '';
        
        python.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        python.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        python.on('close', (code) => {
            if (code !== 0) {
                console.error('[LLM Service] Python error:', stderr);
                return reject(new Error(`LLM service failed with code ${code}: ${stderr}`));
            }
            
            try {
                const result = JSON.parse(stdout);
                resolve(result);
            } catch (err) {
                console.error('[LLM Service] Failed to parse JSON:', stdout);
                reject(new Error('Failed to parse LLM service response'));
            }
        });
        
        python.on('error', (err) => {
            console.error('[LLM Service] Failed to spawn Python:', err);
            reject(new Error(`Failed to start LLM service: ${err.message}`));
        });
    });
}

/**
 * Ensure patient exists in database, create if new
 * @param {Object} metadata - { name, dob, phoneNumber, sex }
 * @returns {Promise<Object>} - { patient: Patient, isNew: Boolean }
 */
async function ensurePatient(metadata) {
    // Generate patientId if needed
    const patientId = `PAT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Try to find existing patient by name and DOB
    let patient = null;
    if (metadata.name && metadata.name !== 'Unknown' && metadata.dob) {
        patient = await Patient.findOne({
            name: metadata.name,
            dateOfBirth: new Date(metadata.dob)
        });
    }
    
    if (patient) {
        // Update phone if provided and missing
        if (metadata.phoneNumber && !patient.phoneNumber) {
            patient.phoneNumber = metadata.phoneNumber;
            await patient.save();
        }
        return { patient, isNew: false };
    }
    
    // Create new patient
    patient = await Patient.create({
        patientId,
        name: metadata.name || 'Unknown',
        dateOfBirth: metadata.dob ? new Date(metadata.dob) : null,
        gender: metadata.sex || 'Unknown',
        phoneNumber: metadata.phoneNumber
    });
    
    return { patient, isNew: true };
}

/**
 * Create report document and link to patient
 * @param {Object} data - Report data including patient, file info, analysis
 * @returns {Promise<Report>} - Created report document
 */
async function createReportForPatient(data) {
    const {
        patient,
        originalFileName,
        fileLocation,
        riskLevel,
        cancerPositiveScore,
        diagnosisAnalysis,
        uploadedBy,
        ocrText
    } = data;
    
    const report = await Report.create({
        patient: patient._id,
        originalFileName,
        fileLocation,
        riskLevel,
        cancerPositiveScore,
        diagnosisAnalysis,
        uploadedBy,
        ocrText,
        status: 'Completed',
        // Legacy field for backward compatibility
        normalizedScore: cancerPositiveScore / 100,
        llmGeneratedReport: diagnosisAnalysis
    });
    
    // Link report to patient
    patient.reports.push(report._id);
    await patient.save();
    
    return report;
}

module.exports = {
    uploadFileToBackend,
    callLLMService,
    ensurePatient,
    createReportForPatient
};
