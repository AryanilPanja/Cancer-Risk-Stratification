# 🎨 Visual Architecture & Component Guide

This guide provides visual representations of the system architecture and component relationships.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    USER INTERFACE (React)                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Login Page  │  │ Register     │  │ Home Page    │         │
│  └──────┬───────┘  │ Page         │  └──────────────┘         │
│         │          └──────┬───────┘                             │
│         └──────────────────┼───────────────────┐              │
│                            │                   │               │
│         ┌──────────────────┼───────────────────┘              │
│         │                  │                                   │
│  ┌──────▼─────────┐  ┌─────▼─────────────┐                   │
│  │ Navbar         │  │ PathologistUpload │ ⭐ MAIN FEATURE   │
│  │ Component      │  │ Page              │                   │
│  └────────────────┘  └───────────────────┘                   │
│                            │                                   │
│  ┌───────────────────────────────────────────────┐           │
│  │ File Drag & Drop                              │           │
│  │ ├─ Validate: JPG/PNG/PDF                     │           │
│  │ ├─ Check size: < 10MB                        │           │
│  │ └─ Show progress bar                         │           │
│  └───────────────────┬───────────────────────────┘           │
│                      │                                        │
└──────────────────────┼────────────────────────────────────────┘
                       │ FormData + JWT
                       │ POST /api/pathologist/upload
                       ▼
┌────────────────────────────────────────────────────────────────┐
│              BACKEND PROCESSING (Node.js/Express)              │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  pathologistController.uploadReport()                          │
│  │                                                             │
│  ├─ Authenticate JWT                                          │
│  │                                                             │
│  ├─ storageService.uploadToStorage()                          │
│  │  └─ Save to ./uploads/timestamp-filename                  │
│  │                                                             │
│  ├─ ocrService.performOCR()                                   │
│  │  └─ Call OCR.space API → Extract text                     │
│  │                                                             │
│  ├─ extractPatientDetails()                                   │
│  │  └─ Parse OCR for patient info                            │
│  │                                                             │
│  ├─ reportService.ensurePatient() ⭐                          │
│  │  ├─ Check Patient.findOne({patientId})                    │
│  │  └─ Create if not exists                                  │
│  │                                                             │
│  ├─ llmService.generateLLMReport()                            │
│  │  └─ Keyword analysis → Score (0-1)                        │
│  │                                                             │
│  ├─ reportService.createReportForPatient() ⭐                │
│  │  ├─ Create Report document                                │
│  │  ├─ Add to patient.reports array                          │
│  │  └─ Return report                                         │
│  │                                                             │
│  └─ Return reportId to frontend                              │
│                                                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────┐
│              DATABASE (MongoDB)                                │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐                                     │
│  │ Users Collection     │  ← JWT authentication                │
│  │ {                    │                                      │
│  │   username, password,│                                      │
│  │   role, timestamps   │                                      │
│  │ }                    │                                      │
│  └──────────────────────┘                                     │
│                                                                 │
│  ┌──────────────────────┐                                     │
│  │ Patients Collection  │                                      │
│  │ {                    │                                      │
│  │   patientId, name,   │  ← Created by reportService         │
│  │   dateOfBirth,       │                                      │
│  │   gender,            │                                      │
│  │   reports: [...]  ◄──┼─── References to Reports            │
│  │ }                    │                                      │
│  └──────────────────────┘                                     │
│                                                                 │
│  ┌──────────────────────────────┐                             │
│  │ Reports Collection           │                              │
│  │ {                            │                              │
│  │   patient: ObjectId ────────►│ Link to Patient              │
│  │   uploadedBy: ObjectId,      │                              │
│  │   originalReportUrl,         │                              │
│  │   ocrText,                   │  ← Created by reportService  │
│  │   llmGeneratedReport,        │                              │
│  │   normalizedScore,           │                              │
│  │   doctorVerification: {...}, │                              │
│  │   status: 'In Progress',     │                              │
│  │   timestamps                 │                              │
│  │ }                            │                              │
│  └──────────────────────────────┘                             │
│                                                                 │
│  ┌──────────────────────┐                                     │
│  │ Files on Disk        │                                      │
│  │ /uploads/            │                                      │
│  │ ├─ timestamp-file.pdf│  ← Saved by storageService         │
│  │ ├─ timestamp-img.jpg │                                      │
│  │ └─ ...               │                                      │
│  └──────────────────────┘                                     │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│ PATHOLOGIST UPLOAD SEQUENCE                                     │
└─────────────────────────────────────────────────────────────────┘

