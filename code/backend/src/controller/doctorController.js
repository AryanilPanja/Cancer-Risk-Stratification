    const Report = require('../models/reports');
    const Patient = require('../models/patients');

    const doctorController = {
        // Get all reports sorted by severity score
        getAllReports: async (req, res) => {
            try {
                const reports = await Report.find()
                    .populate('patient', 'name')
                    .sort({ normalizedScore: -1 })
                    .select('patient normalizedScore llmGeneratedReport status doctorVerification');

                const formattedReports = reports.map(report => ({
                    patientName: report.patient.name,
                    score: report.normalizedScore,
                    llmReport: report.llmGeneratedReport,
                    status: report.status,
                    isReviewed: report.doctorVerification.isVerified,
                    reportId: report._id
                }));

                res.json(formattedReports);
            } catch (error) {
                console.error('Get reports error:', error);
                res.status(500).json({ message: 'Error fetching reports' });
            }
        },

        // Get detailed report by ID
        getReportById: async (req, res) => {
            try {
                const report = await Report.findById(req.params.reportId)
                    .populate('patient')
                    .populate('uploadedBy', 'username');

                if (!report) {
                    return res.status(404).json({ message: 'Report not found' });
                }

                res.json(report);
            } catch (error) {
                console.error('Get report error:', error);
                res.status(500).json({ message: 'Error fetching report' });
            }
        },

        // Verify report
        verifyReport: async (req, res) => {
            try {
                const { doctorComments, doctorScore } = req.body;

                const report = await Report.findById(req.params.reportId);
                if (!report) {
                    return res.status(404).json({ message: 'Report not found' });
                }

                report.doctorVerification = {
                    isVerified: true,
                    verifiedBy: req.user._id,
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