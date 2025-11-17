# Cancer Risk Stratification System

A comprehensive cancer risk stratification system that uses OCR, LLM, and vector embeddings to analyze medical reports and provide risk assessments.

##  System Architecture

This application consists of multiple microservices:

- **Frontend**: React-based web interface (served via Nginx)
- **Node Backend**: Express.js API server for handling requests
- **OCR Service**: Extracts text from medical report images
- **Retriever Service**: Vector-based document retrieval using pgvector
- **LLM Service**: BioBERT-based analysis for medical insights
- **PostgreSQL + pgvector**: Vector database for embeddings
- **Ollama**: Embedding model service (nomic-embed-text)

##  Prerequisites

Before you begin, ensure you have the following installed:

- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or higher)
- At least 8GB of available RAM
- At least 20GB of free disk space

### Verify Installation

```bash
docker --version
docker compose version
```

##  Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/AryanilPanja/Cancer-Risk-Stratification.git
cd Cancer-Risk-Stratification
```

### 2. Pull All Docker Images

The application uses pre-built images from Docker Hub. Pull all required images:

```bash
# Pull all images at once
docker compose -f docker-compose.prod.yml pull

# Or pull individually (optional)
docker pull phoby/cancer-backend:latest
docker pull phoby/cancer-frontend:latest
docker pull phoby/cancer-retriever:latest
docker pull phoby/cancer-llm:latest
docker pull phoby/cancer-ocr:latest
docker pull ankane/pgvector:latest
docker pull ollama/ollama:latest
docker pull curlimages/curl:latest
```

### 3. Start the Application

```bash
docker compose -f docker-compose.prod.yml up -d
```

The `-d` flag runs containers in detached mode (background).

### 4. Monitor the Startup

```bash
# View logs from all services
docker compose -f docker-compose.prod.yml logs -f

# View logs from a specific service
docker compose -f docker-compose.prod.yml logs -f node-backend
```

**Important**: The first startup will take 5-10 minutes because:
- Ollama needs to pull the `nomic-embed-text` model (~500MB)
- PostgreSQL needs to initialize the database
- Services need to wait for their dependencies

### 5. Verify Services are Running

```bash
docker compose -f docker-compose.prod.yml ps
```

You should see all services with status `Up` or `healthy`.

### 6. Access the Application

Once all services are running:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **OCR Service**: http://localhost:7000
- **Retriever Service**: http://localhost:8500
- **LLM Service**: http://localhost:8001
- **PostgreSQL**: localhost:5434
- **Ollama**: http://localhost:11435

##  Configuration

### Environment Variables

The application uses the following environment variables (configured in `docker-compose.prod.yml`):

#### Node Backend
- `OCR_API`: http://ocr:7000/ocr
- `RETRIEVER_API`: http://retriever:9000/analyze
- `MONGO_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: Secret key for JWT authentication

#### Retriever Service
- `OLLAMA_EMBED_URL`: http://ollama:11434/api/embed
- `EMBED_DIM`: 768 (embedding dimension)
- `DB_HOST`: postgres
- `DB_PORT`: 5432
- `DB_USER`: postgres
- `DB_PASSWORD`: yourpassword
- `DB_NAME`: chunks_db
- `BIOBERT_API`: http://llm:8000/ask
- `RETRIEVER_PORT`: 9000

#### PostgreSQL
- `POSTGRES_USER`: postgres
- `POSTGRES_PASSWORD`: yourpassword
- `POSTGRES_DB`: chunks_db

### Customizing Configuration

To modify environment variables:

1. Create a `.env` file in the project root
2. Override variables as needed
3. Update `docker-compose.prod.yml` to reference the `.env` file

##  Service Details

### Frontend (Port 3000)
- React application served by Nginx
- Connects to backend API at port 5001
- Provides user interface for doctors, pathologists, and admins

### Node Backend (Port 5001)
- Express.js REST API
- Handles authentication, user management, and report processing
- Coordinates between OCR, Retriever, and LLM services

### OCR Service (Port 7000)
- Extracts text from medical report images (PDF, JPEG, PNG)
- Uses Tesseract or similar OCR engine

