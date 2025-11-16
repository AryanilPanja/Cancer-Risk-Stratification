# Cancer Risk Stratification - Backend

Node.js/Express backend for the Cancer Risk Stratification System. Handles pathology report uploads, OCR processing, LLM analysis, and database management.

## Architecture Overview

The system follows a layered architecture:

```
Routes (API endpoints)
    ↓
Controllers (Request handling)
    ↓
Services (Business logic)
    ↓
Models (MongoDB schemas)
    ↓
Database (MongoDB)
```

## Key Components

### Models

- **User**: Authentication and role management (admin, pathologist, doctor)
- **Patient**: Patient information linked to reports
- **Report**: Pathology reports with OCR text, LLM analysis, and doctor verification
- **VerifiedReport**: Final verified reports for export

### Services

- **reportService**: Ensures patient exists and creates/attaches reports
- **ocrService**: OCR text extraction using OCR.space API
- **llmService**: Local LLM implementation for severity scoring
- **storageService**: File storage in local filesystem

### Controllers

- **authController**: User registration and login
- **pathologistController**: Report upload and management
- **doctorController**: Report review and verification
- **adminController**: User management

## Prerequisites

- Node.js (v14+)
- MongoDB (v4.4+)
- npm or yarn

## Installation

```bash
cd backend
npm install
```

## Environment Setup

Create a `.env` file in the backend directory:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/cancer-risk-db
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
OCR_SPACE_API_KEY=your_ocr_space_api_key_here
```

### Getting OCR.space API Key

1. Visit https://ocr.space/ocrapi
2. Sign up for a free API key
3. Add it to your `.env` file

## Running the Application

Development mode (with auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

Server will run on `http://localhost:5001`

## API Endpoints

### Authentication

```
POST /api/auth/login
  Body: { username, password }
  Returns: { token, user }

POST /api/auth/register
  Body: { username, password, role }
  Returns: { token, user }
```

### Pathologist Routes

```
POST /api/pathologist/upload
  Auth: Required (Bearer token)
  Body: FormData with 'report' file
  Returns: { message, reportId }

POST /api/pathologist/upload/confirm
  Auth: Required
  Body: { patientId, reportData }
  Returns: { message, reportId }
```

### Doctor Routes

```
GET /api/doctor/reports
  Auth: Required
  Returns: [{ patientName, score, llmReport, status, isReviewed, reportId }]

GET /api/doctor/reports/:reportId
  Auth: Required
  Returns: Report details with patient info

POST /api/doctor/reports/:reportId/verify
  Auth: Required
  Body: { doctorComments, doctorScore }
  Returns: { message }
```

### Admin Routes

```
POST /api/admin/users
  Body: { username, password, role }
  Returns: User object

GET /api/admin/users
  Returns: [User]

PUT /api/admin/users/:userId
  Body: { username, password, role }
  Returns: Updated user

DELETE /api/admin/users/:userId
  Returns: { message }
```

## Workflow

### Report Upload Flow

1. **File Upload**: Pathologist uploads report via POST /api/pathologist/upload
2. **Storage**: File saved to `./uploads/` directory
3. **OCR Processing**: Text extracted from image using OCR.space API
4. **Patient Extraction**: Patient details extracted from OCR text
5. **Patient Ensure**: System ensures patient exists in database
6. **LLM Analysis**: Local LLM analyzes text for severity
7. **Report Creation**: Report created and linked to patient
8. **Response**: Frontend receives reportId and success message

### Doctor Review Flow

1. **List Reports**: Doctor views all pending reports
2. **Review Details**: Doctor views OCR text, LLM report, score
3. **Verification**: Doctor adds comments and score
4. **Status Update**: Report marked as "Completed"

## Database Schema

### User
```javascript
{
  username: String (unique),
  password: String (hashed),
  role: String (enum: ['admin', 'pathologist', 'doctor']),
  createdAt: Date,
  updatedAt: Date
}
```

### Patient
```javascript
{
  patientId: String (unique),
  name: String,
  dateOfBirth: Date,
  gender: String,
  reports: [ObjectId], // References to Report
  createdAt: Date,
  updatedAt: Date
}
```

