# Cancer Risk Stratification - Frontend

React-based frontend for the Cancer Risk Stratification System. Allows pathologists to upload reports and doctors to review analyzed results.

## Features

- **User Authentication**: JWT-based login/register for pathologists and doctors
- **Report Upload**: Pathologists can upload pathology reports (JPG, PNG, PDF)
- **Real-time Progress**: Visual upload progress tracking
- **Responsive UI**: Modern, mobile-friendly design
- **Role-based Access**: Different interfaces for pathologists and doctors

## Prerequisites

- Node.js (v14+)
- npm or yarn
- Backend API running on `http://localhost:5001`

## Installation

```bash
cd frontend_app
npm install
```

## Environment Setup

Create a `.env` file in the frontend_app directory:

```env
REACT_APP_API_URL=http://localhost:5001/api
```

## Running the Application

Development mode:

```bash
npm start
```

The app will open at `http://localhost:3000`

Build for production:

```bash
npm run build
```

## Project Structure

```
src/
├── components/         # Reusable components (Navbar, ProtectedRoute)
├── pages/             # Page components (Home, Login, Register, Upload)
├── services/          # API services (authService, reportService, apiClient)
├── context/           # React Context (AuthContext for auth state)
├── App.js            # Main app component with routing
└── index.js          # React entry point
```

## Usage

### For Pathologists

1. Register or login as a pathologist
2. Navigate to "Upload Report"
3. Select a pathology report file (JPG, PNG, PDF)
4. Click "Upload Report"
5. Report will be processed with OCR and LLM analysis
6. Receive confirmation and report ID

### For Doctors

1. Register or login as a doctor
2. View reports in the dashboard
3. Review OCR-extracted text and LLM analysis
4. Add comments and verification score
5. Submit verification

## Key Components

### AuthContext
Manages user authentication state and JWT token persistence

### reportService
Handles report uploads and API calls to backend

### PathologistUpload
Main upload component with drag-and-drop file selection

### ProtectedRoute
Guards routes that require authentication and specific roles

## Styling

Uses CSS modules for component-specific styling with a purple gradient theme:
- Primary gradient: `#667eea` to `#764ba2`
- Clean, modern design with smooth transitions

## API Integration

Communicates with backend API:
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/pathologist/upload` - Upload report
- `POST /api/pathologist/upload/confirm` - Confirm upload for existing patient
- `GET /api/doctor/reports` - Get all reports
- `POST /api/doctor/reports/:id/verify` - Verify report

## Error Handling

- File validation (size, type)
- Network error handling with user-friendly messages
- 401 responses trigger automatic logout and redirect to login
- Form validation before submission

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
