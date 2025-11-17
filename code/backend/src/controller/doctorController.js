const Report = require('../models/reports');
const Patient = require('../models/patients');

const doctorController = {
    // Fetch all reports (sorted by severity)
    getAllReports: async (req, res) => {
        try {
            const reports = await Report.find()
                .populate('patient', 'name dateOfBirth gender phoneNumber patientId')
                .sort({ cancerPositiveScore: -1 }) // Sort by cancer risk score (highest first)
                .select('patient cancerPositiveScore riskLevel diagnosisAnalysis fileLocation originalFileName status doctorVerification createdAt');

            const formattedReports = reports.map(report => ({
                reportId: report._id,
                patientId: report.patient?.patientId || 'N/A',
                patientName: report.patient?.name || 'Unknown',
                dateOfBirth: report.patient?.dateOfBirth || null,
                gender: report.patient?.gender || 'N/A',
                phoneNumber: report.patient?.phoneNumber || 'N/A',
                cancerPositiveScore: report.cancerPositiveScore || 0,
                riskLevel: report.riskLevel || 'unknown',
                diagnosisAnalysis: report.diagnosisAnalysis || 'N/A',
                fileLocation: report.fileLocation || null,
                originalFileName: report.originalFileName || 'N/A',
                status: report.status,
                uploadDate: report.createdAt,
                isReviewed: report.doctorVerification?.isVerified || false,
                doctorScore: report.doctorVerification?.doctorScore || null,
                doctorComments: report.doctorVerification?.doctorComments || '',
                verificationDate: report.doctorVerification?.verificationDate || null
            }));

            res.json(formattedReports);
        } catch (error) {
            console.error('Get reports error:', error);
            res.status(500).json({ message: 'Error fetching reports' });
        }
    },

    // Fetch a single report by ID with full details
    getReportById: async (req, res) => {
        try {
            const report = await Report.findById(req.params.reportId)
                .populate('patient', 'name gender dateOfBirth phoneNumber patientId')
                .populate('uploadedBy', 'username email');

            if (!report) return res.status(404).json({ message: 'Report not found' });

            const detailedReport = {
                reportId: report._id,
                patient: {
                    id: report.patient?.patientId || 'N/A',
                    name: report.patient?.name || 'Unknown',
                    dateOfBirth: report.patient?.dateOfBirth || null,
                    gender: report.patient?.gender || 'N/A',
                    phoneNumber: report.patient?.phoneNumber || 'N/A'
                },
                fileInfo: {
                    originalFileName: report.originalFileName || 'N/A',
                    fileLocation: report.fileLocation || null,
                    uploadDate: report.createdAt
                },
                analysis: {
                    riskLevel: report.riskLevel || 'unknown',
                    cancerPositiveScore: report.cancerPositiveScore || 0,
                    diagnosisAnalysis: report.diagnosisAnalysis || 'N/A'
                },
                doctorVerification: {
                    isVerified: report.doctorVerification?.isVerified || false,
                    doctorComments: report.doctorVerification?.doctorComments || '',
                    doctorScore: report.doctorVerification?.doctorScore || null,
                    verificationDate: report.doctorVerification?.verificationDate || null,
                    verifiedBy: report.doctorVerification?.verifiedBy || null
                },
                uploadedBy: report.uploadedBy ? {
                    username: report.uploadedBy.username,
                    email: report.uploadedBy.email
                } : null,
                status: report.status
            };

            res.json(detailedReport);
        } catch (error) {
            console.error('Get report error:', error);
            res.status(500).json({ message: 'Error fetching report' });
        }
    },

    // Doctor verification
    verifyReport: async (req, res) => {
        try {
            const { doctorComments, doctorScore } = req.body;
            const report = await Report.findById(req.params.reportId);

            if (!report) return res.status(404).json({ message: 'Report not found' });

            report.doctorVerification = {
                isVerified: true,
                verifiedBy: req.user?._id || null,
                doctorComments,
                doctorScore,
                verificationDate: new Date()
            };
            report.status = 'Completed';

            await report.save();

            res.json({ message: 'Report verified successfully' });
        } catch (error) {
            console.error('Verify report error:', error);
            res.status(500).json({ message: 'Error verifying report' });
        }
    }
};

module.exports = doctorController;