### Report
```javascript
{
  patient: ObjectId (ref: Patient),
  uploadedBy: ObjectId (ref: User),
  uploadDate: Date,
  originalReportUrl: String,
  ocrText: String,
  llmGeneratedReport: String,
  normalizedScore: Number (0-1),
  doctorVerification: {
    isVerified: Boolean,
    verifiedBy: ObjectId,
    doctorComments: String,
    doctorScore: Number,
    verificationDate: Date
  },
  status: String (enum: ['In Progress', 'Completed']),
  createdAt: Date,
  updatedAt: Date
}
```

## File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controller/
│   │   ├── authController.js
│   │   ├── pathologistController.js
│   │   ├── doctorController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   └── auth.js            # JWT authentication
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
│   ├── services/
│   │   ├── reportService.js   # Report persistence logic
│   │   ├── ocrService.js      # OCR extraction
│   │   ├── llmService.js      # Severity analysis
│   │   └── storageService.js  # File storage
│   └── server.js              # Express app entry
├── uploads/                   # Uploaded files (created at runtime)
├── .env                       # Environment variables
├── package.json
└── README.md
```

## Key Features

### Report Storage Service (`reportService.js`)

Centralized service for report persistence:

- **ensurePatient()**: Creates patient if not exists, returns patient document
- **createReportForPatient()**: Creates report, links to patient, maintains references

Benefits:
- Eliminates code duplication
- Ensures consistent database operations
- Easy to extend with additional logic
- Maintains data integrity

### OCR Processing

Uses OCR.space API for reliable text extraction:
- Supports images (JPG, PNG) and PDFs
- Language detection (English)
- 120-second timeout for large files

### LLM Analysis

Local implementation with keyword-based scoring:
- Detects severity keywords (metastasis, malignant, invasive, etc.)
- Normalizes score to 0-1 range
- Extracts relevant sentences for summary

### Authentication

JWT-based security:
- Token stored in Authorization header (Bearer token)
- 24-hour expiration (configurable)
- Role-based access control

## Testing

### Manual Testing with cURL

```bash
# Register
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"pathologist1","password":"pass123","role":"pathologist"}'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"pathologist1","password":"pass123"}'

# Upload report
curl -X POST http://localhost:5001/api/pathologist/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "report=@/path/to/report.pdf"

# Get reports (as doctor)
curl -X GET http://localhost:5001/api/doctor/reports \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Testing with Frontend

1. Start MongoDB: `mongod`
2. Start backend: `npm run dev`
3. Start frontend: `cd ../frontend_app && npm start`
4. Register as pathologist, upload report
5. Register as doctor, view and verify reports

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check MONGO_URI in .env
- Verify connection string format

### OCR Processing Fails
- Verify OCR_SPACE_API_KEY is set
- Check file format (JPG, PNG, PDF)
- File size under 10MB

### JWT Errors
- Clear browser localStorage
- Log in again to get new token
- Verify JWT_SECRET matches frontend expectations

### CORS Issues
- Frontend must be on different port (3000) than backend (5001)
- CORS enabled in server.js

## Performance Optimization

### Indexes
Reports collection has indexes on:
- `patient`: For quick patient lookups
- `normalizedScore`: For sorted queries
- `status`: For filtering

### File Storage
- Files stored locally for quick access
- Consider cloud storage (S3, GCS) for production
- Implement cleanup for old uploads

## Security Considerations

### Production Deployment

1. **Environment Variables**: Use secure .env management
2. **HTTPS**: Enable SSL/TLS certificates
3. **Rate Limiting**: Add rate limiting middleware
4. **Input Validation**: Validate all inputs
5. **Password Hashing**: Uses bcryptjs (configured with salt rounds)
6. **Token Expiration**: Set reasonable expiration times
7. **Database**: Use MongoDB Atlas with proper authentication

### Recommendations

```javascript
// Add rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);
```

## Deployment

### Local Deployment
```bash
npm install
npm run dev
```

### Docker Deployment
Create `Dockerfile`:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t cancer-risk-backend .
docker run -p 5001:5001 --env-file .env cancer-risk-backend
```

### Production with PM2
```bash
npm install -g pm2
pm2 start src/server.js --name "cancer-risk-api"
pm2 save
pm2 startup
```

## Future Enhancements

- [ ] Implement advanced LLM (GPT-4, Claude)
- [ ] Add WebSocket for real-time notifications
- [ ] Cloud storage integration (S3, GCS)
- [ ] Database backup and recovery
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] Report export (PDF, CSV)
- [ ] Version control for reports
- [ ] Audit logging

## License

ISC

## Support

For issues and questions, please create a GitHub issue or contact the development team.
