const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + './../../../../.env' }); // CORRECT PATH
console.log("MONGO_URI =", process.env.MONGO_URI);


const connectDB = async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error("MONGO_URI is not defined in .env");
        process.exit(1);
    }

    try {
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Atlas connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

module.exports = connectDB;
