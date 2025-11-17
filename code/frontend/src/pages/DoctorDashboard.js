import React, { useEffect, useState } from 'react';
import API from '../api/api';
import './DoctorDashboard.css';

function DoctorDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');

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

  const openPatientDetails = async (reportId) => {
    try {
      const res = await API.get(`/doctor/reports/${reportId}`);
      setSelectedReport(res.data);
      setShowModal(true);
    } catch (err) {
      console.error('Error fetching report details:', err);
      alert('Failed to load patient details');
    }
  };

  const viewPDF = (fileLocation) => {
    if (!fileLocation) {
      alert('PDF file not available');
      return;
    }
    // Construct the PDF URL - adjust based on your backend setup
    const pdfPath = `http://localhost:5001${fileLocation}`;
    setPdfUrl(pdfPath);
  };

  const downloadPDF = (fileLocation, patientName) => {
    if (!fileLocation) {
      alert('PDF file not available');
      return;
    }
    const pdfPath = `http://localhost:5001${fileLocation}`;
    const link = document.createElement('a');
    link.href = pdfPath;
    link.download = `${patientName}_report.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const closePDFViewer = () => {
    setPdfUrl(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReport(null);
  };

  const verifyReport = async (reportId) => {
    const doctorComments = prompt('Enter your comments:');
    if (!doctorComments) return;

    const doctorScore = prompt('Enter risk score (0-100):');
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
      fetchReports(); // Refresh the list
      if (selectedReport && selectedReport.reportId === reportId) {
        closeModal();
      }
    } catch (err) {
      console.error('Error verifying report:', err);
      alert('Failed to verify report. Please try again.');
    }
  };

  // Filter and search reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.patientId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'all' || report.riskLevel === filterRisk;
    return matchesSearch && matchesRisk;
  });

  const getRiskColor = (riskLevel) => {
    switch(riskLevel) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="doctor-dashboard">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h2>🩺 Doctor Dashboard</h2>
          <p className="subtitle">Cancer Risk Analysis Reports</p>
        </div>
        <button onClick={fetchReports} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filters and Search */}
      <div className="controls-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search by patient name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <label>Filter by Risk:</label>
          <select 
            value={filterRisk} 
            onChange={(e) => setFilterRisk(e.target.value)}
            className="risk-filter"
          >
            <option value="all">All Risks</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
        <div className="stats-summary">
          <span className="stat-badge">Total: {filteredReports.length}</span>
          <span className="stat-badge high">High: {filteredReports.filter(r => r.riskLevel === 'high').length}</span>
          <span className="stat-badge medium">Medium: {filteredReports.filter(r => r.riskLevel === 'medium').length}</span>
          <span className="stat-badge low">Low: {filteredReports.filter(r => r.riskLevel === 'low').length}</span>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="no-reports">
          <p>📋 No reports found</p>
        </div>
      ) : (
        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Patient Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Risk Level</th>
                <th>Cancer Score</th>
                <th>Upload Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr 
                  key={report.reportId} 
                  className={`report-row ${report.isReviewed ? 'verified' : 'pending'}`}
                >
                  <td className="patient-id">{report.patientId}</td>
                  <td className="patient-name">
                    <strong>{report.patientName}</strong>
                  </td>
                  <td>{calculateAge(report.dateOfBirth)} yrs</td>
                  <td>{report.gender}</td>
                  <td>
                    <span 
                      className="risk-badge" 
                      style={{ backgroundColor: getRiskColor(report.riskLevel) }}
                    >
                      {report.riskLevel.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="score-container">
                      <span className="score-value">{report.cancerPositiveScore}%</span>
                      <div className="score-bar">
                        <div 
                          className="score-fill" 
                          style={{ 
                            width: `${report.cancerPositiveScore}%`,
                            backgroundColor: getRiskColor(report.riskLevel)
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>{formatDate(report.uploadDate)}</td>
                  <td>
                    <span className={`status-badge ${report.status.toLowerCase()}`}>
                      {report.isReviewed ? '✅ Verified' : '⏳ ' + report.status}
                    </span>
                  </td>
                  <td className="action-buttons">
                    <button 
                      onClick={() => openPatientDetails(report.reportId)}
                      className="btn-view"
                      title="View Details"
                    >
                      👁️ View
                    </button>
                    {report.fileLocation && (
                      <>
                        <button 
                          onClick={() => viewPDF(report.fileLocation)}
                          className="btn-pdf"
                          title="View PDF"
                        >
                          📄 View
                        </button>
                        <button 
                          onClick={() => downloadPDF(report.fileLocation, report.patientName)}
                          className="btn-download"
                          title="Download PDF"
                        >
                          ⬇️ Download
                        </button>
                      </>
                    )}
                    {!report.isReviewed && (
                      <button 
                        onClick={() => verifyReport(report.reportId)}
                        className="btn-verify"
                        title="Verify Report"
                      >
                        ✓ Verify
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Patient Details Modal */}
      {showModal && selectedReport && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Patient Details & Analysis</h3>
              <button onClick={closeModal} className="close-btn">✕</button>
            </div>
            
            <div className="modal-body">
              {/* Patient Information */}
              <div className="info-section">
                <h4>👤 Patient Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Patient ID:</label>
                    <span>{selectedReport.patient.id}</span>
                  </div>
                  <div className="info-item">
                    <label>Name:</label>
                    <span>{selectedReport.patient.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Date of Birth:</label>
                    <span>{formatDate(selectedReport.patient.dateOfBirth)}</span>
                  </div>
                  <div className="info-item">
                    <label>Age:</label>
                    <span>{calculateAge(selectedReport.patient.dateOfBirth)} years</span>
                  </div>
                  <div className="info-item">
                    <label>Gender:</label>
                    <span>{selectedReport.patient.gender}</span>
                  </div>
                  <div className="info-item">
                    <label>Phone:</label>
                    <span>{selectedReport.patient.phoneNumber}</span>
                  </div>
                </div>
              </div>

              {/* File Information */}
              <div className="info-section">
                <h4>📁 File Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>File Name:</label>
                    <span>{selectedReport.fileInfo.originalFileName}</span>
                  </div>
                  <div className="info-item">
                    <label>Upload Date:</label>
                    <span>{formatDate(selectedReport.fileInfo.uploadDate)}</span>
                  </div>
                  <div className="info-item full-width">
                    <label>File Location:</label>
                    <span className="file-path">{selectedReport.fileInfo.fileLocation || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Cancer Risk Analysis */}
              <div className="info-section analysis-section">
                <h4>🔬 Cancer Risk Analysis</h4>
                <div className="analysis-grid">
                  <div className="analysis-card">
                    <label>Risk Level</label>
                    <span 
                      className="risk-badge-large" 
                      style={{ backgroundColor: getRiskColor(selectedReport.analysis.riskLevel) }}
                    >
                      {selectedReport.analysis.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  <div className="analysis-card">
                    <label>Cancer Positive Score</label>
                    <div className="score-display">
                      <span className="score-number">{selectedReport.analysis.cancerPositiveScore}%</span>
                      <div className="progress-bar-large">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${selectedReport.analysis.cancerPositiveScore}%`,
                            backgroundColor: getRiskColor(selectedReport.analysis.riskLevel)
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="diagnosis-box">
                  <label>Diagnosis Analysis:</label>
                  <p className="diagnosis-text">{selectedReport.analysis.diagnosisAnalysis}</p>
                </div>
              </div>

              {/* Doctor Verification */}
              <div className="info-section">
                <h4>👨‍⚕️ Doctor Verification</h4>
                {selectedReport.doctorVerification.isVerified ? (
                  <div className="verification-details">
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Verified:</label>
                        <span className="verified-badge">✅ Yes</span>
                      </div>
                      <div className="info-item">
                        <label>Doctor Score:</label>
                        <span>{selectedReport.doctorVerification.doctorScore}</span>
                      </div>
                      <div className="info-item">
                        <label>Verification Date:</label>
                        <span>{formatDate(selectedReport.doctorVerification.verificationDate)}</span>
                      </div>
                      <div className="info-item full-width">
                        <label>Doctor Comments:</label>
                        <p className="comments-text">{selectedReport.doctorVerification.doctorComments}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="not-verified">
                    <p>⏳ Not yet verified by a doctor</p>
                    <button 
                      onClick={() => verifyReport(selectedReport.reportId)}
                      className="btn-verify-modal"
                    >
                      Verify Now
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              {selectedReport.fileInfo.fileLocation && (
                <>
                  <button 
                    onClick={() => viewPDF(selectedReport.fileInfo.fileLocation)}
                    className="btn-pdf-large"
                  >
                    📄 View Full PDF Report
                  </button>
                  <button 
                    onClick={() => downloadPDF(selectedReport.fileInfo.fileLocation, selectedReport.patient.name)}
                    className="btn-download-large"
                  >
                    ⬇️ Download PDF
                  </button>
                </>
              )}
              <button onClick={closeModal} className="btn-close-modal">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {pdfUrl && (
        <div className="pdf-modal-overlay" onClick={closePDFViewer}>
          <div className="pdf-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-header">
              <h3>📄 PDF Viewer</h3>
              <button onClick={closePDFViewer} className="close-btn">✕</button>
            </div>
            <div className="pdf-container">
              <iframe
                src={pdfUrl}
                title="PDF Viewer"
                className="pdf-iframe"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorDashboard;
