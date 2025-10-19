const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
// const { v4: uuidv4 } = require('uuid'); // We'll generate this in the route handler now

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Admin', 'pathologist', 'Doctor'],
        required: true
    },
    uniqueDoctorIdentifier: {
        type: String,
        unique: true, // Ensure all doctor identifiers are unique
        sparse: true  // Allows null values for non-doctors, but ensures uniqueness for doctors
                      // No longer required: function() { return this.role === 'Doctor'; }
                      // We'll handle the assignment in the route logic now.
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);