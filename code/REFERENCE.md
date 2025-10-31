# 📚 Complete Reference Guide

Quick reference for all the components, services, and workflows in the Cancer Risk Stratification System.

## 📋 File Locations

### Backend
```
backend/
├── src/
│   ├── services/
│   │   ├── reportService.js         ← NEW: Report persistence
│   │   ├── ocrService.js
│   │   ├── llmService.js
│   │   └── storageService.js
│   ├── controller/
│   │   └── pathologistController.js ← MODIFIED: Uses reportService
│   ├── models/
│   │   ├── users.js
│   │   ├── patients.js
│   │   ├── reports.js
│   │   └── verifiedreports.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── pathologistRoutes.js
│   │   ├── doctorRoutes.js
│   │   └── adminRoutes.js
│   ├── middleware/
│   │   └── auth.js
│   └── config/
│       └── db.js
├── uploads/                         ← Directory created at runtime
├── package.json
├── .env
├── README.md
└── SERVICES_ARCHITECTURE.md
```

### Frontend
```
frontend_app/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navbar.js                ← NEW
│   │   ├── Navbar.css               ← NEW
│   │   └── ProtectedRoute.js         ← NEW
│   ├── pages/
│   │   ├── Home.js                  ← NEW
│   │   ├── Home.css                 ← NEW
│   │   ├── Login.js                 ← NEW
│   │   ├── Register.js              ← NEW
│   │   ├── Auth.css                 ← NEW
│   │   ├── PathologistUpload.js      ← NEW (Main feature)
│   │   └── PathologistUpload.css     ← NEW
│   ├── services/
│   │   ├── apiClient.js             ← NEW
│   │   ├── authService.js           ← NEW
│   │   └── reportService.js         ← NEW
│   ├── context/
│   │   └── AuthContext.js           ← NEW
│   ├── App.js                       ← NEW
│   ├── App.css                      ← NEW
│   ├── index.js                     ← NEW
│   └── index.css                    ← NEW
├── .gitignore                       ← NEW
├── package.json                     ← MODIFIED
└── README.md                        ← NEW
```

### Documentation
```
code/
├── Readme.md                        ← MODIFIED: Full project overview
├── QUICKSTART.md                    ← NEW: 5-minute setup guide
└── IMPLEMENTATION_SUMMARY.md        ← NEW: What was built

backend/
├── README.md                        ← NEW: Backend documentation
└── SERVICES_ARCHITECTURE.md         ← NEW: Service design patterns
```

---

## 🔧 Core Services

### reportService.js Functions

```javascript
// Function 1: Ensure patient exists
const { patient, existed } = await ensurePatient({
  patientId: string,      // Required
  name?: string,
  dateOfBirth?: Date,
  gender?: string
});
// Returns: { patient: Document, existed: boolean }

// Function 2: Create report for patient
const report = await createReportForPatient({
  patient: ObjectId | Document,
  uploadedBy: ObjectId | Document,
  originalReportUrl: string,
  ocrText?: string,
  llmGeneratedReport?: string,
  normalizedScore?: number,
  status?: string
});
// Returns: Report document
```

### Usage in Controller

```javascript
// In pathologistController.js uploadReport()
const { ensurePatient, createReportForPatient } = require('../services/reportService');

const { patient, existed } = await ensurePatient(patientDetails);

if (existed) {
  return res.status(200).json({
    message: 'Patient already exists.',
    patientId: patient.patientId
  });
}

const report = await createReportForPatient({
  patient,
  uploadedBy: req.user._id,
  originalReportUrl: reportUrl,
  ocrText: ocrResult,
  llmGeneratedReport: llmResult.report,
  normalizedScore: llmResult.score,
  status: 'In Progress'
});
```

---

## 🎨 Frontend Components

### Component Hierarchy

```
App
├── Navbar
│   ├── Brand/Logo
│   ├── Nav Links (conditional)
│   └── User Info
├── Main Content (Routes)
│   ├── Home (public)
│   ├── Login (public)
│   ├── Register (public)
│   └── PathologistUpload (protected, pathologist only)
└── AuthProvider (Context)
```

### Component Features

#### Navbar
- Displays user info
- Role-specific links
- Logout button
- Responsive menu

#### ProtectedRoute
- Checks authentication
- Enforces role
- Redirects if unauthorized
- Shows loading state

#### PathologistUpload (Main Feature)
- File drag-and-drop
- Progress tracking
- File validation
- Error display
- Success confirmation

#### AuthContext
- User state management
- Token persistence
- Login/logout methods
- Auto-restore on reload

---

