# 🚀 Quick Start Guide

This guide will help you get the Cancer Risk Stratification System up and running in 5 minutes.

## ✅ Prerequisites Check

```bash
# Check Node.js version (need v14+)
node --version

# Check npm version
npm --version

# Check if MongoDB is installed
mongod --version
```

## 📦 Step 1: Setup MongoDB

### Option A: Local MongoDB

```bash
# Start MongoDB server (run in a separate terminal)
mongod
```

### Option B: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/...`

## 🔧 Step 2: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=5001
MONGO_URI=mongodb://localhost:27017/cancer-risk-db
JWT_SECRET=your_super_secret_jwt_key_12345
NODE_ENV=development
OCR_SPACE_API_KEY=K87899142591
EOF

# Start backend
npm run dev
```

✅ Backend ready at `http://localhost:5001`

## 🎨 Step 3: Setup Frontend

```bash
cd frontend_app

# Install dependencies
npm install

# Start frontend
npm start
```

✅ Frontend opens at `http://localhost:3000`

## 👤 Step 4: Create Test Accounts

### Register as Pathologist

1. Click "Register" on homepage
2. Username: `pathologist1`
3. Password: `password123`
4. Role: Select "Pathologist"
5. Click "Register"

### Register as Doctor

1. Click "Register" on homepage
2. Username: `doctor1`
3. Password: `password123`
4. Role: Select "Doctor"
5. Click "Register"

## 📋 Step 5: Test Upload

1. **Login as Pathologist** (pathologist1/password123)
2. **Click "Upload Report"**
3. **Select a test file** (JPG, PNG, or PDF)
4. **Click "Upload Report"**
5. Wait for processing (1-2 minutes)
6. See success message with Report ID

## 📊 Step 6: View as Doctor

1. **Login as Doctor** (doctor1/password123)
2. **Click "View Reports"**
3. See uploaded report with LLM analysis

## 🧪 Test with Sample Data

### Using cURL

```bash
# Get auth token
TOKEN=$(curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"pathologist1","password":"password123"}' \
  | jq -r '.token')

# Upload test report
curl -X POST http://localhost:5001/api/pathologist/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "report=@/path/to/test.pdf"

# Get all reports
curl -X GET http://localhost:5001/api/doctor/reports \
  -H "Authorization: Bearer $TOKEN"
```

## 📁 Project Files Created

### Backend Service
- `src/services/reportService.js` - Core report storage service
  - `ensurePatient()` - Ensures patient exists
  - `createReportForPatient()` - Creates and links report

### Frontend Components
- `src/pages/PathologistUpload.js` - Report upload interface
- `src/pages/Login.js` - Authentication
- `src/pages/Register.js` - Account creation
- `src/pages/Home.js` - Landing page
- `src/services/reportService.js` - API client for reports
- `src/context/AuthContext.js` - Authentication state

## 🔍 Verify Everything Works

```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Backend
cd backend && npm run dev

# Terminal 3: Start Frontend
cd frontend_app && npm start

# Terminal 4: Check backend is running
curl http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
# Should return: {"message":"Invalid token."}
```

## 🆘 Troubleshooting

### Port Already in Use

```bash
# Backend on 5001
lsof -i :5001
kill -9 <PID>

# Frontend on 3000
lsof -i :3000
kill -9 <PID>
```

### MongoDB Won't Connect

```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB
mongod --dbpath /data/db

# Or use cloud: Update MONGO_URI in .env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
```

### OCR Not Working

1. Get free API key: https://ocr.space/ocrapi
2. Add to `.env`: `OCR_SPACE_API_KEY=YOUR_KEY`
3. Restart backend

### CORS Errors

- Frontend MUST be on http://localhost:3000
- Backend MUST be on http://localhost:5001
- Both are configured correctly by default

## 📚 Next Steps

1. Read [Backend README](./backend/README.md) for advanced setup
2. Read [Frontend README](./frontend_app/README.md) for frontend customization
3. Explore API endpoints in backend README
4. Test doctor verification flow
5. Try uploading different file types

## 🎯 Common Tasks

### Add Admin User

```bash
curl -X POST http://localhost:5001/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{"username":"admin1","password":"admin123","role":"admin"}'
```

### View Database

```bash
# Connect to MongoDB
mongo

# Use the database
use cancer-risk-db

# View collections
show collections

# View users
db.users.find()

# View patients
db.patients.find()

# View reports
db.reports.find()
```

### Reset Database

```bash
# In MongoDB shell
use cancer-risk-db
db.dropDatabase()
```

## 📞 Getting Help

1. Check terminal output for error messages
2. Review READMEs in backend/ and frontend_app/
3. Check Network tab in browser DevTools
4. Verify .env files are correct
5. Restart MongoDB, backend, and frontend

## ✨ What's Included

✅ **Backend Service** (`reportService.js`)
- Ensures patients exist before creating reports
- Creates reports linked to patients
- Maintains referential integrity

✅ **Frontend Components**
- Pathologist upload interface
- Authentication flow
- Report upload progress tracking
- Beautiful UI with gradients

✅ **Documentation**
- Comprehensive README files
- API endpoint documentation
- Database schema documentation
- Deployment guides

✅ **Security**
- JWT authentication
- Password hashing
- Role-based access control
- Input validation

## 🎉 You're All Set!

The Cancer Risk Stratification System is ready to use. Start with:

1. Login as pathologist
2. Upload a test report
3. Check database for created records
4. Login as doctor to verify

For production deployment, see [Backend README - Deployment](./backend/README.md#deployment)
