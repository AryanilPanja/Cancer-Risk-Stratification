import apiClient from './apiClient';

export const reportService = {
  // Upload a new report as pathologist
  uploadReport: async (file) => {
    const formData = new FormData();
    formData.append('report', file);

    // Use direct axios post with multipart headers
    const token = localStorage.getItem('authToken');
    const response = await fetch('http://localhost:5001/api/pathologist/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  },

  // Confirm upload for existing patient
  confirmUpload: async (patientId, reportData) => {
    const response = await apiClient.post('/pathologist/upload/confirm', {
      patientId,
      reportData
    });
    return response.data;
  },

  // Get all reports (for doctor)
  getAllReports: async () => {
    const response = await apiClient.get('/doctor/reports');
    return response.data;
  },

  // Get report by ID
  getReportById: async (reportId) => {
    const response = await apiClient.get(`/doctor/reports/${reportId}`);
    return response.data;
  },

  // Verify report (for doctor)
  verifyReport: async (reportId, doctorComments, doctorScore) => {
    const response = await apiClient.post(`/doctor/reports/${reportId}/verify`, {
      doctorComments,
      doctorScore
    });
    return response.data;
  }
};
