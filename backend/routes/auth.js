const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid'); // Import uuid
require('dotenv').config();

const router = express.Router();

// Generate Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1h', // Token expires in 1 hour
    });
};

// @desc    Register a new user (Admin functionality - will be secured later)
// @route   POST /api/auth/register
// @access  Public (for now, eventually Admin)
router.post('/register', async (req, res) => {
    const { username, password, role } = req.body; // Removed uniqueDoctorIdentifier from destructuring

    try {
        const userExists = await User.findOne({ username });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let doctorIdentifier = undefined;
        if (role === 'Doctor') {
            doctorIdentifier = uuidv4(); // Generate a unique ID for doctors
        }

        const user = await User.create({
            username,
            password,
            role,
            uniqueDoctorIdentifier: doctorIdentifier // Assign the generated ID
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                role: user.role,
                uniqueDoctorIdentifier: user.uniqueDoctorIdentifier, // Include in response
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ username });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                role: user.role,
                uniqueDoctorIdentifier: user.uniqueDoctorIdentifier,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        if (user) {
            res.json({
                _id: user._id,
                username: user.username,
                role: user.role,
                uniqueDoctorIdentifier: user.uniqueDoctorIdentifier,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;