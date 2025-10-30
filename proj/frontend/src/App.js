// frontend/src/App.js
// Purpose: This is your "React Web Application"

import React, { useState } from 'react';
import './App.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // (1) User Action
  const handleProcessReport = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // (2) API Request: Call the Node.js/Express backend
      const response = await fetch('http://localhost:5000/api/process-report');
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      // (7) Retrieve Status: Set the data from the backend to state
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h2>Cancer Report Demo</h2>
        <p>
          Click the button to send the hardcoded Pap Smear report
          to the local BioBERT model for analysis.
        </p>
        
        {/* (1) User Action: Button click */}
        <button onClick={handleProcessReport} disabled={loading}>
          {loading ? 'Processing...' : 'Process Report'}
        </button>

        {/* Display the results from the LLM */}
        {result && (
          <div className="result-box">
            <p><strong>Question:</strong> {result.question}</p>
            <p><strong>Answer:</strong> {result.answer}</p>
            <p><strong>Confidence:</strong> {Math.round(result.score * 100)}%</p>
          </div>
        )}

        {error && (
          <div className="error-box">
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}
      </header>
    </div>
  );
}

// Simple CSS: Add to src/App.css
/*
.App { text-align: center; }
.App-header {
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
}
button {
  padding: 10px 20px;
  font-size: 1.2rem;
  cursor: pointer;
  border-radius: 5px;
  border: none;
}
.result-box {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #61dafb;
  border-radius: 5px;
  background-color: #3a3f4a;
  text-align: left;
}
.error-box {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ff6b6b;
  border-radius: 5px;
  background-color: #4a3a3a;
  color: #ff6b6b;
}
*/
export default App;