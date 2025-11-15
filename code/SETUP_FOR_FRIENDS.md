# 🚀 Quick Start for Friends

## TL;DR - Get Running in 5 Minutes

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd Cancer-Risk-Stratification/code
```

### 2. Create .env File
```bash
# Copy the template
cp backend/.env.example backend/.env

# Edit it with your MongoDB Atlas credentials
nano backend/.env
```

Update this line with your actual credentials:
```properties
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/cancer_risk_db?retryWrites=true&w=majority
```

### 3. Start Everything
```bash
docker compose up
```

**That's it!** ✨

After 1-2 minutes, you should see:
```
✅ Server running on port 5001
✅ MongoDB connected successfully
```

## Services That Will Start

| Service | Port | Purpose |
|---------|------|---------|
| Backend API | 5001 | Node.js server |
| OCR | 7000 | Document text extraction |
| Retriever | 8500 | Vector search |
| LLM | 8001 | AI responses |
| PostgreSQL | 5434 | Document vectors storage |

## Need MongoDB Atlas Credentials?

You can either:

**Option A: Ask Snigdha for credentials** (easiest)
- She'll give you her MongoDB Atlas username/password

**Option B: Create Your Own Cluster** (recommended)
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up free (512MB free tier)
3. Create cluster in your region
4. Follow instructions in `MONGODB_ATLAS_SETUP.md`

## Verify Everything Works

```bash
# Test API
curl http://localhost:5001/health

# View logs
docker compose logs -f node-backend

# Check all containers running
docker ps
```

## Common Issues

### "Connection timeout"
- Check internet connection
- Ensure MongoDB Atlas IP whitelist allows your location

### "MongoDB connected successfully" not appearing
- Wait 30 seconds and check again
- Verify MONGO_URI in .env is correct

### Want to stop everything?
```bash
docker compose down
```

### Want to restart?
```bash
docker compose restart
# or
docker compose down && docker compose up
```

## Important Files

- `backend/.env.example` - Template (don't modify, copy it!)
- `backend/.env` - Your actual credentials (never commit!)
- `MONGODB_ATLAS_SETUP.md` - Detailed MongoDB Atlas setup
- `DOCKER_QUICKSTART.md` - Docker tips & tricks

## Next Steps

1. Start the application
2. Access the frontend/API at `http://localhost:5001`
3. Test document upload & cancer risk analysis
4. Explore the services!

---

**Still stuck?** Check these files in order:
1. `MONGODB_ATLAS_SETUP.md` - MongoDB setup help
2. `DOCKER_QUICKSTART.md` - Docker & performance tips
3. `Readme.md` - General documentation

**Need real-time help?** Message Snigdha! 💬
