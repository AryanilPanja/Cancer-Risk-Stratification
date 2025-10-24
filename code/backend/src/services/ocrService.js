const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Perform OCR using OCR.space API. Accepts either a public URL or a local file path.
// Expects OCR_SPACE_API_KEY in env variables.
exports.performOCR = async (inputPathOrUrl) => {
    try {
        const apiKey = process.env.OCR_SPACE_API_KEY;
        if (!apiKey) throw new Error('OCR_SPACE_API_KEY not configured in environment');

        const endpoint = 'https://api.ocr.space/parse/image';

        // If input is a URL, let OCR.space fetch it directly
        if (typeof inputPathOrUrl === 'string' && inputPathOrUrl.startsWith('http')) {
            const params = new URLSearchParams();
            params.append('apikey', apiKey);
            params.append('url', inputPathOrUrl);
            params.append('language', 'eng');
            params.append('isOverlayRequired', 'false');

            const resp = await axios.post(endpoint, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 120000
            });

            if (!resp.data || resp.data.IsErroredOnProcessing) {
                throw new Error('OCR.space error: ' + JSON.stringify(resp.data));
            }

            // Join all parsed text blocks into a single string
            const parsedResults = resp.data.ParsedResults || [];
            const text = parsedResults.map(r => r.ParsedText).join('\n');
            return text;
        }

        // Otherwise assume local file path - send file content via multipart/form-data
        const form = new FormData();
        form.append('apikey', apiKey);
        form.append('language', 'eng');
        form.append('isOverlayRequired', 'false');

        // Attach the file stream
        const fileStream = fs.createReadStream(inputPathOrUrl);
        form.append('file', fileStream);

        const resp = await axios.post(endpoint, form, {
            headers: form.getHeaders(),
            maxBodyLength: Infinity,
            timeout: 120000
        });

        if (!resp.data || resp.data.IsErroredOnProcessing) {
            throw new Error('OCR.space error: ' + JSON.stringify(resp.data));
        }

        const parsedResults = resp.data.ParsedResults || [];
        const text = parsedResults.map(r => r.ParsedText).join('\n');
        return text;
    } catch (error) {
        console.error('OCR error:', error.message || error);
        throw new Error('Failed to perform OCR: ' + (error.message || error));
    }
};