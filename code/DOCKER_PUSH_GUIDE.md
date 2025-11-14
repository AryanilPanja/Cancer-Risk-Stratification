# Docker Hub Deployment Guide

## Overview
Your Cancer Risk Stratification application images have been pushed to Docker Hub. This guide explains how to use pre-built images instead of rebuilding them.

## Docker Hub Repository
- **Backend Image**: `snigdha1403/cancer-risk-backend:latest`
- **Python Services**:
  - Retriever: `snigdha1403/cancer-risk-python:retriever`
  - LLM: `snigdha1403/cancer-risk-python:llm`
  - OCR: `snigdha1403/cancer-risk-python:ocr`

## For New Users (Cloning Your Repository)

### Option 1: Use Pre-Built Images (Recommended - Fastest)
Simply run:
```bash
docker-compose up
```

The `docker-compose.yml` is configured to pull pre-built images from Docker Hub. No building needed!

### Option 2: Rebuild Locally (If Modifications Needed)
If you need to modify the code and rebuild:

1. Uncomment the `build` sections in `docker-compose.yml` (they are currently commented out)
2. Run:
```bash
docker-compose up --build
```

## For Your Local Development

### Rebuilding and Pushing Updates

When you make code changes and want to update the images on Docker Hub:

```bash
# Navigate to the code directory
cd /home/snigdha/Documents/dsi/Cancer-Risk-Stratification\ \(copy\)/code

# Login to Docker Hub (if needed)
docker login

# Build and push each image
# Backend
docker build -f Dockerfile.backend -t snigdha1403/cancer-risk-backend:latest .
docker push snigdha1403/cancer-risk-backend:latest

# Retriever
docker build -f Dockerfile.python --target retriever -t snigdha1403/cancer-risk-python:retriever .
docker push snigdha1403/cancer-risk-python:retriever

# LLM
docker build -f Dockerfile.python --target llm -t snigdha1403/cancer-risk-python:llm .
docker push snigdha1403/cancer-risk-python:llm

# OCR
docker build -f Dockerfile.python --target ocr -t snigdha1403/cancer-risk-python:ocr .
docker push snigdha1403/cancer-risk-python:ocr
```

### Quick Update Script
Create a file `push_images.sh`:

```bash
#!/bin/bash
set -e

echo "🐳 Building and Pushing Docker Images..."

cd "$(dirname "$0")"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

USERNAME="snigdha1403"
BACKEND_IMAGE="$USERNAME/cancer-risk-backend:latest"
PYTHON_BASE="$USERNAME/cancer-risk-python"

echo -e "${BLUE}📦 Building Backend Image...${NC}"
docker build -f Dockerfile.backend -t $BACKEND_IMAGE .
echo -e "${GREEN}✓ Backend built${NC}"

echo -e "${BLUE}📦 Building Retriever Service...${NC}"
docker build -f Dockerfile.python --target retriever -t $PYTHON_BASE:retriever .
echo -e "${GREEN}✓ Retriever built${NC}"

echo -e "${BLUE}📦 Building LLM Service...${NC}"
docker build -f Dockerfile.python --target llm -t $PYTHON_BASE:llm .
echo -e "${GREEN}✓ LLM built${NC}"

echo -e "${BLUE}📦 Building OCR Service...${NC}"
docker build -f Dockerfile.python --target ocr -t $PYTHON_BASE:ocr .
echo -e "${GREEN}✓ OCR built${NC}"

echo -e "${BLUE}🚀 Pushing Images to Docker Hub...${NC}"
docker push $BACKEND_IMAGE
echo -e "${GREEN}✓ Backend pushed${NC}"

docker push $PYTHON_BASE:retriever
echo -e "${GREEN}✓ Retriever pushed${NC}"

docker push $PYTHON_BASE:llm
echo -e "${GREEN}✓ LLM pushed${NC}"

docker push $PYTHON_BASE:ocr
echo -e "${GREEN}✓ OCR pushed${NC}"

echo -e "${GREEN}✨ All images successfully built and pushed!${NC}"
```

Make it executable:
```bash
chmod +x push_images.sh
./push_images.sh
```

## Understanding the docker-compose.yml Changes

### Before (Building locally every time):
```yaml
node-backend:
  build:
    context: .
    dockerfile: Dockerfile.backend
```

### After (Using pre-built images):
```yaml
node-backend:
  image: snigdha1403/cancer-risk-backend:latest
  # Uncomment below to rebuild instead
  # build:
  #   context: .
  #   dockerfile: Dockerfile.backend
```

## Key Benefits

✅ **For Users Cloning Your Repo**:
- No build time (~4-5 minutes saved)
- No need to have all dependencies installed
- Consistent environment across all users
- Just run `docker-compose up` and go!

✅ **For Your Local Development**:
- Easy to push updates to Docker Hub
- Simple script to rebuild and push all images at once
- Others always have the latest stable version
- Easy to revert to build locally if needed

## Troubleshooting

### Image Pull Errors
```bash
# Ensure you're logged in to Docker Hub
docker login

# Pull images manually
docker pull snigdha1403/cancer-risk-backend:latest
docker pull snigdha1403/cancer-risk-python:retriever
docker pull snigdha1403/cancer-risk-python:llm
docker pull snigdha1403/cancer-risk-python:ocr
```

### Using Build Instead of Image Temporarily
Uncomment the `build` sections in `docker-compose.yml` and run:
```bash
docker-compose up --build
```

### Cleaning Up Old Images
```bash
docker image prune -a
docker-compose pull --policy always
docker-compose up
```

## Next Steps

1. ✅ Images are pushed to Docker Hub
2. ✅ `docker-compose.yml` is configured to use pre-built images
3. Share your repository with others - they can now just run `docker-compose up`!
4. When you make changes, use `push_images.sh` to update all images at once

---

Happy coding! 🚀
