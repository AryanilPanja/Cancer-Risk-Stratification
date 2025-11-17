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
