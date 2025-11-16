# Cancer Risk Stratification System

This document provides a comprehensive overview of the Cancer Risk Stratification System, detailing its architecture, code structure, and the flow of data through its various components.

## 1. Architecture Overview

The system is designed using a **microservices architecture** to ensure scalability, maintainability, and separation of concerns. It consists of a frontend single-page application (SPA), a primary backend server, and several specialized Python microservices for intensive tasks like Optical Character Recognition (OCR) and Natural Language Processing (NLP).

The main components are:

-   **Frontend Application**: A React-based SPA that provides the user interface for all stakeholders (Pathologists, Doctors, Admins).
-   **Node.js Backend**: An Express.js server that acts as the central API gateway. It handles user authentication, data persistence, and orchestrates communication with the Python microservices.
-   **Python Microservices**:
    -   **OCR Service**: A FastAPI service that extracts text from uploaded PDF reports using PyMuPDF.
    -   **Retriever Service**: A FastAPI service that takes raw text, splits it into chunks, generates embeddings using `Sentence-Transformers`, stores them in a `PGVector` database, and retrieves relevant context for analysis.
    -   **LLM Service**: A FastAPI service that uses a pre-trained BioBERT model to perform question-answering on the retrieved context to assess cancer risk.
-   **Databases**:
    -   **MongoDB**: The primary database for storing user data, patient information, and report metadata.
    -   **PostgreSQL with PGVector**: A specialized database for storing and querying high-dimensional vector embeddings of the report text.

All services are containerized using Docker and managed with `docker-compose` for streamlined development and deployment.

## 2. Technology Stack

-   **Frontend**:
    -   React.js
    -   React Router for navigation
    -   Axios for API communication
    -   CSS for styling
-   **Backend (Node.js)**:
    -   Express.js for the API server
    -   Mongoose for MongoDB object modeling
    -   JWT (JSON Web Tokens) for authentication
    -   Multer for handling file uploads
-   **Backend (Python Services)**:
    -   FastAPI for creating high-performance APIs
    -   Sentence-Transformers for generating text embeddings
    -   Transformers (Hugging Face) for loading the BioBERT model
    -   PyMuPDF (fitz) for PDF text extraction
    -   Psycopg2 for connecting to PostgreSQL
-   **Databases**:
    -   MongoDB
    -   PostgreSQL with the `pgvector` extension
-   **Containerization**:
    -   Docker
    -   Docker Compose

## 3. Code Structure

The project is organized into two main directories: `backend` and `frontend_app`.

### 3.1. `backend/`

This directory contains the Node.js server and all related backend logic.

-   `src/`
    -   `config/db.js`: Handles the connection to the MongoDB database.
    -   `controllers/`: Contains the core business logic for handling API requests. Each controller corresponds to a user role or a resource (e.g., `authController.js`, `doctorController.js`).
    -   `middleware/auth.js`: Contains Express middleware for authenticating JWT tokens and authorizing users based on their roles (Admin, Doctor, Pathologist).
    -   `models/`: Defines the Mongoose schemas for the MongoDB collections (`users.js`, `patients.js`, `reports.js`).
    -   `routes/`: Defines the API endpoints. Each file maps HTTP routes to specific controller functions (e.g., `authRoutes.js`, `doctorRoutes.js`).
    -   `services/`: Contains both JavaScript helper services and the Python-based microservices.
        -   `reportService.js`: A JS module to handle the creation and linking of patient and report documents in MongoDB.
        -   `llmService.py`: The Python service for the BioBERT language model.
        -   `ocrService.py`: The Python service for PDF text extraction.
        -   `retrieverService.py`: The Python service for embedding generation and retrieval from the vector database.
    -   `uploads/`: Default directory for storing uploaded report files (in a local setup).
    -   `server.js`: The main entry point for the Node.js application. It initializes the Express server, connects to the database, and mounts all the routes.
-   `package.json`: Lists the Node.js dependencies and scripts for running the backend.

### 3.2. `frontend_app/`

This directory contains the React single-page application.

