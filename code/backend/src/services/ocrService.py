import fitz  # PyMuPDF library for PDF processing
import requests
import json
import os
import sys

# --- CONFIGURATION ---
OLLAMA_HOST = "http://localhost:11434"

OLLAMA_MODEL = "tinyllama"

# Define the desired JSON structure for the LLM
TARGET_SCHEMA = {
    "diagnosis": {
        "title": "PAP DIAGNOSIS:",
        "finding": "ATYPICAL SQUAMOUS CELLS OF UNDETERMINED SIGNIFICANCE (ASC-US)"
    },
    "results": {
        "main_title": "Cytologic and Molecular Results",
        "molecular_results": {
            "title": "MOLECULAR RESULTS:",
            "high_risk_hpv": "DETECTED",
            "chlamydia_trachomatis": "not detected",
            "neisseria_gonorrhoeae": "not detected",
            "trichomonas_vaginalis": "not detected"
        }
    },
    "findings": {
        "title": "Additional Cytologic Findings",
        "specimen_adequacy": "Satisfactory for evaluation.",
        "transformation_zone": "Endocervical/transformation zone component present"
    }
}

def extract_text_from_pdf(pdf_path):
    """Extracts raw text from all pages of a PDF using PyMuPDF."""
    text = ""
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        print(f"[!] Error reading PDF: {e}", file=sys.stderr)
        sys.exit(1)

def extract_structured_data_with_llm(raw_text, schema, model_name):
    """Sends the raw text and schema to the local Ollama API for extraction."""
    system_prompt = (
        "You are an expert medical data extraction agent. "
        "Your task is to analyze the provided diagnostic report text and extract the specific "
        "information fields requested in the JSON schema. "
        "Your entire response MUST be a single, valid JSON object that strictly adheres to the provided schema."
    )
    user_prompt = f"DOCUMENT TEXT:\n---\n{raw_text}\n---\n\nEXTRACT TO THIS JSON SCHEMA:\n{json.dumps(schema, indent=2)}"
    payload = {
        "model": model_name,
        "prompt": user_prompt,
        "stream": False,
        "system": system_prompt,
        "format": "json"
    }
    try:
        response = requests.post(f"{OLLAMA_HOST}/api/generate", json=payload, timeout= 300)
        response.raise_for_status()
        data = response.json()
        return json.loads(data.get("response", "").strip())
    except Exception as e:
        print(f"[!] Error during LLM extraction: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python pdf_extractor.py <PDF_PATH>", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        print(f"[!] PDF file not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    raw_pdf_text = extract_text_from_pdf(pdf_path)
    extracted_json = extract_structured_data_with_llm(raw_pdf_text, TARGET_SCHEMA, OLLAMA_MODEL)
    print(json.dumps(extracted_json, indent=2))