# Cancer Report Analysis - LLM Integration Setup

## Overview

The system now integrates Google Gemini 2.0 Flash for intelligent medical report processing. When a pathologist uploads a file, it:

1. **Extracts patient metadata**: Name, DOB, phone number, and sex
2. **Performs cancer risk analysis**: Provides risk level (low/medium/high) and a 0-100 cancer positive score
3. **Stores everything in MongoDB**: Patient info and analysis results

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd code/backend/src/services
pip install -r requirements.txt
```

Or install individually:
```bash
pip install google-generativeai python-dotenv pymongo
```

### 2. Get Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

### 3. Add API Key to .env

Edit the root `.env` file (at project root, outside `code/`):

```bash
# Add this line with your actual API key
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 4. Test the LLM Service

```bash
# Test with sample data
cd code/backend/src/services
python3 llmService.py --test
```

You should see JSON output with metadata and analysis.

## Architecture

### File Flow

```
Pathologist Upload (POST /api/pathologist/upload)
    ↓
1. OCR Service extracts text from file
    ↓
2. LLM Service processes text:
   - Extracts patient metadata (name, DOB, phone, sex)
   - Analyzes diagnosis for cancer risk
    ↓
3. Patient created/found in MongoDB
    ↓
4. File saved to backend/uploads/{mongoId}_{filename}
    ↓
5. Report created in MongoDB with:
   - Patient link
   - File location
   - Risk level (low/medium/high)
   - Cancer positive score (0-100)
   - Diagnosis analysis
    ↓
Response sent to frontend
```

### Database Schema Updates

#### Patient Model
```javascript
{
  patientId: String (unique),
  name: String,
  dateOfBirth: Date,
  gender: String,
  phoneNumber: String,  // NEW
  reports: [ObjectId]
}
```

#### Report Model
```javascript
{
  patient: ObjectId,
  originalFileName: String,  // NEW
  fileLocation: String,      // NEW: /uploads/{mongoId}_{filename}
  riskLevel: String,         // NEW: 'low'|'medium'|'high'|'unknown'
  cancerPositiveScore: Number, // NEW: 0-100
  diagnosisAnalysis: String,   // NEW: LLM's detailed analysis
  ocrText: String,
  uploadedBy: ObjectId,
  status: String,
  // ... other fields
}
```

## API Response Example

```json
{
  "message": "Report uploaded and analyzed successfully",
  "data": {
    "reportId": "507f1f77bcf86cd799439011",
    "patientId": "PAT_1234567890_abc123",
    "patientName": "John Doe",
    "isNewPatient": true,
    "riskLevel": "medium",
    "cancerPositiveScore": 45,
    "diagnosisAnalysis": "Report shows atypical cells requiring further investigation. Moderate indicators present.",
    "fileLocation": "/uploads/507f1f77bcf86cd799439011_report.pdf"
  }
}
```

## Service Files

### `/code/backend/src/services/llmService.py`
- Main LLM integration
- Two functions:
  - `extract_patient_metadata()`: Extracts name, DOB, phone, sex
  - `analyze_cancer_diagnosis()`: Returns risk level, score, analysis
- Uses Gemini 2.0 Flash model
- Includes regex fallbacks if LLM fails

### `/code/backend/src/services/reportService.js`
- `uploadFileToBackend()`: Saves file with MongoDB ID
- `callLLMService()`: Spawns Python process for LLM analysis
- `ensurePatient()`: Creates or finds patient
- `createReportForPatient()`: Creates report document

### `/code/backend/src/controller/pathologistController.js`
- `uploadReport()`: Main handler orchestrating the flow
- Calls OCR → LLM → DB in sequence
- Returns comprehensive response

## Testing

### 1. Test LLM Service Standalone

```bash
cd code/backend/src/services

# Create test file
cat > test_report.txt << 'EOF'
PATHOLOGY REPORT

Patient Name: Jane Smith
Date of Birth: 1980-05-20
Phone: 555-0199
Sex: Female

DIAGNOSIS:
Microscopic examination reveals invasive ductal carcinoma of the breast.
Tumor grade: II. Estrogen receptor positive.

IMPRESSION:
Malignant neoplasm consistent with breast cancer, stage IIA.
EOF

# Run analysis
python3 llmService.py test_report.txt
```

### 2. Test Full Upload Flow

Use Postman or curl:

```bash
curl -X POST http://localhost:5001/api/pathologist/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "report=@/path/to/medical_report.pdf"
```

### 3. Verify Database

```javascript
// In MongoDB shell or Compass
db.patients.find().pretty()
db.reports.find().pretty()
```

## Error Handling

The system includes comprehensive error handling:

1. **OCR Fails**: Returns 500 with OCR error message
2. **Insufficient Text**: Returns 400 if OCR extracts < 50 characters
3. **LLM Fails**: Falls back to regex-based extraction
4. **File Save Fails**: Returns 500 with file system error

## Environment Variables Required

```bash
# In root .env file
MONGO_URI=mongodb+srv://...
GEMINI_API_KEY=your_gemini_api_key
OCR_API=http://localhost:7000/ocr  # Optional, defaults to this
```

## Next Steps

1. Get your Gemini API key and add to `.env`
2. Install Python dependencies
3. Test the LLM service standalone
4. Test the full upload flow with a sample PDF
5. Monitor logs for any issues

## Troubleshooting

### "GEMINI_API_KEY not found"
- Check `.env` file exists at project root
- Ensure no typos: `GEMINI_API_KEY=AIza...`
- Restart backend server after adding key

### "Import google.generativeai could not be resolved"
```bash
pip install google-generativeai
```

### "LLM service failed with code 1"
- Check Python path: `which python3`
- Verify dependencies: `pip list | grep google-generativeai`
- Check logs in terminal output

### File not saving
- Ensure `backend/uploads/` directory has write permissions
- Check disk space

## Security Notes

- **Never commit `.env`** with real API keys to git
- Gemini API keys should be kept secret
- Consider rate limiting on upload endpoint
- Validate file types before processing

## Support

For issues:
1. Check backend logs: `npm run dev`
2. Test OCR endpoint: `POST /api/pathologist/ocr`
3. Test LLM standalone: `python3 llmService.py --test`