STEP 1: User Interaction
┌──────────────┐
│ Pathologist  │
└──────┬───────┘
       │ 1. Login
       │ 2. Click Upload Report
       │ 3. Select file (JPG/PNG/PDF)
       │ 4. Validate: size, type
       │ 5. Click Upload
       ▼
   ┌─────────────────────┐
   │ Frontend Validation │
   │ ✓ File size < 10MB  │
   │ ✓ Correct type      │
   └────────┬────────────┘
            │
            ▼
STEP 2: File Upload
    FormData {
        report: File,
        headers: {
            Authorization: Bearer JWT_TOKEN
        }
    }
    │
    ▼
POST /api/pathologist/upload
    │
    ▼
STEP 3: Backend Processing
┌──────────────────────────────────────────┐
│ pathologistController.uploadReport()     │
├──────────────────────────────────────────┤
│ ✓ Check JWT token                        │
│ ✓ Verify user is pathologist            │
│ ✓ Validate file exists                   │
└──────────────────────────────────────────┘
    │
    ├─► storageService.uploadToStorage()
    │   └─ Save file to ./uploads/
    │      └ Return file path
    │
    ├─► ocrService.performOCR(filePath)
    │   └─ POST to OCR.space API
    │      └ Return extracted text
    │
    ├─► extractPatientDetails(ocrText)
    │   └─ Parse patient info from text
    │      └ Return {patientId, name, DOB, gender}
    │
    ├─► reportService.ensurePatient(details)
    │   │
    │   ├─► Patient.findOne({patientId})
    │   │   ├─ IF EXISTS: return {patient, existed: true}
    │   │   └─ IF NOT: create new, return {patient, existed: false}
    │   │
    │   └─ Return patient object
    │
    ├─► llmService.generateLLMReport(ocrText)
    │   └─ Analyze keywords
    │      └ Calculate severity score (0-1)
    │         └ Return {report, score}
    │
    ├─► reportService.createReportForPatient(opts)
    │   │
    │   ├─► Report.create({
    │   │       patient: patientId,
    │   │       uploadedBy: userId,
    │   │       originalReportUrl: path,
    │   │       ocrText: text,
    │   │       llmGeneratedReport: analysis,
    │   │       normalizedScore: score,
    │   │       status: 'In Progress'
    │   │   })
    │   │   └─ Return report doc
    │   │
    │   └─► Patient.findByIdAndUpdate()
    │       └─ $push report._id to patient.reports
    │          └─ Maintain reference integrity
    │
    ▼
STEP 4: Response
{
    message: "Report uploaded successfully",
    reportId: "60d5ec49c1234567890abcd"
}
    │
    ▼
STEP 5: Frontend Displays
- Clear upload form
- Show success message
- Display report ID
- Hide progress bar
- Ready for next upload
```

---

## 📊 Component Relationships

```
┌─────────────────────────────────────────────────────────┐
│ FRONTEND COMPONENT HIERARCHY                            │
└─────────────────────────────────────────────────────────┘

App (main component)
│
├─ AuthProvider (Context wrapper)
│  │
│  ├─ Navbar
│  │  ├─ Brand/Logo
│  │  ├─ Navigation Links
│  │  │  ├─ /upload (if pathologist)
│  │  │  ├─ /reports (if doctor)
│  │  │  └─ /login (if not authenticated)
│  │  └─ User Info Display
│  │
│  └─ Routes
│     │
│     ├─ Public Routes
│     │  ├─ / (Home)
│     │  │  ├─ Feature cards
│     │  │  ├─ How it works
│     │  │  └─ CTA buttons
│     │  │
│     │  ├─ /login (Login)
│     │  │  ├─ Username input
│     │  │  ├─ Password input
│     │  │  └─ Submit button
│     │  │
│     │  └─ /register (Register)
│     │     ├─ Username input
│     │     ├─ Password input
│     │     ├─ Role selector
│     │     └─ Submit button
│     │
│     └─ Protected Routes
│        └─ /upload (PathologistUpload)
│           ├─ File drop zone
│           ├─ File input
│           ├─ Progress bar
│           ├─ File info display
│           ├─ Error/Success messages
│           └─ Upload button

┌─────────────────────────────────────────────────────────┐
│ AUTHENTICATION FLOW                                     │
└─────────────────────────────────────────────────────────┘

