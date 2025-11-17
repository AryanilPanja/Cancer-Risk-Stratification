# MongoDB Atlas Setup Guide

## What is MongoDB Atlas?

MongoDB Atlas is a cloud-hosted MongoDB database service (similar to AWS RDS for MySQL). It's free up to 512MB, which is perfect for development and testing.

## Step-by-Step Setup

### 1. Create MongoDB Atlas Account

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Sign Up" → Use your email
3. Follow the verification steps

### 2. Create a Cluster

1. After login, click "Create" → "Build a Database"
2. Choose **Free Tier** (M0)
3. Select your region (choose closest to you for best performance)
4. Click "Create Cluster"
5. Wait 2-3 minutes for cluster to be created

### 3. Create Database User

1. Go to **Security** → **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** as authentication method
4. Enter:
   - **Username**: `bananascrazy2005_db_user` (or your choice)
   - **Password**: Generate a strong one (e.g., `RH2H727dtmkyAZnQ`)
   - Click **"Create User"**
5. Copy your username and password - you'll need them!

### 4. Set IP Whitelist

1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Choose **"Allow Access from Anywhere"** (for development)
   - (For production, specify your exact IP)
4. Click **"Confirm"**

### 5. Get Connection String

1. Go to **Clusters** (left sidebar)
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** and copy the connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dbname?retryWrites=true&w=majority
```

### 6. Update Your .env File

Replace the connection string in `/code/backend/.env`:

```properties
MONGO_URI=mongodb+srv://bananascrazy2005_db_user:RH2H727dtmkyAZnQ@cluster0.xxxxx.mongodb.net/cancer_risk_db?retryWrites=true&w=majority
```

**Important**: Replace `xxxxx` with your actual cluster name from the connection string!

## Verify Connection

After updating `.env`, restart your backend:

```bash
docker compose restart node-backend
docker compose logs node-backend
```

You should see: `MongoDB connected successfully`

## Important Security Notes ⚠️

1. **Never commit `.env` with real credentials** to GitHub
2. Add `.env` to `.gitignore`:
   ```bash
   echo ".env" >> .gitignore
   ```
3. Use `.env.example` for template showing what variables are needed
4. For production, use:
   - Strong passwords
   - IP whitelisting (not "Allow Anywhere")
   - MongoDB Atlas encryption
   - Regular backups

## Troubleshooting

### Connection Timeout
- Check IP whitelist includes your IP
- Verify username/password is correct
- Ensure connection string format is right

### Authentication Failed
- Double-check username and password
- Make sure special characters in password are URL-encoded
- Reset password in MongoDB Atlas if needed

### Connection String Format
Correct format:
```
mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
```

## Benefits of MongoDB Atlas

✅ No local database to maintain  
✅ Automatic backups  
✅ Free tier with 512MB storage  
✅ Easy scaling when you need more storage  
✅ Built-in monitoring and alerts  
✅ Data in the cloud (accessible from anywhere)  

## Local Development Alternative

If you still want local MongoDB, use:
```
MONGO_URI=mongodb://mongo:27017/cancer_risk_db
```
And uncomment the `mongo:` service in `docker-compose.yml`

---

**Need help?** Check MongoDB Atlas documentation: https://docs.atlas.mongodb.com/