### Retriever Service (Port 8500)
- Vector-based semantic search using pgvector
- Generates embeddings using Ollama (nomic-embed-text)
- Retrieves relevant medical information

### LLM Service (Port 8001)
- BioBERT-based medical text analysis
- Provides cancer risk assessments
- Generates medical insights

### PostgreSQL + pgvector (Port 5434)
- Stores vector embeddings
- Enables semantic similarity search
- Persists data in `pgdata` volume

### Ollama (Port 11435)
- Provides embedding model (nomic-embed-text)
- Used by retriever service for generating embeddings

##  Common Operations

### Stop the Application

```bash
docker compose -f docker-compose.prod.yml down
```

### Stop and Remove All Data

```bash
docker compose -f docker-compose.prod.yml down -v
```

**Warning**: This will delete all database data and volumes!

### Restart a Specific Service

```bash
docker compose -f docker-compose.prod.yml restart node-backend
```

### View Service Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f retriever

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 node-backend
```

### Update to Latest Images

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Check Service Health

```bash
# View container status
docker compose -f docker-compose.prod.yml ps

# Check resource usage
docker stats

# Inspect a specific service
docker compose -f docker-compose.prod.yml exec node-backend sh
```

##  Troubleshooting

### Services Not Starting

1. **Check if ports are available**:
   ```bash
   # Check if ports are already in use
   sudo lsof -i :3000
   sudo lsof -i :5001
   sudo lsof -i :7000
   sudo lsof -i :8500
   sudo lsof -i :8001
   sudo lsof -i :5434
   ```

2. **Check Docker logs**:
   ```bash
   docker compose -f docker-compose.prod.yml logs --tail=50
   ```

3. **Verify Docker resources**:
   - Ensure Docker has enough RAM allocated (min 8GB)
   - Check available disk space: `df -h`

### Ollama Model Not Loading

If the `ollama-setup` service fails:

```bash
# Manually pull the model
docker compose -f docker-compose.prod.yml exec ollama ollama pull nomic-embed-text

# Restart retriever service
docker compose -f docker-compose.prod.yml restart retriever
```

### Database Connection Issues

```bash
# Check PostgreSQL health
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres

# View PostgreSQL logs
docker compose -f docker-compose.prod.yml logs postgres
```

### Reset Everything

If you encounter persistent issues:

```bash
# Stop and remove everything
docker compose -f docker-compose.prod.yml down -v

# Remove all related images (optional)
docker image prune -a

# Pull fresh images and restart
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Frontend Cannot Connect to Backend

1. Check if backend is running:
   ```bash
   curl http://localhost:5001/health
   ```

2. Verify CORS settings in backend
3. Check browser console for errors

### OCR Service Failing

```bash
# Check OCR service logs
docker compose -f docker-compose.prod.yml logs ocr

# Test OCR endpoint
curl -X POST http://localhost:7000/ocr -F "file=@sample.pdf"
```

##  Data Persistence

The application uses Docker volumes for data persistence:

- **pgdata**: PostgreSQL database and vector embeddings
- **ollama-data**: Ollama models and cache

These volumes persist data even when containers are stopped. To backup:

```bash
# Backup PostgreSQL data
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres chunks_db > backup.sql

# Restore from backup
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres chunks_db < backup.sql
```


##  Testing the Application

### Health Check Endpoints

```bash
# Backend health
curl http://localhost:5001/health

# OCR service
curl http://localhost:7000/health

# Retriever service
curl http://localhost:8500/health

# LLM service
curl http://localhost:8001/health
```

##  Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Ollama Documentation](https://ollama.ai/docs)


##  Authors

- AryanilPanja - [GitHub](https://github.com/AryanilPanja)
- 

##  Support

For issues and questions:
- Open an issue on [GitHub](https://github.com/AryanilPanja/Cancer-Risk-Stratification/issues)
- Check existing documentation in the `/code` directory

##  Next Steps

After successfully running the application:

1. **Create user accounts** for different roles (doctor, pathologist)
2. **Upload sample medical reports** to test OCR functionality
3. **Test the risk stratification** features

