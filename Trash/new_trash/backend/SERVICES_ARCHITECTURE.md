# Report Storage Service Architecture

## Overview

The `reportService.js` provides a clean, reusable interface for report persistence operations. This document explains the design, usage, and benefits.

## Service Location

```
backend/src/services/reportService.js
```

## Core Functions

### 1. `ensurePatient(details)`

**Purpose**: Ensures a patient exists in the database. Creates one if it doesn't.

**Signature**:
```javascript
async function ensurePatient(details)
  -> Promise<{patient: Document, existed: boolean}>
```

**Parameters**:
```javascript
{
  patientId: string,      // Required: Unique external ID
  name: string,           // Optional: Patient name
  dateOfBirth: Date,      // Optional: DOB
  gender: string          // Optional: M/F/Other
}
```

**Returns**:
```javascript
{
  patient: Patient,       // MongoDB Patient document
  existed: boolean        // true if already in DB, false if created
}
```

**Example**:
```javascript
const { patient, existed } = await ensurePatient({
  patientId: 'P12345',
  name: 'John Doe',
  dateOfBirth: new Date('1980-01-15'),
  gender: 'Male'
});

if (existed) {
  console.log('Patient already exists');
} else {
  console.log('New patient created');
}
```

### 2. `createReportForPatient(opts)`

**Purpose**: Creates a report document and links it to a patient.

**Signature**:
```javascript
async function createReportForPatient(opts)
  -> Promise<Document>
```

**Parameters**:
```javascript
{
  patient: ObjectId | Document,        // Required: Patient ID or document
  uploadedBy: ObjectId | Document,     // Required: Uploader User ID
  originalReportUrl: string,           // Required: File path or URL
  ocrText: string,                     // Optional: Extracted text
  llmGeneratedReport: string,          // Optional: Analysis summary
  normalizedScore: number,             // Optional: 0-1 severity score
  status: string                       // Optional: 'In Progress'|'Completed'
}
```

**Returns**:
```javascript
// Report document with all fields
{
  _id: ObjectId,
  patient: ObjectId,
  uploadedBy: ObjectId,
  originalReportUrl: string,
  ocrText: string,
  llmGeneratedReport: string,
  normalizedScore: number,
  status: 'In Progress',
  doctorVerification: {...},
  uploadDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Example**:
```javascript
const report = await createReportForPatient({
  patient: patientId,
  uploadedBy: userId,
  originalReportUrl: '/uploads/report.pdf',
  ocrText: 'Extracted text from OCR...',
  llmGeneratedReport: 'LLM analysis result...',
  normalizedScore: 0.78,
  status: 'In Progress'
});

console.log(`Report created: ${report._id}`);
```

## Integration in Controller

The service is used in `pathologistController.js`:

```javascript
const { ensurePatient, createReportForPatient } = require('../services/reportService');

