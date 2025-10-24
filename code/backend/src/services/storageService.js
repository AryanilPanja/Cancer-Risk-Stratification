const fs = require('fs');
const path = require('path');

// Save uploaded file to local uploads directory and return the absolute file path.
// The caller may expose the file via a static route if needed.
exports.uploadToStorage = async (file) => {
  try {
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `${Date.now()}-${file.originalname}`;
    const savePath = path.join(uploadsDir, filename);

    await fs.promises.writeFile(savePath, file.buffer);

    // Return the local filesystem path so downstream can call OCR or store reference.
    return savePath;
  } catch (error) {
    console.error('Storage error:', error);
    throw new Error('Failed to save uploaded file');
  }
};