## 🌐 API Endpoints

### Authentication
```
POST /api/auth/login
  Body: { username, password }
  Returns: { token, user }

POST /api/auth/register
  Body: { username, password, role }
  Returns: { token, user }
```

### Report Upload (Pathologist)
```
POST /api/pathologist/upload
  Auth: Bearer token (pathologist required)
  Body: FormData { report: file }
  Returns: { message, reportId }

POST /api/pathologist/upload/confirm
  Auth: Bearer token
  Body: { patientId, reportData }
  Returns: { message, reportId }
```

### Report Management (Doctor)
```
GET /api/doctor/reports
  Auth: Bearer token
  Returns: [{ patientName, score, llmReport, status, reportId }]

GET /api/doctor/reports/:reportId
  Auth: Bearer token
  Returns: Report full details

POST /api/doctor/reports/:reportId/verify
  Auth: Bearer token
  Body: { doctorComments, doctorScore }
  Returns: { message }
```

### User Management (Admin)
```
POST /api/admin/users
  Body: { username, password, role }

GET /api/admin/users
  Returns: [users]

PUT /api/admin/users/:userId
  Body: { username, password, role }

DELETE /api/admin/users/:userId
```

---

## 🗄️ Database Collections

### Users
```javascript
{
  _id: ObjectId,
  username: string (unique),
  password: string (hashed),
  role: 'admin' | 'pathologist' | 'doctor',
  createdAt: Date,
  updatedAt: Date
}
```

### Patients
```javascript
{
  _id: ObjectId,
  patientId: string (unique),
  name: string,
  dateOfBirth: Date,
  gender: string,
  reports: [ObjectId],  // References to Report docs
  createdAt: Date,
  updatedAt: Date
}
```

### Reports
```javascript
{
  _id: ObjectId,
  patient: ObjectId,    // Reference to Patient
  uploadedBy: ObjectId, // Reference to User
  uploadDate: Date,
  originalReportUrl: string,
  ocrText: string,
  llmGeneratedReport: string,
  normalizedScore: number (0-1),
  doctorVerification: {
    isVerified: boolean,
    verifiedBy: ObjectId,
    doctorComments: string,
    doctorScore: number,
    verificationDate: Date
  },
  status: 'In Progress' | 'Completed',
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🚀 Workflows

### Workflow 1: Pathologist Uploads Report

```
1. Pathologist logs in
   - Username/password → JWT token
   
2. Navigate to upload
   - Click "Upload Report" in navbar
   
3. Select file
   - Drag-drop or click to browse
   - Frontend validates: type (JPG/PNG/PDF), size (<10MB)
   
4. Submit upload
   - FormData with JWT token sent to backend
   - Frontend shows progress bar
   
5. Backend processing
   - Save file to ./uploads/
   - Extract text with OCR.space API
   - Parse patient details from OCR
   - Ensure patient exists: reportService.ensurePatient()
   - Generate severity score with LLM
   - Create report: reportService.createReportForPatient()
   - Update patient.reports array
   
6. Return to frontend
   - Success message with reportId
   - Frontend displays confirmation
   
7. Confirmation
   - User sees report stored and processing started
```

### Workflow 2: Doctor Reviews Report

```
1. Doctor logs in
   - Username/password → JWT token
   
2. View reports dashboard
   - GET /api/doctor/reports
   - List all pending reports sorted by severity
   
3. Select report to review
   - Click on report → detail view
   - GET /api/doctor/reports/:reportId
   
4. Review details
   - View OCR extracted text
   - View LLM generated report
   - See normalized severity score
   - Read extracted findings
   
5. Add verification
   - Enter professional comments
   - Set verification score
   - Click "Verify"
   
6. Submit verification
   - POST /api/doctor/reports/:reportId/verify
   - Report status → 'Completed'
   - doctorVerification fields updated
   
7. Confirmation
   - Report marked as verified
   - Can be viewed in completed reports
```

---

## 🔐 Authentication Flow

### Login/Register

```
Frontend Form
  ↓
Validate inputs
  ↓
POST /api/auth/login or /api/auth/register
  ↓
Backend validates
  ↓
Hash password (bcryptjs)
  ↓
Create/find user
  ↓
Generate JWT token
  ↓
Return token + user info
  ↓
Frontend stores in localStorage
  ↓
AuthContext.login() called
  ↓
User state updated
  ↓
Redirect based on role
```

### API Request with Auth

```
Frontend creates request
  ↓
Add header: Authorization: Bearer <token>
  ↓
Send to backend
  ↓
Backend middleware checks token
  ↓
