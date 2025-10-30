import React, { useState } from 'react';
import axios from 'axios';

const FileUpload = () => {
    const [file, setFile] = useState(null);
    const [question, setQuestion] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleQuestionChange = (e) => {
        setQuestion(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !question) {
            alert('Please upload a file and enter a question.');
            return;
        }

        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('question', question);

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/process-report', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setResult(response.data);
        } catch (error) {
            console.error('Error processing the report:', error);
            alert('Failed to process the report.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Upload PDF and Ask a Question</h1>
            <form onSubmit={handleSubmit}>
                <input type="file" accept="application/pdf" onChange={handleFileChange} />
                <input
                    type="text"
                    placeholder="Enter your question"
                    value={question}
                    onChange={handleQuestionChange}
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Processing...' : 'Submit'}
                </button>
            </form>
            {result && (
                <div>
                    <h2>Result</h2>
                    <p><strong>Confidence:</strong> {result.confidence}</p>
                    <p><strong>Answer:</strong> {result.answer}</p>
                </div>
            )}
        </div>
    );
};

export default FileUpload;