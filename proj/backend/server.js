const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// --- NEW HELPER FUNCTION: Convert JSON to readable text ---
function formatJsonToTextContext(data) {
    if (!data) return "No data available in the report.";
    
    // Use the specific fields from your TARGET_SCHEMA
    const diagnosis = data.diagnosis?.finding || 'not specified';
    const hpv = data.results?.molecular_results?.high_risk_hpv || 'not tested';
    const chlamydia = data.results?.molecular_results?.chlamydia_trachomatis || 'not tested';
    const adequacy = data.findings?.specimen_adequacy || 'unknown';
    const tz = data.findings?.transformation_zone || 'absent';

    // Create a coherent text block
    return `
        PAP DIAGNOSIS: The finding is **${diagnosis}**. 
        
        MOLECULAR RESULTS: 
        High-Risk HPV result is **${hpv}**. 
        Chlamydia Trachomatis is **${chlamydia}**. 
        Neisseria Gonorrhoeae is **${data.results?.molecular_results?.neisseria_gonorrhoeae || 'not tested'}**. 
        Trichomonas Vaginalis is **${data.results?.molecular_results?.trichomonas_vaginalis || 'not tested'}**.
        
        ADDITIONAL FINDINGS: 
        Specimen adequacy is **${adequacy}**. 
        Transformation zone component is **${tz}**.
    `.trim();
}
// ----------------------------------------------------------

// Helper function to execute the OCR service
function runOCRService(pdfPath) {
    // ... (keep this function as is) ...
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '..', 'ocr_service', 'pdf_extractor.py');
        execFile('/usr/bin/python3', [scriptPath, pdfPath], (error, stdout, stderr) => {
            if (error) {
                console.error('Error executing OCR service:', stderr);
                return reject(error);
            }
            try {
                // Handle cases where stdout might contain extra print statements, only try to parse the last JSON
                let jsonStr = stdout.trim();
                // Simple attempt to find the last valid JSON block if there's print noise
                const lastBrace = jsonStr.lastIndexOf('}');
                const firstBrace = jsonStr.indexOf('{');
                if (lastBrace > firstBrace) {
                    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
                }
                
                const result = JSON.parse(jsonStr);
                resolve(result);
            } catch (parseError) {
                console.error('Error parsing OCR service output:', parseError.message);
                console.error('Raw stdout:', stdout);
                reject(parseError);
            }
        });
    });
}

// Endpoint to process the uploaded PDF
app.post('/api/process-report', upload.single('pdf'), async (req, res) => {
  const { question } = req.body;
  const pdfPath = req.file?.path;

  console.log('Received request with question:', question);
  console.log('Uploaded file path:', pdfPath);

  if (!pdfPath || !question) {
      console.error('Missing PDF file or question');
      return res.status(400).json({ error: 'PDF file and question are required.' });
  }

  try {
      console.log('Running OCR service...');
      const ocrResult = await runOCRService(pdfPath);
      console.log('OCR service completed. Result (JSON):', ocrResult);

      // --- CRITICAL CHANGE 1: Format JSON to text ---
      const textContext = formatJsonToTextContext(ocrResult);
      console.log('Context for LLM (Text):', textContext);
      
      // --- CRITICAL CHANGE 2: Fix the connection host ---
      const llmServiceUrl = 'http://127.0.0.1:8000/ask'; 
      
      const response = await axios.post(llmServiceUrl, {
          context: textContext, // Send the readable text
          question: question,
      });

      console.log('LLM service response:', response.data);

      // Clean up the uploaded file
      fs.unlinkSync(pdfPath);

      // --- MINOR FIX: Adjust response field names ---
      // Your LLM service returns 'answer' and 'score', not 'confidence' and 'answer'
      res.json({
          confidence: response.data.score,
          answer: response.data.answer,
      });
  } catch (error) {
      console.error('Error processing report:', error.message);
      // Log the specific response error if available for better debugging
      if (error.response) {
          console.error('LLM Service Response Error:', error.response.data);
      }
      res.status(500).json({ error: 'Failed to process report' });
  }
});

app.listen(PORT, () => {
    console.log(`Node.js backend server running on http://localhost:${PORT}`);
});