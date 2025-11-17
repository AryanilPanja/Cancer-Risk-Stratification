#!/bin/bash

# Quick Test Script for LLM Integration
# Usage: ./test_integration.sh

set -e

echo "======================================"
echo "Cancer Report LLM Integration Test"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env not found. Run this from project root.${NC}"
    exit 1
fi

# Check GEMINI_API_KEY
if ! grep -q "^GEMINI_API_KEY=" .env; then
    echo -e "${RED}Error: GEMINI_API_KEY not found in .env${NC}"
    echo "Get your key from: https://aistudio.google.com/app/apikey"
    echo "Then add to .env: GEMINI_API_KEY=your_key_here"
    exit 1
fi

GEMINI_KEY=$(grep "^GEMINI_API_KEY=" .env | cut -d'=' -f2)
if [ "$GEMINI_KEY" == "your_gemini_api_key_here" ] || [ -z "$GEMINI_KEY" ]; then
    echo -e "${RED}Error: Please set a real GEMINI_API_KEY in .env${NC}"
    exit 1
fi

echo -e "${GREEN}✓ GEMINI_API_KEY found${NC}"

# Check Python dependencies
echo ""
echo "Checking Python dependencies..."
cd code/backend/src/services

if ! python3 -c "import google.generativeai" 2>/dev/null; then
    echo -e "${YELLOW}Installing google-generativeai...${NC}"
    pip install google-generativeai
fi

if ! python3 -c "import dotenv" 2>/dev/null; then
    echo -e "${YELLOW}Installing python-dotenv...${NC}"
    pip install python-dotenv
fi

echo -e "${GREEN}✓ Python dependencies ready${NC}"

# Test LLM service
echo ""
echo "Testing LLM service with sample data..."
echo "----------------------------------------"

python3 llmService.py --test

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ LLM service test PASSED${NC}"
else
    echo ""
    echo -e "${RED}✗ LLM service test FAILED${NC}"
    exit 1
fi

# Check uploads directory
cd ../../../..
UPLOADS_DIR="code/backend/uploads"
if [ ! -d "$UPLOADS_DIR" ]; then
    echo ""
    echo "Creating uploads directory..."
    mkdir -p "$UPLOADS_DIR"
    echo -e "${GREEN}✓ Created $UPLOADS_DIR${NC}"
else
    echo -e "${GREEN}✓ Uploads directory exists${NC}"
fi

# Summary
echo ""
echo "======================================"
echo "Integration Test Summary"
echo "======================================"
echo -e "${GREEN}✓ Environment configured${NC}"
echo -e "${GREEN}✓ Python dependencies installed${NC}"
echo -e "${GREEN}✓ LLM service functional${NC}"
echo -e "${GREEN}✓ Uploads directory ready${NC}"
echo ""
echo "Next steps:"
echo "1. Start backend: cd code/backend && npm run dev"
echo "2. Test upload: POST http://localhost:5001/api/pathologist/upload"
echo "3. Check MongoDB for new patient and report"
echo ""
echo -e "${GREEN}Ready for production testing!${NC}"
