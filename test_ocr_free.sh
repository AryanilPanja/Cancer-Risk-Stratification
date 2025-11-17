#!/bin/bash

# Quick Test - OCR-Free Upload System
# Tests the new direct file processing flow

set -e

echo "========================================"
echo "OCR-Free Upload System - Quick Test"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env not found. Run this from project root.${NC}"
    exit 1
fi

# Check GEMINI_API_KEY
if ! grep -q "^GEMINI_API_KEY=" .env; then
    echo -e "${RED}Error: GEMINI_API_KEY not found in .env${NC}"
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

MISSING_DEPS=0

if ! python3 -c "import google.generativeai" 2>/dev/null; then
    echo -e "${YELLOW}⚠ google-generativeai not installed${NC}"
    MISSING_DEPS=1
fi

if ! python3 -c "import PyPDF2" 2>/dev/null; then
    echo -e "${YELLOW}⚠ PyPDF2 not installed${NC}"
    MISSING_DEPS=1
fi

if ! python3 -c "import PIL" 2>/dev/null; then
    echo -e "${YELLOW}⚠ Pillow not installed${NC}"
    MISSING_DEPS=1
fi

if [ $MISSING_DEPS -eq 1 ]; then
    echo ""
    echo -e "${YELLOW}Installing missing dependencies...${NC}"
    pip install -r requirements.txt
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ All Python dependencies ready${NC}"
fi

# Test LLM service
echo ""
echo "Testing LLM service with sample data..."
echo "----------------------------------------"

python3 llmService.py --test 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ LLM service test PASSED${NC}"
else
    echo ""
    echo -e "${RED}✗ LLM service test FAILED${NC}"
    echo "Check GEMINI_API_KEY and try again"
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
echo "========================================"
echo "Test Summary"
echo "========================================"
echo -e "${GREEN}✓ Environment configured${NC}"
echo -e "${GREEN}✓ Python dependencies installed${NC}"
echo -e "${GREEN}✓ LLM service functional (no OCR)${NC}"
echo -e "${GREEN}✓ Uploads directory ready${NC}"
echo ""
echo "OCR service is NO LONGER NEEDED!"
echo ""
echo "Next steps:"
echo "1. Start backend: cd code/backend && npm run dev"
echo "2. Upload a PDF/image via: POST http://localhost:5001/api/pathologist/upload"
echo "3. LLM will process file directly (no OCR service required)"
echo "4. Check MongoDB for results"
echo ""
echo -e "${GREEN}Ready for testing!${NC}"
