import React, { useEffect, useState } from 'react';
import API from '../api/api';

function DoctorDashboard() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      const res = await API.get('/doctor/reports');
      setReports(res.data);
    };
    fetchReports();
  }, []);

  const verifyReport = async (reportId) => {
    await API.put(`/doctor/verify/${reportId}`, {
      doctorComments: 'Verified by doctor',
      doctorScore: 0.8,
    });
    alert('Report verified');
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Doctor Dashboard</h2>
      {reports.map((r) => (
        <div key={r.reportId} style={{ margin: '10px', border: '1px solid gray', padding: '5px' }}>
          <p><b>Patient:</b> {r.patientName}</p>
          <p><b>Score:</b> {r.score}</p>
          <button onClick={() => verifyReport(r.reportId)}>Verify</button>
        </div>
      ))}
    </div>
  );
}

export default DoctorDashboard;