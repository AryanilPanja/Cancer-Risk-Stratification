# MongoDB Configuration Options

## Current Setup: MongoDB Atlas (Cloud)

You're using **MongoDB Atlas** - a cloud-based MongoDB service.

### Advantages:
✅ No local container needed  
✅ Faster startup (fewer containers to run)  
✅ Better for production/deployment  
✅ Automatic backups  
✅ Free tier available  
✅ Accessible from anywhere  

### Configuration:
- Connection string is in `backend/.env`
- Variable: `MONGO_URI`
- No MongoDB container in docker-compose

---

## Alternative Setup: Local MongoDB Container

If you want to switch back to a **local MongoDB container**, uncomment it in `docker-compose.yml`.

### Advantages:
✅ No internet required  
✅ Works offline  
✅ Good for local development  
✅ Immediate access to database files  

### Disadvantages:
❌ Slower startup (~30+ minutes on first run)  
❌ Uses local disk space  
❌ Need to manage backups manually  
❌ Not accessible remotely  

---

## How to Switch Between Options

### Switch FROM MongoDB Atlas TO Local MongoDB:

1. **Uncomment MongoDB in docker-compose.yml**:
```bash
# Lines ~98-105 - uncomment the mongo service
```

2. **Update `.env` file** (optional - can use both):
```
MONGO_URI=mongodb://mongo:27017/cancerdb
```

3. **Restart containers**:
```bash
docker compose down
docker compose up
```

### Switch FROM Local MongoDB TO MongoDB Atlas:

1. **Comment out MongoDB in docker-compose.yml**:
```bash
# Comment lines ~98-105 with the mongo service
```

2. **Update `.env` file**:
```
MONGO_URI=mongodb+srv://bananascrazy2005_db_user:RH2H727dtmkyAZnQ@cluster0.xxxxx.mongodb.net/dbname?retryWrites=true&w=majority
```

3. **Restart containers**:
```bash
docker compose down
docker compose up
```

---

## Current Status

✅ **MongoDB Atlas is active**
- Using cloud-based MongoDB
- Connection credentials stored in `backend/.env`
- Backend container connects to Atlas on startup

---

## Comparison Table

| Feature | Local MongoDB | MongoDB Atlas |
|---------|--------------|---------------|
| Startup Time | Slow (5-10 mins) | Fast (seconds) |
| Storage | Local disk | Cloud |
| Internet Required | No | Yes |
| Backup | Manual | Automatic |
| Remote Access | No | Yes |
| Cost | Free | Free tier + paid |
| Best For | Development | Production |

---

## Troubleshooting

**Can't connect to MongoDB Atlas?**
```bash
# Check connection string in .env
cat backend/.env | grep MONGO_URI

# Test connection
docker compose logs node-backend | grep MongoDB
```

**Want to use local MongoDB?**
```bash
# Uncomment mongo service in docker-compose.yml
# Update .env with: MONGO_URI=mongodb://mongo:27017/cancerdb
docker compose up
```

**Connection timeout?**
```bash
# If using Atlas, check:
1. Network whitelist allows your IP
2. Username and password are correct
3. Connection string is correct
```

---

**Recommendation**: Keep **MongoDB Atlas** for easier deployment and faster startup times! 🚀
