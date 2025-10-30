

# 🩺 Medical Report Demo

This project demonstrates a **full-stack medical report analysis system** powered by **React**, **Node.js (Express)**, and a **Python LLM service** (e.g., BioBERT via FastAPI).

---

## 📁 Project Structure

A single main project folder (e.g., `medical-report-demo`) contains three separate services — keeping everything organized and modular.

```
medical-report-demo/
├── frontend/                  <-- (Part 1: React App)
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── App.css
│   │   └── App.js             <-- (Your React UI code)
│   └── package.json
│
├── backend/                   <-- (Part 2: Node.js / Express API)
│   ├── node_modules/
│   ├── server.js              <-- (Your Node API code)
│   └── package.json
│
└── llm_service/               <-- (Part 3: Python / FastAPI Service)
    ├── llm_service.py         <-- (Your Python BioBERT API code)
    └── __pycache__/           <-- (Auto-generated)
```

---

## 🚀 Running Instructions (Step-by-Step)

You will need **three separate terminal windows** open at the same time — one for each service.

---

### 🧠 Terminal 1: Run the Python LLM Service

This runs your **BioBERT / FastAPI** service on `http://localhost:8000`.

#### 1. Navigate to the folder:

```bash
cd medical-report-demo/llm_service
```

#### 2. Create a virtual environment (recommended):

**macOS / Linux**

```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows**

```bash
python -m venv venv
.\venv\Scripts\activate
```

#### 3. Install dependencies:

```bash
pip install fastapi uvicorn "transformers>=4.12.0" torch --extra-index-url https://download.pytorch.org/whl/cpu
```

#### 4. Run the service:

```bash
python llm_service.py
```

> 💡 The first run may take a few minutes as the BioBERT model downloads.

---

### ⚙️ Terminal 2: Run the Node.js Backend

This runs your **main Express API** on `http://localhost:5000`.

#### 1. Navigate to the folder:

```bash
cd medical-report-demo/backend
```

#### 2. Install dependencies:

```bash
npm install express axios cors
```

#### 3. Run the backend server:

```bash
node server.js
```

> ✅ You should see a message like:
> `Node.js backend server running on port 5000...`

---

### 💻 Terminal 3: Run the React Frontend

This runs your **web interface** on `http://localhost:3000`.

#### 1. Navigate to the folder:

```bash
cd medical-report-demo/frontend
```

#### 2. Install dependencies (first time only):

```bash
npm install
```

#### 3. Start the React app:

```bash
npm start
```

> 🌐 This should automatically open [http://localhost:3000](http://localhost:3000) in your browser.

---

