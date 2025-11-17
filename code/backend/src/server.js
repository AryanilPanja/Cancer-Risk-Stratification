const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Resolve project root .env (root is three levels up from src)
const rootEnvPath = path.resolve(__dirname, '../../..', '.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  // Fallback to default lookup (will search cwd)
  dotenv.config();
  console.warn('[env] Root .env not found at', rootEnvPath, 'loaded fallback .env');
}

// Safety check for required vars (add more as needed)
if (!process.env.MONGO_URI) {
  console.error('[env] MONGO_URI is missing; check root .env file.');
}

const connectDB = require('./config/db');
const { startFileWatcher, stopFileWatcher } = require('./services/fileWatcherService');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const pathologistRoutes = require('./routes/pathologistRoutes');// Initialize express app
const app = express();

// Connect to database THEN start server
connectDB()
    .then(() => {
        const PORT = process.env.PORT || 5001;
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
            
            // Start file watcher service after server is running
            console.log('🔍 Starting file watcher service...');
            startFileWatcher();
        });
    })
    .catch(() => {
        // connectDB already logs and exits, but guard here
        console.error('Server not started due to DB connection failure');
    });

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⚠️  Shutting down gracefully...');
    stopFileWatcher();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n⚠️  Shutting down gracefully...');
    stopFileWatcher();
    process.exit(0);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/pathologist', pathologistRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// (Server start moved inside successful DB connection above)
