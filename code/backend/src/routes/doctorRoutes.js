const express = require('express');
const router = express.Router();
const doctorController = require('../controller/doctorController');
const { authenticateToken, isDoctor } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(isDoctor);

// GET /api/doctor/reports - Get all reports
router.get('/reports', doctorController.getAllReports);

// GET /api/doctor/reports/:reportId - Get detailed report
router.get('/reports/:reportId', doctorController.getReportById);

// POST /api/doctor/reports/:reportId/verify - Verify report
router.post('/reports/:reportId/verify', doctorController.verifyReport);

module.exports = router;