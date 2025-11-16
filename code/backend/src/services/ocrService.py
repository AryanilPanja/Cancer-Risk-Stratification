import os
import tempfile
import json
import requests
import uvicorn
from dotenv import load_dotenv # <-- New import
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import fitz  # PyMuPDF

# Load environment variables from .env file
load_dotenv() # <-- Load ENV

OCR_PORT = int(os.getenv("OCR_PORT", 7000))
# FIX: Change default fallback to 127.0.0.1 in case .env fails to load
RETRIEVER_API = os.getenv("RETRIEVER_API", "http://127.0.0.1:9000/analyze") 
FORWARD_TO_RETRIEVER = os.getenv("FORWARD_TO_RETRIEVER", "true").lower() in ("1", "true", "yes")
TIMEOUT = int(os.getenv("OCR_FORWARD_TIMEOUT", 30))

app = FastAPI(title="OCR Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text_from_pdf(pdf_path: str) -> str:
    text = ""
    doc = fitz.open(pdf_path)
    for page in doc:
        text += page.get_text()
    doc.close()
    return text

@app.get("/health")
def health():
    return {"status": "ok", "service": "ocr", "port": OCR_PORT}

@app.post("/ocr")
async def process_ocr(file: UploadFile = File(...)):
    try:
        print("[OCR] Received file:", getattr(file, "filename", "unknown"))
        # Using tempfile ensures the file is accessible by PyMuPDF
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            data = await file.read()
            tmp.write(data)
            tmp_path = tmp.name

        text = extract_text_from_pdf(tmp_path)
        print(f"[OCR] Extracted {len(text)} chars")

        # Cleanup the temporary file
        os.unlink(tmp_path)

        response_payload = {"extracted_text": text}

        # Optionally forward to retriever/analyze service
        if FORWARD_TO_RETRIEVER:
            try:
                print(f"[OCR] Forwarding extracted text to retriever at {RETRIEVER_API}")
                r = requests.post(RETRIEVER_API, json={"text": text}, timeout=TIMEOUT)
                r.raise_for_status()
                retriever_resp = r.json()
                print("[OCR] Retriever response received.")
                response_payload["retriever_response"] = retriever_resp
            except requests.exceptions.RequestException as e:
                # Catch requests-specific errors (connection refusal, timeouts, 4xx/5xx responses)
                error_message = f"Failed to forward to retriever: {e}"
                print(f"[OCR] Warning: {error_message}")
                response_payload["retriever_error"] = error_message
            except Exception as e:
                # Catch any other unexpected errors during forwarding
                error_message = f"Unexpected error during forwarding: {str(e)}"
                print(f"[OCR] Warning: {error_message}")
                response_payload["retriever_error"] = error_message


        return response_payload

    except Exception as e:
        print("[OCR] Error:", str(e))
        # Ensure a dictionary is always returned on error
        return {"error": str(e)}

if __name__ == "__main__":
    print(f"[OCR] Starting OCR service on 0.0.0.0:{OCR_PORT}")
    uvicorn.run(app, host="0.0.0.0", port=OCR_PORT)