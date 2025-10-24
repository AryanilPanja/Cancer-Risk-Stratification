/**
 * Lightweight local LLM-like service
 *
 * This module provides a simple, local implementation for generating a
 * structured report summary and a normalized severity score from OCR text.
 *
 * Why: the project currently does not use Google Cloud Language API. To avoid
 * depending on '@google-cloud/language' (which may not be installed), this
 * local implementation provides a reasonable placeholder that can be used
 * during development. Later you can swap this implementation with a real
 * LLM or the Google Cloud Language API.
 */

// A list of keywords indicative of higher severity. You can extend this list.
const SEVERITY_KEYWORDS = [
    'metastasis', 'metastatic', 'malignant', 'malignancy', 'invasive',
    'high grade', 'grade 3', 'grade 4', 'stage iv', 'stage 4', 'recurrence',
    'aggressive', 'tumor', 'tumour', 'lesion', 'positive', 'lymph node', 'nodal'
];

// Secondary keywords used to increase or moderate score
const MODERATE_KEYWORDS = ['suspicious', 'probable', 'likely', 'evidence'];

// Generate a simple summary and normalized score from OCR text
exports.generateLLMReport = async (ocrText) => {
    try {
        if (!ocrText || typeof ocrText !== 'string') {
            return { report: 'No OCR text provided', score: 0 };
        }

        const text = ocrText.toLowerCase();

        // Count severity keyword occurrences
        let severityCount = 0;
        for (const kw of SEVERITY_KEYWORDS) {
            const re = new RegExp(escapeRegExp(kw), 'g');
            const matches = text.match(re);
            if (matches) severityCount += matches.length;
        }

        // Count moderate keyword occurrences
        let moderateCount = 0;
        for (const kw of MODERATE_KEYWORDS) {
            const re = new RegExp(escapeRegExp(kw), 'g');
            const matches = text.match(re);
            if (matches) moderateCount += matches.length;
        }

        // Basic heuristic: severity score is proportional to severityCount and moderated
        // by moderateCount. We normalize to [0,1]. The constants (weights) are tunable.
        const severityWeight = 1.0;
        const moderateWeight = 0.5;
        const rawScore = severityWeight * severityCount + moderateWeight * moderateCount;

        // Normalize rawScore to 0..1 using a sigmoid-like cap to avoid runaway values
        const normalizedScore = normalizeScore(rawScore);

        // Build a short summary by extracting sentences that contain any keyword
        const summary = extractRelevantSentences(ocrText, SEVERITY_KEYWORDS.concat(MODERATE_KEYWORDS)).slice(0, 1000);

        const structuredReport = `Summary:\n${summary}\n\nDetected severity keywords: ${severityCount}, moderate keywords: ${moderateCount}`;

        return {
            report: structuredReport,
            score: normalizedScore
        };
    } catch (error) {
        console.error('LLM (local) error:', error);
        return { report: 'Error generating report', score: 0 };
    }
};

// Utility: escape regex special chars in keyword
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Normalize raw numeric score to [0,1]
function normalizeScore(x) {
    // Use a smooth saturation function: x / (x + k)
    const k = 3; // tuning constant; larger k => requires more matches to approach 1
    const value = x / (x + k);
    // clamp
    if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
}

// Extract sentences that contain any keyword (case-insensitive)
function extractRelevantSentences(text, keywords) {
    // Split into sentences (very simple splitter)
    const sentences = text.split(/(?<=[.?!])\s+/);
    const lowerKeywords = keywords.map(k => k.toLowerCase());
    const relevant = [];
    for (const s of sentences) {
        const lower = s.toLowerCase();
        for (const kw of lowerKeywords) {
            if (kw && lower.includes(kw)) {
                relevant.push(s.trim());
                break;
            }
        }
    }
    // If none found, return the first 2 sentences as a fallback
    if (relevant.length === 0) {
        return sentences.slice(0, 2).join(' ');
    }
    return relevant.join(' ');
}