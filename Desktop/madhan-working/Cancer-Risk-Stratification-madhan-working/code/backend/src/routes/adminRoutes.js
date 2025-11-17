const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Apply authentication middleware to all routes
//router.use(authenticateToken);
//router.use(isAdmin);

// POST /api/admin/users - Create new user
router.post('/users', adminController.createUser);

// GET /api/admin/users - Get all users
router.get('/users', adminController.getAllUsers);

// PUT /api/admin/users/:userId - Update user
router.put('/users/:userId', adminController.updateUser);

// DELETE /api/admin/users/:userId - Delete user
router.delete('/users/:userId', adminController.deleteUser);

module.exports = router;