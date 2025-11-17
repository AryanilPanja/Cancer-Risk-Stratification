// src/controller/pathologistController.js
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const Patient = require('../models/patients');
const Report = require('../models/reports');

const pathologistController = {
    /**
     * Upload medical report - just saves file, watcher handles processing
     * Flow: Save File → File Watcher detects → Auto-processes with LLM → Stores in DB
     */
    uploadReport: async (req, res) => {
        try {
            console.log("[Controller] Upload request received.");
            const file = req.file;
            if (!file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            // Save file to uploads directory
            // File watcher will automatically detect and process it
            const tempReportId = new mongoose.Types.ObjectId();
            const uploadsDir = path.join(__dirname, '../../uploads');
            await fs.mkdir(uploadsDir, { recursive: true });
            
            const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
            const fileName = `${tempReportId}_${sanitizedName}`;
            const filePath = path.join(uploadsDir, fileName);
            
            // Write file
            await fs.writeFile(filePath, file.buffer);
            console.log("[Controller] File saved:", fileName);
            console.log("[Controller] File watcher will process automatically");

            return res.status(202).json({
                message: 'File uploaded successfully. Processing will happen automatically.',
                data: {
                    fileName: fileName,
                    fileLocation: `/uploads/${fileName}`,
                    status: 'pending',
                    note: 'File is being processed in the background. Check reports collection for results.'
                }
            });

        } catch (error) {
            console.error("[Controller] Upload error:", error);
            return res.status(500).json({
                message: 'Error uploading file',
                error: error.message || error
            });
        }
    },

    /**
     * Legacy method - kept for backward compatibility
     */
    confirmUpload: async (req, res) => {
        try {
            const { patientId, reportData } = req.body;
            const patient = await Patient.findOne({ patientId });
            if (!patient) {
                return res.status(404).json({ message: 'Patient not found' });
            }

            const report = await createReportForPatient({
                patient,
                uploadedBy: req.user ? req.user._id : null,
                originalFileName: reportData.fileName || 'unknown',
                fileLocation: reportData.reportUrl,
                ocrText: reportData.ocrText || '',
                riskLevel: reportData.riskLevel || 'unknown',
                cancerPositiveScore: reportData.score || 0,
                diagnosisAnalysis: reportData.llmReport || 'No analysis available'
            });

            return res.status(200).json({
                message: 'Report submitted successfully',
                reportId: report._id
            });
        } catch (error) {
            console.error("[Controller] Confirm upload error:", error);
            return res.status(500).json({
                message: 'Error confirming report upload',
                error: error.message
            });
        }
    }
};

module.exports = pathologistController;