User Registration/Login
        │
        ├─► authService.login(username, password)
        │   │
        │   └─► apiClient.post('/auth/login')
        │       │
        │       ├─ Backend validates credentials
        │       ├─ Generates JWT token
        │       └─ Returns { token, user }
        │
        ├─► AuthContext.login(user, token)
        │   │
        │   ├─ Update React state
        │   ├─ Save to localStorage
        │   └─ Set isAuthenticated = true
        │
        └─► Redirect based on role
            ├─ pathologist → /upload
            ├─ doctor → /reports
            └─ admin → /admin

Protected Route Access
        │
        ├─► Check isAuthenticated
        │   └─ IF false → Redirect to /login
        │
        ├─► Check user role
        │   └─ IF role != required → Redirect to /
        │
        └─► Render component
```

---

## 📤 Upload Process Detailed

```
┌─────────────────────────────────────────────────────────┐
│ UPLOAD PROCESS - DETAILED STEPS                         │
└─────────────────────────────────────────────────────────┘

Frontend (PathologistUpload.js)
┌─────────────────────────────────────────────────────────┐
│ 1. User selects file                                    │
│    └─ handleFileChange() validates                      │
│       ├─ Check MIME type (image/jpeg, image/png, ...)  │
│       ├─ Check size < 10 * 1024 * 1024 bytes           │
│       └─ Store in state                                │
│                                                          │
│ 2. User clicks Upload                                   │
│    └─ handleSubmit() called                             │
│       ├─ Validate file exists                          │
│       ├─ Create FormData                               │
│       ├─ Get token from localStorage                   │
│       └─ Post to backend                               │
│                                                          │
│ 3. Upload progress                                      │
│    └─ setUploadProgress(0...100)                        │
│       ├─ Show progress bar                             │
│       └─ Update percentage text                        │
│                                                          │
│ 4. Handle response                                      │
│    ├─ Success:                                          │
│    │  ├─ Show success message                          │
│    │  ├─ Display reportId                              │
│    │  ├─ Clear form                                    │
│    │  └─ Reset after 5 seconds                         │
│    │                                                    │
│    └─ Error:                                            │
│       ├─ Catch error                                   │
│       ├─ Display error message                         │
│       └─ Reset form                                    │
└─────────────────────────────────────────────────────────┘

Backend (pathologistController.js)
┌─────────────────────────────────────────────────────────┐
│ 1. Receive request                                      │
│    └─ router.post('/upload', upload.single('report'),  │
│                  uploadReport)                         │
│                                                          │
│ 2. Authenticate                                         │
│    └─ authenticateToken middleware                     │
│       ├─ Extract Bearer token                          │
│       ├─ Verify JWT                                    │
│       └─ Check pathologist role                        │
│                                                          │
│ 3. Validate file                                        │
│    └─ Check req.file exists                            │
│                                                          │
│ 4. Upload to storage                                    │
│    └─ uploadToStorage(file)                            │
│       ├─ Create uploads directory if needed            │
│       ├─ Generate unique filename                      │
│       ├─ Write to disk                                 │
│       └─ Return file path                              │
│                                                          │
│ 5. OCR extraction                                       │
│    └─ performOCR(reportUrl)                            │
│       ├─ Send to OCR.space API                         │
│       ├─ Wait for response (timeout: 120s)             │
│       └─ Return extracted text                         │
│                                                          │
│ 6. Extract patient details                             │
│    └─ extractPatientDetails(ocrText)                   │
│       ├─ Parse regex patterns                          │
│       └─ Return {patientId, name, DOB, gender}         │
│                                                          │
│ 7. Ensure patient exists                               │
│    └─ reportService.ensurePatient(details)             │
│       ├─ Query Patient.findOne({patientId})            │
│       ├─ IF found: return existing                     │
│       ├─ IF not: create new Patient                    │
│       └─ Return { patient, existed }                   │
│                                                          │
│ 8. Check if new or existing patient                    │
│    ├─ IF existed: return 200 with patient info         │
│    └─ IF new: continue processing                      │
│                                                          │
│ 9. Generate LLM report                                  │
│    └─ generateLLMReport(ocrText)                       │
│       ├─ Search for severity keywords                  │
│       ├─ Count keyword occurrences                     │
│       ├─ Calculate severity score                      │
│       └─ Return {report: string, score: 0-1}           │
│                                                          │
│ 10. Create report in database                          │
│     └─ reportService.createReportForPatient(opts)      │
│        ├─ Create Report document                       │
│        │  ├─ patient: patientId                        │
│        │  ├─ uploadedBy: userId                        │
│        │  ├─ originalReportUrl: filePath               │
│        │  ├─ ocrText: extracted                        │
│        │  ├─ llmGeneratedReport: analysis              │
│        │  ├─ normalizedScore: 0-1                      │
│        │  ├─ status: 'In Progress'                     │
│        │  └─ timestamps: auto                          │
│        │                                                │
│        ├─ Update Patient document                      │
│        │  └─ $push report._id to reports array         │
│        │                                                │
│        └─ Return created Report                        │
│                                                          │
│ 11. Send response                                       │
│     └─ res.status(201).json({                           │
│        message: 'success',                             │
│        reportId: report._id                            │
│     })                                                  │
└─────────────────────────────────────────────────────────┘

