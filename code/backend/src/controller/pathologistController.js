const Patient = require('../models/patients');
const Report = require('../models/reports');
const { performOCR } = require('../services/ocrService');
const { generateLLMReport } = require('../services/llmService');
const { uploadToStorage } = require('../services/storageService');

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

            // Perform OCR on the report
            const ocrResult = await performOCR(reportUrl);
            
            // Extract patient details from OCR text
            const patientDetails = extractPatientDetails(ocrResult);
            
            // Check if patient exists
            const existingPatient = await Patient.findOne({ patientId: patientDetails.patientId });
            
            if (existingPatient) {
                return res.status(200).json({
                    message: 'Patient already exists. Do you want to submit an updated report?',
                    patientId: existingPatient.patientId
                });
            }

            // Create new patient
            const patient = await Patient.create({
                patientId: patientDetails.patientId,
                name: patientDetails.name,
                dateOfBirth: patientDetails.dateOfBirth,
                gender: patientDetails.gender
            });

            // Generate LLM Report
            const llmResult = await generateLLMReport(ocrResult);

            // Create new report
            const report = await Report.create({
                patient: patient._id,
                uploadedBy: req.user._id,
                originalReportUrl: reportUrl,
                ocrText: ocrResult,
                llmGeneratedReport: llmResult.report,
                normalizedScore: llmResult.score,
                status: 'In Progress'
            });

            // Update patient's reports array
            await Patient.findByIdAndUpdate(patient._id, {
                $push: { reports: report._id }
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

            // Create new report
            const report = await Report.create({
                patient: patient._id,
                uploadedBy: req.user._id,
                originalReportUrl: reportData.reportUrl,
                ocrText: reportData.ocrText,
                llmGeneratedReport: reportData.llmReport,
                normalizedScore: reportData.score,
                status: 'In Progress'
            });

            // Update patient's reports array
            await Patient.findByIdAndUpdate(patient._id, {
                $push: { reports: report._id }
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