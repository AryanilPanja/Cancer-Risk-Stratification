const path = require('path');
// 🛑 MANDATORY: Load environment variables from .env file
require('dotenv').config({ path: '../.env' });

const { performOCR } = require('./services/ocrService');

async function testOCR() {
  try {
    if (!process.env.OCR_SPACE_API_KEY) {
        throw new Error(`❌ Fatal: OCR_SPACE_API_KEY is still not loaded into process.env. Check your .env file.`);
    }

    const filePath = path.resolve('../uploads/Temp1.pdf'); 

    console.log("🧠 Running OCR on:", filePath);
    console.log("⏳ Starting API call..."); // <-- NEW LOG

    // ----------------------------------------------------
    const extractedText = await performOCR(filePath);
    // ----------------------------------------------------

    console.log("🏁 API call returned successfully."); // <-- NEW LOG

    // Check if the text is empty and log a helpful message
    if (!extractedText || extractedText.trim().length === 0) {
        console.log("\n⚠️ WARNING: The OCR process completed, but NO TEXT was extracted.");
        console.log("This usually means the image/PDF is blank or the OCR service could not find any text.");
        console.log(`Raw Extracted Text (Length ${extractedText.length}): ${extractedText}`);
    }

    console.log("\n✅ OCR Extraction Complete!\n");
    console.log("------ Extracted Text ------\n");
    console.log(extractedText);
    console.log("\n-----------------------------");

    const words = extractedText.split(/\s+/).filter(Boolean);
    console.log("📄 Total Words Extracted:", words.length);

  } catch (err) {
    console.error("❌ OCR test failed:", err.message);
  } finally {
      console.log("--- Script Execution Finished ---"); // <-- NEW FINAL LOG
  }
}

testOCR();