-   `src/`
    -   `api/api.js`: A pre-configured Axios instance for making requests to the backend. It includes an interceptor to automatically attach the JWT token to authorized requests.
    -   `components/`: Contains reusable React components, such as the `Navbar.js` and `ProtectedRoute.js` for handling role-based access.
    -   `context/AuthContext.js`: A React Context provider that manages global authentication state (user data, token), making it accessible throughout the app.
    -   `pages/`: Contains the main view components for each page/route of the application (e.g., `Home.js`, `Login.js`, `PathologistDashboard.js`).
    -   `services/`: Contains modules that abstract away the API calls for different resources.
        -   `authService.js`: Handles login and registration.
        -   `reportService.js`: Handles report-related actions like file uploads.
    -   `App.js`: The root component of the application, where the main routing is set up.
    -   `index.js`: The entry point for the React application, where the `App` component is rendered into the DOM.
-   `package.json`: Lists the frontend dependencies and scripts for starting, building, and testing the React app.

### 3.3. Root `code/` Directory

-   `docker-compose.yml`: The central file for defining and running the multi-container Docker application. It specifies how the `node-backend`, `ocr`, `llm`, `retriever`, `postgres`, and `mongo` services are built and connected.
-   `Dockerfile.backend` & `Dockerfile.python`: Instructions for building the Docker images for the Node.js and Python services, respectively. The Python Dockerfile uses a multi-stage build to optimize image size and build times.
-   `requirements.txt`: Lists the Python dependencies for the microservices.

## 4. System and Data Flow

The primary workflow involves a Pathologist uploading a report and a Doctor reviewing the AI-generated analysis.

### Pathologist: Report Upload Workflow

1.  **Upload File (Frontend)**: The Pathologist selects a PDF report file in the React application (`PathologistDashboard.js`) and clicks "Upload". The `reportService.js` on the frontend sends the file to the backend.

2.  **Receive File (Node.js Backend)**: The `/api/pathologist/upload` endpoint (`pathologistRoutes.js`) receives the file. The `multer` middleware loads the file into memory.

3.  **OCR Extraction (OCR Service)**: The Node.js `pathologistController.js` forwards the file buffer to the Python **OCR Service** (`ocrService.py`). This service uses `PyMuPDF` to extract the raw text from the PDF.

4.  **Embedding and Storage (Retriever Service)**: The OCR service is configured to directly forward the extracted text to the **Retriever Service** (`retrieverService.py`).
    -   The Retriever Service splits the text into manageable chunks.
    -   It uses the `SentenceTransformer` model to convert each chunk into a 384-dimensional vector embedding.
    -   These embeddings, along with their corresponding text chunks, are stored in the `report_chunks` table in the **PostgreSQL (PGVector)** database.

5.  **Context Retrieval (Retriever Service)**: Immediately after storage, the Retriever Service creates a vector embedding of a predefined question (e.g., *"Assess the risk of high-grade cervical lesions"*). It then queries the PGVector database to find the text chunks that are most semantically similar to this question (a cosine similarity search).

6.  **Risk Analysis (LLM Service)**: The top `k` retrieved text chunks are concatenated to form a context. This context, along with the risk question, is sent to the **LLM Service** (`llmService.py`). The BioBERT model performs question-answering on the context and returns an answer and a confidence score.

7.  **Finalize and Store (Node.js Backend)**:
    -   The response from the microservices (LLM-generated report and risk score) flows back to the `pathologistController.js`.
    -   The controller uses `reportService.js` to create a new `Patient` document (if one doesn't already exist) and a `Report` document in **MongoDB**.
    -   The `Report` document stores the LLM-generated report, the normalized risk score, the status, and references to the patient and the original file URL.
    -   The backend sends a confirmation response to the frontend.

### Doctor: Review Workflow

1.  **Fetch Reports (Frontend)**: A logged-in Doctor navigates to the dashboard (`DoctorDashboard.js`). An API call is made to the backend to fetch all reports.

2.  **Retrieve Data (Node.js Backend)**: The `/api/doctor/reports` endpoint (`doctorRoutes.js`) is hit. The `doctorController.js` queries the **MongoDB** database to find all reports, sorted by the `normalizedScore` in descending order.

3.  **Display Reports (Frontend)**: The frontend receives the list of reports and displays them in a table, with color-coded scores and statuses for easy identification of high-risk cases.

4.  **Verify Report (Full Loop)**:
    -   The Doctor can click a "Verify" button on a report.
    -   The frontend prompts for comments and a manually assigned score.
    -   This information is sent to the `/api/doctor/verify/:reportId` endpoint.
    -   The `doctorController.js` updates the corresponding `Report` document in MongoDB, setting `isVerified` to `true` and saving the doctor's comments and score.
    -   The frontend UI updates to reflect that the report has been reviewed.
