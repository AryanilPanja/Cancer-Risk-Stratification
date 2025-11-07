FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download models at build time to avoid runtime delays
RUN python -c "from transformers import pipeline; pipeline('question-answering', model='dmis-lab/biobert-base-cased-v1.1-squad')"
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy service files
COPY . .

EXPOSE 8000 8001 9000

# Default command (can be overridden in docker-compose)
CMD ["uvicorn", "llmService:app", "--host", "0.0.0.0", "--port", "8000"]
