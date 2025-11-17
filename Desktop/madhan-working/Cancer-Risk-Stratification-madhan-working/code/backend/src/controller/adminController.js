const User = require('../models/users');
const bcrypt = require('bcryptjs');

const adminController = {
    // Create new user
    createUser: async (req, res) => {
        try {
            const { username, password, role } = req.body;

            // Check if username already exists
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already exists' });
            }

            // Create new user
            const user = await User.create({
                username,
                password,
                role
            });

            // Remove password from response
            const userResponse = user.toObject();
            delete userResponse.password;

            res.status(201).json(userResponse);
        } catch (error) {
            console.error('Create user error:', error);
            
            // Handle specific MongoDB/Mongoose errors
            if (error.code === 11000) {
                return res.status(400).json({ 
                    message: 'Username already exists',
                    detail: error.message 
                });
            }
            
            // Handle validation errors
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map(err => err.message);
                return res.status(400).json({ 
                    message: 'Validation error',
                    errors: validationErrors
                });
            }
            
            // For any other error, send error details in development
            const errorMessage = process.env.NODE_ENV === 'development' 
                ? error.message 
                : 'Error creating user';
                
            res.status(500).json({ message: errorMessage });
        }
    },

    // Get all users
    getAllUsers: async (req, res) => {
        try {
            const users = await User.find()
                .select('-password')
                .sort({ createdAt: -1 });

            res.json(users);
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({ message: 'Error fetching users' });
        }
    },

    // Update user
    updateUser: async (req, res) => {
        try {
            const { username, password, role } = req.body;
            const userId = req.params.userId;

            // Check if user exists
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Check if new username already exists
            if (username && username !== user.username) {
                const existingUser = await User.findOne({ username });
                if (existingUser) {
                    return res.status(400).json({ message: 'Username already exists' });
                }
            }

            // Update user fields
            if (username) user.username = username;
            if (password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(password, salt);
            }
            if (role) user.role = role;

            await user.save();

            // Remove password from response
            const userResponse = user.toObject();
            delete userResponse.password;

            res.json(userResponse);
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({ message: 'Error updating user' });
        }
    },

    // Delete user
    deleteUser: async (req, res) => {
        try {
            const userId = req.params.userId;

            const result = await User.findByIdAndDelete(userId);
            if (!result) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({ message: 'Error deleting user' });
        }
    }
};

module.exports = adminController;