Verify JWT signature
  ↓
Extract user info
  ↓
Attach to req.user
  ↓
Proceed to handler
```

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │
       ├─→ Login/Register
       │    ↓
       │    GET/POST /api/auth/*
       │    ↓
       │    JWT Token in localStorage
       │
       └─→ Upload Report
            ↓
            POST /api/pathologist/upload
            FormData + Bearer token
            ↓
┌──────────────────────────────────────┐
│        Backend (Node.js)              │
│  pathologistController.uploadReport() │
├──────────────────────────────────────┤
│  1. storageService.uploadToStorage()  │
│     → Save file                       │
│                                      │
│  2. ocrService.performOCR()          │
│     → Call OCR.space API             │
│     → Return text                    │
│                                      │
│  3. Extract patient from OCR         │
│                                      │
│  4. reportService.ensurePatient()    │
│     → Find or create patient         │
│                                      │
│  5. llmService.generateLLMReport()   │
│     → Analyze severity               │
│     → Generate score                 │
│                                      │
│  6. reportService.createReportForPatient()
│     → Create report doc              │
│     → Update patient.reports         │
│                                      │
│  7. Return reportId                  │
└──────────────────────────────────────┘
       ↓
┌──────────────────────────┐
│  MongoDB                 │
│  ├─ Patient doc          │
│  ├─ Report doc           │
│  └─ report reference     │
└──────────────────────────┘
```

---

## 🧪 Testing Checklist

### Manual Testing

- [ ] Can register as pathologist
- [ ] Can register as doctor
- [ ] Can login with correct credentials
- [ ] Cannot login with wrong password
- [ ] Cannot access pathologist page as doctor
- [ ] Cannot access upload without authentication
- [ ] Can upload JPG file
- [ ] Can upload PNG file
- [ ] Can upload PDF file
- [ ] Cannot upload oversized file (>10MB)
- [ ] Cannot upload unsupported format
- [ ] See progress bar during upload
- [ ] See success message with reportId
- [ ] Report appears in database
- [ ] Patient created in database
- [ ] Can view reports as doctor
- [ ] Can add verification

### cURL Testing

```bash
# Test register
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test1","password":"pass123","role":"pathologist"}'

# Test login
TOKEN=$(curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test1","password":"pass123"}' | jq -r '.token')

# Test upload
curl -X POST http://localhost:5001/api/pathologist/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "report=@/path/to/file.pdf"

# Get reports
curl -X GET http://localhost:5001/api/doctor/reports \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🐛 Troubleshooting Quick Answers

| Problem | Solution |
|---------|----------|
| "Cannot find module" | Run `npm install` in that directory |
| "MongoDB connection failed" | Start `mongod` in another terminal |
| "Port already in use" | Change PORT in .env or kill process |
| "CORS error" | Ensure backend on :5001, frontend on :3000 |
| "OCR fails" | Get API key from ocr.space and add to .env |
| "File upload fails" | Check file size (<10MB) and type |
| "401 Unauthorized" | Login again, token may have expired |
| "Patient not found" | Patient creation happens with first report |

---

## 📱 Role Permissions

| Action | Pathologist | Doctor | Admin |
|--------|:-----------:|:------:|:-----:|
| Register | ✅ | ✅ | ✅ |
| Login | ✅ | ✅ | ✅ |
| Upload Report | ✅ | ❌ | ❌ |
| View Reports | ❌ | ✅ | ✅ |
| Verify Report | ❌ | ✅ | ❌ |
| Manage Users | ❌ | ❌ | ✅ |
| Access Admin | ❌ | ❌ | ✅ |

---

## 🎯 Key Implementation Details

### Service Layer Benefits
- Eliminates code duplication
- Ensures consistent operations
- Easier testing
- Maintainable codebase
- Single responsibility principle

### Frontend State Management
- Context API for auth state
- localStorage for persistence
- Automatic logout on 401
- Role-based routing

### Error Handling
- Try-catch in async handlers
- User-friendly error messages
- HTTP status codes
- Validation before operations
- Graceful degradation

### Security
- JWT with Bearer scheme
- Password hashing (bcryptjs)
- Role-based middleware
- File validation
- Protected routes

---

## 📞 Support Resources

1. **QUICKSTART.md** - Setup in 5 minutes
2. **backend/README.md** - Backend details
3. **frontend_app/README.md** - Frontend details
4. **backend/SERVICES_ARCHITECTURE.md** - Service patterns
5. **code/Readme.md** - Full overview

---

**This reference guide covers all the components, workflows, and configurations of the Cancer Risk Stratification System.**
