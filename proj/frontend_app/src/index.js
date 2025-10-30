import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// This finds the 'root' div in your public/index.html
const root = ReactDOM.createRoot(document.getElementById('root'));

// This renders your <App /> component inside that div
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);