const jwt = require('jsonwebtoken');
const User = require('../models/users');

// Middleware to authenticate JWT token
exports.authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'Invalid token.' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
    }
};

// Middleware to check if user is Admin
exports.isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
};

// Middleware to check if user is Pathologist
exports.isPathologist = (req, res, next) => {
    if (req.user.role !== 'pathologist') {
        return res.status(403).json({ message: 'Access denied. Pathologist only.' });
    }
    next();
};

// Middleware to check if user is Doctor
exports.isDoctor = (req, res, next) => {
    if (req.user.role !== 'doctor') {
        return res.status(403).json({ message: 'Access denied. Doctor only.' });
    }
    next();
};