// In uploadReport handler:
async uploadReport(req, res) {
  try {
    // ... file upload, OCR, LLM processing ...

    // Ensure patient exists
    const { patient, existed } = await ensurePatient(patientDetails);

    if (existed) {
      return res.status(200).json({
        message: 'Patient already exists. Do you want to submit an updated report?',
        patientId: patient.patientId
      });
    }

    // Create report linked to patient
    const report = await createReportForPatient({
      patient,
      uploadedBy: req.user._id,
      originalReportUrl: reportUrl,
      ocrText: ocrResult,
      llmGeneratedReport: llmResult.report,
      normalizedScore: llmResult.score,
      status: 'In Progress'
    });

    res.status(201).json({
      message: 'Report uploaded successfully',
      reportId: report._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing report' });
  }
}
```

## Data Flow

```
Pathologist Upload
        ↓
[storageService.uploadToStorage()]
        ↓
[ocrService.performOCR()]
        ↓
[llmService.generateLLMReport()]
        ↓
Extract Patient Details
        ↓
[reportService.ensurePatient()]     ← Service Layer
        ↓
Patient exists? Yes → Check for patient
        ↓ No
Create new patient
        ↓
[reportService.createReportForPatient()]  ← Service Layer
        ↓
Create report document
Append to patient.reports
        ↓
Return reportId to frontend
```

## Database Operations

### ensurePatient() - Database Interactions

```javascript
// 1. Query for existing patient
const patient = await Patient.findOne({ patientId });

// 2. If not found, create new
patient = await Patient.create({
  patientId,
  name,
  dateOfBirth,
  gender
});

// 3. Return with flag
return { patient, existed: false };
```

### createReportForPatient() - Database Interactions

```javascript
// 1. Create report document
const report = await Report.create({
  patient: patientId,
  uploadedBy: uploaderId,
  originalReportUrl,
  ocrText,
  llmGeneratedReport,
  normalizedScore,
  status
});

// 2. Update patient's reports array
await Patient.findByIdAndUpdate(patientId, {
  $push: { reports: report._id }
});

// 3. Return report
return report;
```

## Benefits

### 1. **Code Reusability**

Before:
```javascript
// Controller A
const patient = await Patient.findOne({...});
if (!patient) {
  const newPatient = await Patient.create({...});
  const report = await Report.create({...});
  await Patient.findByIdAndUpdate(newPatient._id, {$push: {...}});
}

// Controller B (Duplicated)
const patient = await Patient.findOne({...});
if (!patient) {
  const newPatient = await Patient.create({...});
  const report = await Report.create({...});
  await Patient.findByIdAndUpdate(newPatient._id, {$push: {...}});
}
```

After:
```javascript
// Both controllers
const { patient, existed } = await ensurePatient(details);
const report = await createReportForPatient(opts);
```

### 2. **Consistency**

All report creation follows the same pattern:
- Patient lookup/creation
- Report creation
- Reference maintenance
- Error handling

### 3. **Maintainability**

Changes to report logic happen in one place:

```javascript
// Easy to add validation, logging, notifications
async function createReportForPatient(opts) {
  // Validate inputs
  validateReportData(opts);
  
  // Log audit trail
  auditLog.create('report_created', opts);
  
  // Create report
  const report = await Report.create({...});
  
  // Send notifications
  await notificationService.notify(opts.patient, 'New report');
  
  // Update analytics
  analytics.increment('reports_created');
  
  return report;
}
```

### 4. **Separation of Concerns**

- **Controller**: Request/response handling
- **Service**: Business logic
- **Model**: Database operations

```
Request
  ↓
Controller (validate request, call service)
  ↓
Service (execute business logic)
  ↓
Model (database operations)
  ↓
Response
```

### 5. **Error Handling**

Centralized error handling in service:

```javascript
async function ensurePatient(details) {
  if (!details || !details.patientId) {
    throw new Error('ensurePatient: patientId is required');
  }
  
  try {
    // ... operations ...
  } catch (error) {
    logger.error('Patient ensure failed', error);
    throw new Error('Failed to process patient');
  }
}
```

## Usage Patterns

### Pattern 1: New Patient + New Report

```javascript
const { patient, existed } = await ensurePatient(details);

if (!existed) {
  // New patient
  const report = await createReportForPatient({
    patient,
    uploadedBy,
    originalReportUrl,
    ocrText,
    llmGeneratedReport,
    normalizedScore
  });
}
```

### Pattern 2: Existing Patient + New Report

```javascript
const { patient, existed } = await ensurePatient(details);

if (existed) {
  // Patient exists, add new report
  const report = await createReportForPatient({
    patient,
    uploadedBy,
    originalReportUrl,
    // ... other fields
  });
}
```

### Pattern 3: Batch Operations

```javascript
// Import multiple reports
const reports = await getReportsFromFile('import.json');

for (const reportData of reports) {
  const { patient } = await ensurePatient(reportData.patient);
  
  await createReportForPatient({
    patient,
    uploadedBy: adminUser._id,
    ...reportData
  });
}
```

## Testing

### Unit Test Example

```javascript
const { ensurePatient, createReportForPatient } = require('./reportService');
const Patient = require('../models/patients');
const Report = require('../models/reports');

describe('reportService', () => {
  beforeEach(async () => {
    await Patient.deleteMany({});
    await Report.deleteMany({});
  });

  describe('ensurePatient', () => {
    it('should create new patient if not exists', async () => {
      const { patient, existed } = await ensurePatient({
        patientId: 'P001',
        name: 'John Doe'
      });

      expect(existed).toBe(false);
      expect(patient.patientId).toBe('P001');
      expect(patient.name).toBe('John Doe');
    });

    it('should return existing patient', async () => {
      const created = await Patient.create({
        patientId: 'P002',
        name: 'Jane Doe'
      });

      const { patient, existed } = await ensurePatient({
        patientId: 'P002',
        name: 'Jane Doe'
      });

      expect(existed).toBe(true);
      expect(patient._id.toString()).toBe(created._id.toString());
    });
  });

  describe('createReportForPatient', () => {
    it('should create report and link to patient', async () => {
      const patient = await Patient.create({
        patientId: 'P003',
        name: 'Test Patient'
      });

      const report = await createReportForPatient({
        patient: patient._id,
        uploadedBy: new ObjectId(),
        originalReportUrl: '/test/report.pdf',
        normalizedScore: 0.5
      });

      expect(report.patient.toString()).toBe(patient._id.toString());
      expect(report.normalizedScore).toBe(0.5);

      const updatedPatient = await Patient.findById(patient._id);
      expect(updatedPatient.reports.length).toBe(1);
    });
  });
});
```

## Future Enhancements

### 1. Add Transaction Support

```javascript
async function createReportForPatient(opts, session) {
  // Use MongoDB transactions for consistency
  const report = await Report.create([{...}], { session });
  await Patient.updateOne({...}, {...}, { session });
  // If either fails, both roll back
}
```

### 2. Add Caching

```javascript
async function ensurePatient(details) {
  const cached = await cache.get(`patient:${details.patientId}`);
  if (cached) return { patient: cached, existed: true };
  
  // ... normal logic ...
}
```

### 3. Add Event Emission

```javascript
async function createReportForPatient(opts) {
  const report = await Report.create({...});
  
  // Emit event for other services
  eventBus.emit('report.created', {
    reportId: report._id,
    patientId: opts.patient,
    uploadedBy: opts.uploadedBy
  });
  
  return report;
}
```

### 4. Add Audit Logging

```javascript
async function createReportForPatient(opts) {
  const report = await Report.create({...});
  
  await AuditLog.create({
    action: 'REPORT_CREATED',
    reportId: report._id,
    userId: opts.uploadedBy,
    timestamp: new Date(),
    changes: opts
  });
  
  return report;
}
```

## Summary

The report storage service provides:
- ✅ Centralized business logic
- ✅ Reduced code duplication
- ✅ Consistent database operations
- ✅ Easy error handling
- ✅ Simple testing
- ✅ Clear API contract
- ✅ Future extensibility

This architecture makes the system maintainable, scalable, and ready for production use.
