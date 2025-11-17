# 🚀 Quick Start with Docker Hub Images

## For First-Time Users: Clone & Run (No Building!)

```bash
# Clone the repository
git clone <your-repo-url>
cd Cancer-Risk-Stratification/code

# Run with docker-compose (pulls pre-built images from Docker Hub)
docker-compose up
```

That's it! ✨ The application will start with all services:
- Backend API (Node.js) on port 5001
- Retriever Service on port 8500
- LLM Service on port 8001
- OCR Service on port 7000
- PostgreSQL on port 5434
- MongoDB on port 27017

## 📦 Docker Hub Images Available

All images are publicly available on Docker Hub:

| Service | Image | Size |
|---------|-------|------|
| Backend (Node.js) | `snigdha1403/cancer-risk-backend:latest` | 1.53GB |
| Retriever (Python) | `snigdha1403/cancer-risk-python:retriever` | 7.9GB |
| LLM (Python) | `snigdha1403/cancer-risk-python:llm` | 7.9GB |
| OCR (Python) | `snigdha1403/cancer-risk-python:ocr` | 7.9GB |

## 🔄 For Development: Using Pre-built Images

When you clone the repo, the `docker-compose.yml` is configured to use pre-built images by default. 

**Run normally (pulls from Docker Hub):**
```bash
docker-compose up
```

**If you need to rebuild after making code changes:**

Uncomment the `build` sections in `docker-compose.yml` and run:
```bash
docker-compose up --build
```

Or use the provided `push_images.sh` script to rebuild AND push your changes.

## 🛠️ For Repository Owner: Updating Images

When you make code changes and want to push new versions:

```bash
cd code/
./push_images.sh
```

This script will:
1. Build all Docker images locally
2. Push them to Docker Hub
3. Others can immediately use the latest versions

Or push manually:
```bash
docker build -f Dockerfile.backend -t snigdha1403/cancer-risk-backend:latest .
docker push snigdha1403/cancer-risk-backend:latest
```

## ✅ Verify Everything Works

After running `docker-compose up`, test the services:

```bash
# Test backend API
curl http://localhost:5001/health

# Check running containers
docker ps

# View logs
docker-compose logs node-backend
docker-compose logs retriever
docker-compose logs llm
docker-compose logs ocr
```

## 🐛 Troubleshooting

### Images won't pull
```bash
# Ensure Docker is running and you have internet
docker pull snigdha1403/cancer-risk-backend:latest
```

### Want to use local build instead
Uncomment the `build:` sections in `docker-compose.yml`:

```yaml
node-backend:
  # Uncomment to build locally
  build:
    context: .
    dockerfile: Dockerfile.backend
  # Or use image from Docker Hub (default)
  # image: snigdha1403/cancer-risk-backend:latest
```

### Force update images
```bash
docker-compose pull
docker-compose up --force-recreate
```

## 📚 More Information

See `DOCKER_PUSH_GUIDE.md` for detailed information about Docker Hub deployment and image management.

---

**Time Saved**: ~5 minutes per setup (no build time!) ⏱️
