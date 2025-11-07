# Docker / Docker Compose instructions

This file explains how to build and run the project using Docker and Docker Compose.

## Prerequisites
- Docker Engine (or Docker Desktop)
- Docker Compose (v2+ included with recent Docker)
- At least 8GB RAM (for ML models)
- At least 10GB free disk space

## Architecture

The application consists of **7 services**:

1. **mongo** - MongoDB database for application data
2. **postgres** - PostgreSQL with pgvector for RAG/embeddings
3. **llm-service** - BioBERT question-answering service (Python/FastAPI) - Port 8000
4. **ocr-service** - PDF OCR extraction service (Python/FastAPI) - Port 8001
5. **retriever-service** - RAG retrieval service (Python/FastAPI) - Port 9000
6. **backend** - Node.js/Express API - Port 5001
7. **frontend** - React app served by nginx - Port 80

## 🚀 Quick Start (Which mode to use?)

### For Production / Testing Full Stack
Use `docker-compose.yml` - Code is **baked into images**

```bash
sudo docker compose up --build -d
```

**Access:** http://localhost

### For Active Development / Live Code Changes
Use `docker-compose.dev.yml` - Code is **mounted with live reload**

```bash
sudo docker compose -f docker-compose.dev.yml up --build -d
```

**Access:** http://localhost:3000

---

## Production Mode (docker-compose.yml)

### ✅ What This Does
- **Optimized builds**: Code is copied into images at build time
- **No live reload**: Changes require `docker compose up --build`
- **Production-ready**: Nginx serves static React build
- **Fast runtime**: No overhead from file watchers

### First Time Build (⚠️ Takes 10-20 minutes due to ML model downloads)

```bash
sudo docker compose up --build -d
```

**What happens during build:**
- Downloads Python packages: transformers, torch, sentence-transformers, PyMuPDF, etc.
- Downloads ML models: BioBERT (~400MB) and all-MiniLM-L6-v2 (~80MB)
- Builds frontend React app
- Sets up PostgreSQL with pgvector extension

### Subsequent Runs (Fast)

```bash
# Start all services
sudo docker compose up -d

# View logs
sudo docker compose logs -f

# View specific service logs
sudo docker compose logs -f llm-service
sudo docker compose logs -f backend

# Stop all services
sudo docker compose down
```

### When You Change Code (Requires Rebuild)

```bash
# Rebuild only changed service
sudo docker compose up --build backend -d

# Or rebuild everything
sudo docker compose up --build -d
```

### Access Points

- **Frontend**: http://localhost
- **Backend API**: http://localhost:5001/api
- **LLM Service**: http://localhost:8000 (BioBERT Q&A)
- **OCR Service**: http://localhost:8001 (PDF extraction)
- **Retriever Service**: http://localhost:9000 (RAG)

---

## Development Mode (docker-compose.dev.yml)

### ✅ What This Does
- **Volume mounts**: Your local code is synced live into containers
- **Auto-reload**: 
  - Python services: `uvicorn --reload` restarts on .py changes
  - Backend: `nodemon` restarts on .js changes
  - Frontend: React hot-reload on file save
- **Faster iteration**: Edit code → save → see changes (no rebuild!)

### Start Development Environment

```bash
# First time (build images)
sudo docker compose -f docker-compose.dev.yml up --build -d

# Subsequent runs (just start)
sudo docker compose -f docker-compose.dev.yml up -d

# Watch logs
sudo docker compose -f docker-compose.dev.yml logs -f

# Stop
sudo docker compose -f docker-compose.dev.yml down
```

### How It Works

**Volume Mounts:**
```yaml
backend:
  volumes:
    - ./backend:/usr/src/app          # Your code → Container
    - /usr/src/app/node_modules       # Preserve container's node_modules
  command: npm run dev                # nodemon with auto-restart

llm-service:
  volumes:
    - ./backend/src/services:/app     # Python code → Container
  command: uvicorn llmService:app --reload  # Auto-restart on changes
```

### Development Workflow

1. **Edit code locally** in your IDE (VSCode, etc.)
2. **Save file**
3. **Service auto-restarts** (nodemon/uvicorn --reload)
4. **Refresh browser** to see changes

**No rebuild needed!** 🎉

### Access Points (Dev Mode)

- **Frontend**: http://localhost:3000 (React dev server with hot reload)
- **Backend API**: http://localhost:5001/api
- **Python services**: Same ports (8000, 8001, 9000)

---

## Comparison Table

| Aspect | Production (`docker-compose.yml`) | Development (`docker-compose.dev.yml`) |
|--------|----------------------------------|----------------------------------------|
| **Code Location** | Copied into image | Mounted from host |
| **Changes Require** | Rebuild (`--build`) | Just save file |
| **Auto-Reload** | ❌ No | ✅ Yes (uvicorn --reload, nodemon) |
| **Frontend** | Nginx (port 80) | React dev server (port 3000) |
| **Performance** | ⚡ Fast | 🐢 Slightly slower (file watching) |
| **Use Case** | Testing full stack, deployment | Active coding |
| **Build Time** | 10-20 min first time | Same (one-time) |
| **Iteration Speed** | Slow (rebuild) | ⚡ Instant |

---

## When to Use Which?

### Use **Production Mode** (`docker-compose.yml`) when:
- ✅ Testing the complete application as users will see it
- ✅ Verifying deployment setup
- ✅ Running demos
- ✅ Not actively editing code

### Use **Development Mode** (`docker-compose.dev.yml`) when:
- ✅ Writing new features
- ✅ Debugging issues
- ✅ Iterating quickly on code changes
- ✅ Want instant feedback without rebuilds

---

## Tips & Best Practices

### 1. **Avoid Rebuilds in Dev Mode**
Once built, dev containers don't need `--build` unless you:
- Add new npm/pip packages (update package.json/requirements.txt)
- Change Dockerfile itself

### 2. **Switching Between Modes**
Always stop one before starting the other:
```bash
# Stop production
sudo docker compose down

# Start dev
sudo docker compose -f docker-compose.dev.yml up -d
```

### 3. **Installing New Dependencies**

**In Dev Mode:**
```bash
# Backend (add to package.json then)
sudo docker compose -f docker-compose.dev.yml exec backend npm install

# Python services (add to requirements.txt then)
sudo docker compose -f docker-compose.dev.yml up --build llm-service
```

**In Prod Mode:**
Rebuild the service after updating package files.

---

Notes
- The backend expects a MongoDB connection string in `MONGO_URI`. The provided `docker-compose.yml` injects `mongodb://mongo:27017/cancer-risk` for local compose runs.
- Uploaded files are persisted to `./backend/uploads` on the host (bind mount).
- If you change frontend API endpoint, update the `REACT_APP_API_URL` build arg in `docker-compose.yml` before rebuilding.

Troubleshooting
- If the backend fails to connect to Mongo on startup, confirm the `mongo` container is healthy and reachable. `docker compose logs mongo` can help.
- If ports are in use, adjust host-side ports in `docker-compose.yml`.
