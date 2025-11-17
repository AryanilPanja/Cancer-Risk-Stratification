// services/fileWatcherService.js
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs').promises;
const mongoose = require('mongoose');
const Patient = require('../models/patients');
const Report = require('../models/reports');
const { callLLMService, ensurePatient, createReportForPatient } = require('./reportService');

class FileWatcherService {
    constructor() {
        this.uploadsDir = path.join(__dirname, '../../uploads');
        this.watcher = null;
        this.processing = new Set(); // Track files being processed
    }

    async start() {
        // Ensure uploads directory exists
        await fs.mkdir(this.uploadsDir, { recursive: true });

        console.log('[FileWatcher] Starting file watcher on:', this.uploadsDir);

        // Initialize watcher
        this.watcher = chokidar.watch(this.uploadsDir, {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true,
            ignoreInitial: false, // Process existing files on startup
            awaitWriteFinish: {
                stabilityThreshold: 2000, // Wait for file write to complete
                pollInterval: 100
            }
        });

        // Watch for new files
        this.watcher
            .on('add', async (filePath) => {
                await this.handleNewFile(filePath);
            })
            .on('error', (error) => {
                console.error('[FileWatcher] Error:', error);
            });

        console.log('[FileWatcher] Watching for new files...');
    }

    async handleNewFile(filePath) {
        const fileName = path.basename(filePath);
        
        // Skip if already processing
        if (this.processing.has(filePath)) {
            return;
        }

        // Check if this is a metadata file (created by us)
        if (fileName.endsWith('.meta.json')) {
            return;
        }

        console.log(`[FileWatcher] New file detected: ${fileName}`);
        this.processing.add(filePath);

        try {
            // Check if file has already been processed
            const metaFilePath = `${filePath}.meta.json`;
            const alreadyProcessed = await this.checkIfProcessed(metaFilePath);
            
            if (alreadyProcessed) {
                console.log(`[FileWatcher] File already processed: ${fileName}`);
                this.processing.delete(filePath);
                return;
            }

            // Process the file
            await this.processFile(filePath);
            
            // Mark as processed
            await this.markAsProcessed(metaFilePath);

        } catch (error) {
            console.error(`[FileWatcher] Error processing ${fileName}:`, error.message);
        } finally {
            this.processing.delete(filePath);
        }
    }

    async checkIfProcessed(metaFilePath) {
        try {
            await fs.access(metaFilePath);
            return true;
        } catch {
            return false;
        }
    }

    async markAsProcessed(metaFilePath) {
        const metadata = {
            processed: true,
            timestamp: new Date().toISOString()
        };
        await fs.writeFile(metaFilePath, JSON.stringify(metadata, null, 2));
    }

    async processFile(filePath) {
        const fileName = path.basename(filePath);
        console.log(`[FileWatcher] Processing file: ${fileName}`);

        // Step 1: Call LLM service to analyze the file
        console.log('[FileWatcher] Calling LLM service...');
        const llmResult = await callLLMService(filePath);
        
        console.log('[FileWatcher] LLM analysis complete:', {
            patientName: llmResult.metadata?.name,
            riskLevel: llmResult.analysis?.riskLevel,
            score: llmResult.analysis?.cancerPositiveScore
        });

        // Step 2: Ensure patient exists in database
        const { patient, isNew } = await ensurePatient(llmResult.metadata);
        console.log(`[FileWatcher] Patient ${isNew ? 'created' : 'found'}:`, patient.patientId);

        // Step 3: Create report document
        const fileLocation = `/uploads/${fileName}`;
        
        const report = await createReportForPatient({
            patient,
            originalFileName: fileName,
            fileLocation,
            riskLevel: llmResult.analysis.riskLevel,
            cancerPositiveScore: llmResult.analysis.cancerPositiveScore,
            diagnosisAnalysis: llmResult.analysis.diagnosisAnalysis,
            uploadedBy: null, // System/automatic processing
            ocrText: '' // No OCR used
        });

        console.log('[FileWatcher] Report created:', {
            reportId: report._id,
            patientId: patient.patientId,
            riskLevel: report.riskLevel,
            score: report.cancerPositiveScore
        });

        return {
            reportId: report._id,
            patientId: patient.patientId,
            patientName: patient.name,
            isNewPatient: isNew
        };
    }

    stop() {
        if (this.watcher) {
            console.log('[FileWatcher] Stopping file watcher...');
            this.watcher.close();
            this.watcher = null;
        }
    }
}

// Singleton instance
let watcherInstance = null;

function startFileWatcher() {
    if (!watcherInstance) {
        watcherInstance = new FileWatcherService();
        watcherInstance.start();
    }
    return watcherInstance;
}

function stopFileWatcher() {
    if (watcherInstance) {
        watcherInstance.stop();
        watcherInstance = null;
    }
}

module.exports = {
    startFileWatcher,
    stopFileWatcher,
    FileWatcherService
};
