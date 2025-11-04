const Patient = require('../models/patients');
const Report = require('../models/reports');
const { performOCR } = require('../services/ocrService');
const { generateLLMReport } = require('../services/llmService');
const { uploadToStorage } = require('../services/storageService');
const { ensurePatient, createReportForPatient } = require('../services/reportService');

const pathologistController = {
    // Upload new report
    uploadReport: async (req, res) => {
        try {
            const file = req.file;
            if (!file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            // Upload file to storage
            const reportUrl = await uploadToStorage(file);

            // TEMPORARILY SKIP OCR - use dummy data for testing
            const ocrResult = 'Dummy OCR text - OCR disabled for testing. Patient: Test Patient, Age: 45, Gender: Male';
            
            // Extract patient details from OCR text
            const patientDetails = extractPatientDetails(ocrResult);

            // Ensure patient exists (create if not)
            const { patient, existed } = await ensurePatient(patientDetails);

            if (existed) {
                return res.status(200).json({
                    message: 'Patient already exists. Do you want to submit an updated report?',
                    patientId: patient.patientId
                });
            }

            // TEMPORARILY SKIP LLM - use dummy data for testing
            const llmResult = { report: 'Dummy LLM report - LLM disabled for testing', score: 0.5 };

            // Create new report and attach to patient
            const report = await createReportForPatient({
                patient,
                uploadedBy: req.user._id,
                originalReportUrl: reportUrl,
                ocrText: ocrResult,
                llmGeneratedReport: llmResult.report,
                normalizedScore: llmResult.score,
                status: 'In Progress'
            });

            res.status(201).json({
                message: 'Report uploaded and processing started.',
                reportId: report._id
            });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ message: 'Error processing report' });
        }
    },

    // Confirm upload for existing patient
    confirmUpload: async (req, res) => {
        try {
            const { patientId, reportData } = req.body;

            const patient = await Patient.findOne({ patientId });
            if (!patient) {
                return res.status(404).json({ message: 'Patient not found' });
            }

            // Create new report and attach to patient
            const report = await createReportForPatient({
                patient,
                uploadedBy: req.user._id,
                originalReportUrl: reportData.reportUrl,
                ocrText: reportData.ocrText,
                llmGeneratedReport: reportData.llmReport,
                normalizedScore: reportData.score,
                status: 'In Progress'
            });

            res.status(200).json({
                message: 'Updated report submitted successfully.',
                reportId: report._id
            });
        } catch (error) {
            console.error('Confirm upload error:', error);
            res.status(500).json({ message: 'Error processing report' });
        }
    }
};

const fs = require('fs');
const path = require('path');

pathologistController.testOCR = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        // Save the uploaded buffer temporarily (since you're using memoryStorage)
        const tempPath = path.join(__dirname, '../../uploads', req.file.originalname);
        fs.writeFileSync(tempPath, req.file.buffer);

        // Perform OCR using the OCR.space API
        const extractedText = await performOCR(tempPath);

        // Delete temp file after processing
        fs.unlinkSync(tempPath);

        // Return text and word count
        const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
        res.status(200).json({
            message: 'OCR extraction successful.',
            wordCount,
            extractedText
        });
    } catch (error) {
        console.error('OCR test error:', error.message);
        res.status(500).json({ message: 'OCR failed', error: error.message });
    }
};



// Helper function to extract patient details from OCR text
function extractPatientDetails(ocrText) {
    // TODO: Implement patient detail extraction logic
    // This should use regex or NLP to extract patient ID, name, DOB, and gender from OCR text
    return {
        patientId: 'EXTRACTED_ID',
        name: 'EXTRACTED_NAME',
        dateOfBirth: new Date(),
        gender: 'EXTRACTED_GENDER'
    };
}

module.exports = pathologistController;