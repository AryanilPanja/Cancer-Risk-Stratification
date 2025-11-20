import React, { useEffect, useState } from 'react';
import API from '../api/api';
import './DoctorDashboard.css';

function DoctorDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'score', direction: 'desc' });
  const [expandedRow, setExpandedRow] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await API.get('/doctor/reports');
      setReports(res.data);
      setError('');
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sortData = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedReports = () => {
    let sortedReports = [...reports];
    
    // Filter by status
    if (filterStatus !== 'all') {
      sortedReports = sortedReports.filter(r => 
        filterStatus === 'reviewed' ? r.isReviewed : !r.isReviewed
      );
    }

    // Sort
    sortedReports.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sortedReports;
  };

  const toggleExpandRow = (reportId) => {
    setExpandedRow(expandedRow === reportId ? null : reportId);
  };

  const verifyReport = async (reportId) => {
    const doctorComments = prompt('Enter your comments:');
    if (!doctorComments) return;

    const doctorScore = prompt('Enter risk score (0-1):');
    if (!doctorScore || isNaN(doctorScore)) {
      alert('Invalid score');
      return;
    }

    try {
      await API.put(`/doctor/verify/${reportId}`, {
        doctorComments,
        doctorScore: parseFloat(doctorScore),
      });
      alert('Report verified successfully');
      
      setReports(prev =>
        prev.map(r =>
          r.reportId === reportId 
            ? { ...r, isReviewed: true, status: 'Completed', doctorScore: parseFloat(doctorScore), doctorComments } 
            : r
        )
      );
    } catch (err) {
      console.error('Error verifying report:', err);
      alert('Failed to verify report. Please try again.');
    }
  };

  const sortedReports = getSortedReports();

  if (loading) {
    return (
      <div className="doctor-dashboard">
        <div className="loading">⏳ Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="doctor-dashboard">
      <div className="dashboard-header">
        <h2>🩺 Doctor Dashboard - Patient Reports</h2>
        <div className="header-actions">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Reports</option>
            <option value="pending">Pending Review</option>
            <option value="reviewed">Reviewed</option>
          </select>
          <button onClick={fetchReports} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-number">{reports.length}</div>
          <div className="stat-label">Total Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{reports.filter(r => !r.isReviewed).length}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{reports.filter(r => r.isReviewed).length}</div>
          <div className="stat-label">Reviewed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{reports.filter(r => r.score > 0.7).length}</div>
          <div className="stat-label">High Risk (&gt;7)</div>
        </div>
      </div>

      {sortedReports.length === 0 ? (
        <div className="no-reports">📋 No reports available</div>
      ) : (
        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th onClick={() => sortData('patientName')} className="sortable">
                  Patient Name {sortConfig.key === 'patientName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => sortData('patientId')} className="sortable">
                  Patient ID {sortConfig.key === 'patientId' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => sortData('score')} className="sortable">
                  AI Risk Score {sortConfig.key === 'score' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => sortData('uploadDate')} className="sortable">
                  Upload Date {sortConfig.key === 'uploadDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => sortData('uploadedBy')} className="sortable">
                  Uploaded By {sortConfig.key === 'uploadedBy' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => sortData('status')} className="sortable">
                  Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => sortData('isReviewed')} className="sortable">
                  Verified {sortConfig.key === 'isReviewed' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedReports.map((r) => (
                <React.Fragment key={r.reportId}>
                  <tr className={`${r.isReviewed ? 'verified' : 'pending'} ${expandedRow === r.reportId ? 'expanded' : ''}`}>
                    <td>{r.patientName}</td>
                    <td>{r.patientId}</td>
                    <td>
                      <span className={`score-badge ${r.score > 0.7 ? 'high' : r.score > 0.4 ? 'medium' : 'low'}`}>
                        {(r.score).toFixed(1)}
                      </span>
                    </td>
                    <td>{new Date(r.uploadDate).toLocaleDateString()}</td>
                    <td>{r.uploadedBy}</td>
                    <td>
                      <span className={`status-badge ${r.status.toLowerCase()}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="verified-cell">
                      {r.isReviewed ? '✅' : '⏳'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => toggleExpandRow(r.reportId)}
                          className="view-btn"
                          title="View Details"
                        >
                          {expandedRow === r.reportId ? '▼ Hide' : '▶ View'}
                        </button>
                        {!r.isReviewed && (
                          <button 
                            onClick={() => verifyReport(r.reportId)}
                            className="verify-btn"
                            title="Verify Report"
                          >
                            ✓ Verify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedRow === r.reportId && (
                    <tr className="expanded-row">
                      <td colSpan="8">
                        <div className="expanded-content">
                          <div className="details-grid">
                            <div className="detail-section">
                              <h4>👤 Patient Information</h4>
                              <p><strong>Name:</strong> {r.patientName}</p>
                              <p><strong>ID:</strong> {r.patientId}</p>
                              <p><strong>Gender:</strong> {r.patientGender}</p>
                              <p><strong>DOB:</strong> {r.patientDOB ? new Date(r.patientDOB).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            
                            <div className="detail-section">
                              <h4>📊 Risk Assessment</h4>
                              <p><strong>AI Risk Score:</strong> <span className={`score-value ${r.score > 0.7 ? 'high' : r.score > 0.4 ? 'medium' : 'low'}`}>{(r.score).toFixed(1)}</span></p>
                              {r.isReviewed && (
                                <>
                                  <p><strong>Doctor Score:</strong> <span className="score-value">{r.doctorScore ? (r.doctorScore * 10).toFixed(1) : 'N/A'}</span></p>
                                  <p><strong>Doctor Comments:</strong> {r.doctorComments || 'None'}</p>
                                </>
                              )}
                            </div>

                            <div className="detail-section">
                              <h4>📁 Upload Information</h4>
                              <p><strong>Uploaded By:</strong> {r.uploadedBy}</p>
                              <p><strong>Email:</strong> {r.uploaderEmail}</p>
                              <p><strong>Date:</strong> {new Date(r.uploadDate).toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="detail-section full-width">
                            <h4>Summary</h4>
                            <div className="llm-report-content">
                              {r.llmReport}
                            </div>
                          </div>

                          <div className="detail-section full-width">
                            <h4>Extracted Text</h4>
                            <div className="ocr-text-content">
                              {r.ocrText && r.ocrText.length > 0 ? r.ocrText : 'No OCR text available'}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DoctorDashboard;