Frontend (PathologistUpload.js)
┌─────────────────────────────────────────────────────────┐
│ 1. Receive response                                     │
│    └─ response.json()                                   │
│                                                          │
│ 2. Update state                                         │
│    ├─ setUploadedReport(response)                       │
│    ├─ setMessage('Report uploaded successfully')        │
│    └─ setUploadProgress(100)                            │
│                                                          │
│ 3. Display to user                                      │
│    ├─ Show success message                             │
│    ├─ Display report ID                                │
│    ├─ Show report details                              │
│    └─ Clear form                                       │
│                                                          │
│ 4. Auto-clear after 5s                                 │
│    └─ setTimeout(() => {                               │
│       ├─ setMessage('')                                │
│       ├─ setUploadedReport(null)                        │
│       └─ reset form                                    │
│    }, 5000)                                             │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 State Management Flow

```
AuthContext
│
├─ User State
│  ├─ user object
│  │  ├─ username: string
│  │  ├─ role: 'pathologist' | 'doctor' | 'admin'
│  │  └─ _id: ObjectId
│  │
│  ├─ token: JWT string
│  │
│  ├─ isAuthenticated: boolean
│  │  └─ Derived from: !!token
│  │
│  └─ loading: boolean
│     └─ Initial state during app load
│
├─ Persistence
│  ├─ Save to localStorage on login
│  ├─ Restore from localStorage on mount
│  └─ Clear on logout
│
└─ Methods
   ├─ login(user, token)
   │  ├─ setUser(user)
   │  ├─ setToken(token)
   │  └─ Save to storage
   │
   ├─ logout()
   │  ├─ setUser(null)
   │  ├─ setToken(null)
   │  └─ Clear storage
   │
   └─ Hook: useAuth()
      └─ Access context from components
```

---

## 🔐 Security Layers

```
Frontend Security
├─ Input Validation
│  ├─ File type check
│  ├─ File size limit
│  └─ Form validation
│
├─ Auth Token Management
│  ├─ Store in localStorage
│  ├─ Include in requests
│  └─ Clear on logout
│
└─ Protected Routes
   ├─ ProtectedRoute component
   ├─ Check isAuthenticated
   ├─ Check user role
   └─ Redirect if unauthorized

Backend Security
├─ JWT Authentication
│  ├─ Verify token signature
│  ├─ Check token expiration
│  └─ Extract user info
│
├─ Authorization Middleware
│  ├─ Check user role
│  ├─ Enforce role-specific access
│  └─ Return 403 if unauthorized
│
├─ Input Validation
│  ├─ File type validation
│  ├─ File size limits
│  └─ Data sanitization
│
└─ Password Security
   ├─ Hash with bcryptjs
   ├─ Salt rounds: 10
   └─ Never expose password

Database Security
├─ MongoDB indexes
├─ Unique constraints
├─ Reference validation
└─ Timestamps on changes
```

---

## 📈 Performance Optimization

```
Frontend
├─ Code Splitting
│  ├─ React Router lazy loading
│  └─ Component bundling
│
├─ Caching
│  ├─ Auth token caching
│  └─ localStorage persistence
│
└─ Asset Optimization
   ├─ CSS files per component
   ├─ Minified production build
   └─ Gzip compression

Backend
├─ Database Indexes
│  ├─ patient: 1 (quick lookup)
│  ├─ normalizedScore: -1 (sorting)
│  └─ status: 1 (filtering)
│
├─ File Management
│  ├─ Local filesystem storage
│  └─ Timestamp-based naming
│
└─ API Optimization
   ├─ CORS enabled
   ├─ Multer middleware
   └─ Error handling
```

---

This visual guide helps understand the complete flow and relationships between all components in the system.
