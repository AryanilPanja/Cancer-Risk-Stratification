# 🚀 Quick Start Guide

## ⚡ Fastest Way to Get Started

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd Cancer-Risk-Stratification/code

# 2. Start all services with Docker
docker compose up

# ⏳ Wait 15-45 minutes on first run (depends on internet speed)
# ⚡ On subsequent runs: ~20 seconds
```

That's it! Everything will be running automatically.

## 📊 First Run Takes Time - Here's Why

Your friend is experiencing the **normal first-run delay**:

| Phase | Time | What's Happening |
|-------|------|-----------------|
| Image Download | 10-30 min | Pulling 20GB+ of Docker images from Docker Hub |
| Image Extraction | 2-5 min | Extracting images to local Docker storage |
| Service Startup | 2-5 min | Starting containers and initializing databases |
| **Total** | **15-45 min** | Depends on internet speed |

### After First Run: ⚡ Only 10-20 seconds!
(All images are cached locally)

## ✅ How to Know When It's Done

Look for these messages in the terminal:

```
✅ Server running on port 5001
MongoDB connected successfully
```

## 🔍 Monitor Progress

While waiting, open another terminal and run:

```bash
# See what's downloading
docker images | grep snigdha1403

# Check container status
docker ps

# Watch logs
docker compose logs -f
```

## 📚 More Documentation

- **[FIRST_RUN.md](./FIRST_RUN.md)** - Detailed first-run guide with troubleshooting
- **[DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md)** - Quick Docker reference
- **[DOCKER_PUSH_GUIDE.md](./DOCKER_PUSH_GUIDE.md)** - How to update and push images

## 🎯 What's Running

Once started, you have:

| Service | Port | URL |
|---------|------|-----|
| **API Backend** | 5001 | http://localhost:5001 |
| **OCR Service** | 7000 | http://localhost:7000/docs |
| **Retriever** | 9000 | http://localhost:9000 |
| **LLM Service** | 8000 | http://localhost:8000 |
| **MongoDB** | 27018 | mongodb://localhost:27018 |
| **PostgreSQL** | 5434 | postgres://localhost:5434 |

## 🆘 Need Help?

See [FIRST_RUN.md](./FIRST_RUN.md) for troubleshooting common issues.

---

**💡 Pro Tip**: Pre-built images mean no compilation time - just pull, extract, and run! Much faster than building from scratch. ✨
