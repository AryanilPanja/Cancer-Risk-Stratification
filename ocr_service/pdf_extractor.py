import fitz  # PyMuPDF library for PDF processing
import requests
import json
import os
from pprint import pprint

# --- CONFIGURATION ---

# 1. Ollama API Endpoint (This is the default for Ollama)
OLLAMA_HOST = "http://localhost:11434"
OLLAMA_MODEL = "mistral"  # Ensure you have run 'ollama run mistral' once

# 2. Path to the PDF to process
PDF_FILE_PATH = "Temp1.pdf" 

# 3. Define the desired JSON structure for the LLM
# This is injected into the prompt as the schema the LLM must follow.
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

# --- FUNCTIONS ---

def extract_text_from_pdf(pdf_path):
    """Extracts raw text from all pages of a PDF using PyMuPDF."""
    print(f"[*] Extracting text from: {pdf_path}")
    text = ""
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            # We use 'text' and not 'html' or 'xml' to get a clean text dump
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        print(f"[!] Error reading PDF: {e}")
        return None

def extract_structured_data_with_llm(raw_text, schema, model_name):
    """Sends the raw text and schema to the local Ollama API for extraction."""
    print(f"[*] Sending {len(raw_text)} characters to Ollama model '{model_name}'...")
    
    # Define the system prompt (The LLM's instructions)
    system_prompt = (
        "You are an expert medical data extraction agent. "
        "Your task is to analyze the provided diagnostic report text and extract the specific "
        "information fields requested in the JSON schema. "
        "Your entire response MUST be a single, valid JSON object that strictly adheres to the provided schema. "
        "Do not include any narrative, comments, or markdown outside the JSON block."
    )

    # Construct the final prompt for the model
    user_prompt = f"DOCUMENT TEXT:\n---\n{raw_text}\n---\n\nEXTRACT TO THIS JSON SCHEMA:\n{json.dumps(schema, indent=2)}"

    # Ollama API payload
    payload = {
        "model": model_name,
        "prompt": user_prompt,
        "stream": False,  # We want the full, complete response in one go
        "system": system_prompt,
        "format": "json" # Crucial: tells Ollama to enforce JSON output
    }

    try:
        # Send request to the Ollama API
        response = requests.post(f"{OLLAMA_HOST}/api/generate", json=payload)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)

        data = response.json()
        
        # The result text should be a JSON string
        json_output_str = data.get("response", "").strip()
        
        # Parse the JSON string into a Python object
        return json.loads(json_output_str)

    except requests.exceptions.ConnectionError:
        print(f"\n[!!!] CONNECTION ERROR [!!!]")
        print(f"Please ensure Ollama is running locally and the '{model_name}' model is downloaded.")
        print(f"Try running 'ollama run {model_name}' in your terminal first.")
        return None
    except requests.exceptions.RequestException as e:
        print(f"\n[!!!] API ERROR [!!!] Status Code: {response.status_code}")
        print(f"An error occurred during the API call: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"\n[!!!] JSON DECODE ERROR [!!!]")
        print(f"The model failed to return valid JSON.")
        print(f"Raw Model Output (might contain errors):\n{json_output_str}")
        return None

# --- MAIN EXECUTION ---

if __name__ == "__main__":
    
    # 1. Check if the PDF file exists
    if not os.path.exists(PDF_FILE_PATH):
        print(f"[FATAL] PDF file not found at: {PDF_FILE_PATH}")
        print("Please make sure your PDF is in the same directory as this script.")
    else:
        # 2. Extract text from PDF
        raw_pdf_text = extract_text_from_pdf(PDF_FILE_PATH)
        
        if raw_pdf_text:
            # 3. Call the local LLM for structured extraction
            extracted_json = extract_structured_data_with_llm(
                raw_pdf_text,
                TARGET_SCHEMA,
                OLLAMA_MODEL
            )

            if extracted_json:
                print("\n=======================================================")
                print("✅ EXTRACTION SUCCESSFUL:")
                print("=======================================================")
                pprint(extracted_json)
                print("=======================================================")
                
                # Optional: Save the result to a file
                with open("extracted_report.json", "w") as f:
                    json.dump(extracted_json, f, indent=2)
                print("\nOutput also saved to 'extracted_report.json'")
