# ⚡ First Run Guide - Docker Setup

## What to Expect on First Run

When you run `docker compose up` for the first time, it may take **15-45 minutes** depending on your internet speed. Here's why:

### Timeline:
- **Minutes 0-15**: Downloading Docker images (~20GB total)
  - Backend image: 1.53GB
  - Python services: ~3 × 7.9GB each
- **Minutes 15-30**: Extracting and starting services
- **Minutes 30-45**: PostgreSQL and MongoDB initialization

### What You'll See:

```
[+] Running 6/6
 ✔ Container code-postgres-1      Running
 ✔ Container code-mongo-1         Running
 ✔ Container code-ocr-1           Running
 ✔ Container code-llm-1           Running
 ✔ Container code-retriever-1     Running
 ✔ Container code-node-backend-1  Running

✅ Server running on port 5001
```

## ✅ Signs Everything is Working

Once started, you should see:

```
node-backend-1  | ✅ Server running on port 5001
node-backend-1  | MongoDB connected successfully
```

And these endpoints should respond:

```bash
curl http://localhost:5001/health
curl http://localhost:7000/docs       # OCR Swagger UI
curl http://localhost:9000/           # Retriever
curl http://localhost:8000/           # LLM
```

## 🚀 Monitoring First Run

Open **another terminal** and run:

```bash
# Watch container startup
docker ps

# Check image downloads
docker images | grep snigdha1403

# Monitor logs for each service
docker compose logs -f node-backend  # API
docker compose logs -f ocr           # OCR service
docker compose logs -f postgres      # Database
docker compose logs -f mongo         # MongoDB
```

## ⏱️ Subsequent Runs

**After the first run, starting should take only 10-20 seconds** since all images are cached locally!

## 🆘 Troubleshooting First Run

### 1. **Takes longer than 45 minutes?**
- Check your internet speed (images are large ~20GB)
- Run `docker images` to see download progress
- Network might be unstable

### 2. **Container keeps restarting?**
```bash
docker compose logs node-backend  # Check errors
docker compose ps                  # Check status
```

### 3. **Port already in use?**
```bash
# Check what's using port 5001
lsof -i :5001

# Or change ports in docker-compose.yml:
# Change "5001:5001" to "5002:5001"
```

### 4. **Low disk space?**
```bash
df -h                    # Check disk space
docker system prune -a   # Clean up old images/containers
```

## 📝 Quick Commands

```bash
# Start fresh
docker compose down
docker compose pull      # Get latest images
docker compose up

# View all logs
docker compose logs

# Follow logs in real-time
docker compose logs -f

# Stop everything
docker compose down

# Remove everything (including data)
docker compose down -v
```

## ✨ After Setup

Your application is now running:
- **API**: http://localhost:5001
- **OCR Service**: http://localhost:7000/docs
- **MongoDB**: localhost:27018 (changed from 27017 to avoid conflicts)
- **PostgreSQL**: localhost:5434

Happy coding! 🚀
