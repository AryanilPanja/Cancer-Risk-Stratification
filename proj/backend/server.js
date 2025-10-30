// backend/server.js
// Purpose: Updated to use a hardcoded JSON object and format it for the LLM.

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// 1. Hardcode the JSON object you provided
const hardcodedReportJSON = {
  "diagnosis": {
    "title": "PAP DIAGNOSIS:",
    "finding": "ATYPICAL SQUAMOUS CELLS OF UNDETERMINED SIGNIFICANCE (ASC-US)"
  },
  "results": {
    "main_title": "Cytologic and Molecular Results",
    "molecular_results": {
      "title": "MOLECULAR RESULTS:",
      "high_risk_hpv": "DETECTED",
      "chlamydia_trachomatis": "not detected",
      "neisseria_gonorrhoeae": "not detected",
      "trichomonas_vaginalis": "not detected"
    }
  },
  "findings": {
    "title": "Additional Cytologic Findings",
    "specimen_adequacy": "Satisfactory for evaluation.",
    "transformation_zone": "Endocervical/transformation zone component present"
  }
};

// 2. Helper function to format the JSON into a readable string context
function formatJsonAsContext(report) {
    let context = "";
    context += `Diagnosis finding is ${report.diagnosis.finding}. `;
    
    context += `Molecular Results: `;
    context += `High Risk HPV result is ${report.results.molecular_results.high_risk_hpv}. `;
    context += `Chlamydia Trachomatis result is ${report.results.molecular_results.chlamydia_trachomatis}. `;
    context += `Neisseria Gonorrhoeae result is ${report.results.molecular_results.neisseria_gonorrhoeae}. `;
    context += `Trichomonas Vaginalis result is ${report.results.molecular_results.trichomonas_vaginalis}. `;
    
    context += `Additional Findings: `;
    context += `Specimen Adequacy is ${report.findings.specimen_adequacy}. `;
    context += `Transformation Zone is ${report.findings.transformation_zone}.`;
    
    return context;
}

app.get('/api/process-report', async (req, res) => {
    console.log("Received request from React...");

    const pythonLLMServiceUrl = 'http://localhost:8000/ask';
    
    // 3. Use the helper function to create the context string
    const reportContextString = formatJsonAsContext(hardcodedReportJSON);
    
    // You can try different questions here!
    const questionToAsk = "What is the High Risk HPV result?";
    // const questionToAsk = "What is the Pap diagnosis?";

    console.log("--- Generated Context String ---");
    console.log(reportContextString);
    console.log("---------------------------------");

    try {
        console.log("Sending data to Python LLM service...");
        const response = await axios.post(pythonLLMServiceUrl, {
            context: reportContextString, // <-- Use the formatted string here
            question: questionToAsk
        });

        res.json({
            question: questionToAsk,
            ...response.data
        });

    } catch (error) {
        console.error("Error communicating with Python service:", error.message);
        res.status(500).json({ error: "Failed to process report" });
    }
});

app.listen(PORT, () => {
    console.log(`Node.js backend server running on http://localhost:${PORT}`);
});