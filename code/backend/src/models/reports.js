const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  // File storage
  originalFileName: String,
  fileLocation: String, // Path to file in backend/uploads
  
  // Cancer risk analysis from LLM
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'unknown'],
    default: 'unknown'
  },
  cancerPositiveScore: {
    type: Number, // 0-100
    min: 0,
    max: 100
  },
  diagnosisAnalysis: String, // Final comment/analysis from LLM
  
  // Legacy fields
  normalizedScore: Number,
  llmGeneratedReport: String,
  ocrText: String,
  
  status: { type: String, default: 'Pending' },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  doctorVerification: {
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    doctorComments: String,
    doctorScore: Number,
    verificationDate: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
