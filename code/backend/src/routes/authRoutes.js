// authRoutes.js in routes folder
const express = require('express');
const router = express.Router();
const authController = require('../controller/authController'); // Assuming 'controllers' folder, not 'controller'

// POST /api/auth/login - User login
router.post('/login', authController.login);

router.post('/register', authController.register);

module.exports = router;