#!/usr/bin/env python3
"""
LLM Service for Cancer Report Analysis using Google Gemini 2.0 Flash
Provides two main functions:
1. Extract patient metadata (name, DOB, phone, sex) from report
2. Analyze diagnosis section for cancer risk assessment

Now supports direct file processing (PDF, images, etc.)
"""

import os
import sys
import json
import re
from pathlib import Path
from typing import Dict, Any, Optional

# Load environment variables from project root
from dotenv import load_dotenv

# Resolve path to root .env (4 levels up from this file)
root_env_path = Path(__file__).resolve().parent.parent.parent.parent / '.env'
if root_env_path.exists():
    load_dotenv(dotenv_path=root_env_path)
else:
    load_dotenv()  # Fallback to default search

try:
    import google.generativeai as genai
except ImportError:
    print("ERROR: google-generativeai not installed. Run: pip install google-generativeai", file=sys.stderr)
    sys.exit(1)

# Optional: PDF text extraction
try:
    import PyPDF2
    HAS_PDF = True
except ImportError:
    HAS_PDF = False

# Optional: Image text extraction
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("ERROR: GEMINI_API_KEY not found in environment variables", file=sys.stderr)
    sys.exit(1)

genai.configure(api_key=GEMINI_API_KEY)


class LLMService:
    """Service class for interacting with Google Gemini LLM"""
    
    def __init__(self, model_name: str = "gemini-2.0-flash-exp"):
        """
        Initialize the LLM service
        
        Args:
            model_name: Name of the Gemini model to use
        """
        self.model = genai.GenerativeModel(model_name)
        self.generation_config = {
            "temperature": 0.2,  # Lower temperature for more consistent extraction
            "top_p": 0.8,
            "top_k": 40,
            "max_output_tokens": 2048,
        }
    
    def extract_text_from_file(self, file_path: str) -> str:
        """
        Extract text from a file (PDF, image, or text file)
        
        Args:
            file_path: Path to the file
            
        Returns:
            Extracted text content
        """
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Handle PDF files
        if file_path.suffix.lower() == '.pdf' and HAS_PDF:
            try:
                text = ""
                with open(file_path, 'rb') as f:
                    pdf_reader = PyPDF2.PdfReader(f)
                    for page in pdf_reader.pages:
                        text += page.extract_text() + "\n"
                return text.strip()
            except Exception as e:
                print(f"WARNING: PDF extraction failed: {e}", file=sys.stderr)
                # Fall through to Gemini vision
        
        # Handle image files - use Gemini's vision capabilities
        image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}
        if file_path.suffix.lower() in image_extensions:
            try:
                # Upload file to Gemini for vision processing
                uploaded_file = genai.upload_file(str(file_path))
                
                # Use vision model to extract text
                vision_prompt = """Extract ALL text from this medical report image.
                
Return the complete text exactly as it appears, maintaining the original formatting and structure.
Include all sections: patient information, diagnosis, test results, doctor notes, etc.

Extracted Text:"""
                
                response = self.model.generate_content([vision_prompt, uploaded_file])
                extracted_text = response.text.strip()
                
                # Clean up uploaded file
                genai.delete_file(uploaded_file.name)
                
                return extracted_text
            except Exception as e:
                print(f"ERROR: Image text extraction failed: {e}", file=sys.stderr)
                raise
        
        # Handle plain text files
        if file_path.suffix.lower() in {'.txt', '.text'}:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        
        # For PDFs without PyPDF2, try Gemini vision
        if file_path.suffix.lower() == '.pdf':
            try:
                uploaded_file = genai.upload_file(str(file_path))
                vision_prompt = "Extract all text from this medical report PDF."
                response = self.model.generate_content([vision_prompt, uploaded_file])
                text = response.text.strip()
                genai.delete_file(uploaded_file.name)
                return text
            except Exception as e:
                print(f"ERROR: PDF vision extraction failed: {e}", file=sys.stderr)
                raise
        
        raise ValueError(f"Unsupported file type: {file_path.suffix}")
    
    def process_file(self, file_path: str) -> Dict[str, Any]:
        """
        Process a medical report file: extract text and analyze
        
        Args:
            file_path: Path to the medical report file
            
        Returns:
            Dictionary containing both metadata and analysis
        """
        # Extract text from file
        report_text = self.extract_text_from_file(file_path)
        
        if not report_text or len(report_text) < 50:
            raise ValueError(f"Insufficient text extracted from file (got {len(report_text)} characters)")
        
        # Process the extracted text
        return self.process_full_report(report_text)
    
    def extract_patient_metadata(self, report_text: str) -> Dict[str, Any]:
        """
        Extract patient metadata from medical report text
        
        Args:
            report_text: Full text of the medical report
            
        Returns:
            Dictionary with keys: name, dob, phoneNumber, sex
        """
        prompt = f"""You are a medical data extraction assistant. Extract the following patient information from the medical report below.

Return ONLY a valid JSON object with these exact keys:
- "name": patient's full name (string)
- "dob": date of birth in YYYY-MM-DD format (string, or null if not found)
- "phoneNumber": phone number (string, or null if not found)
- "sex": biological sex - "Male", "Female", or "Other" (string, or null if not found)

If any field is not found in the report, use null for that field.

Medical Report:
---
{report_text}
---

JSON Response:"""

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=self.generation_config
            )
            
            # Extract JSON from response
            result_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if result_text.startswith('```'):
                result_text = re.sub(r'^```(?:json)?\s*\n', '', result_text)
                result_text = re.sub(r'\n```\s*$', '', result_text)
            
            metadata = json.loads(result_text)
            
            # Validate and normalize
            return {
                "name": metadata.get("name") or "Unknown",
                "dob": metadata.get("dob"),  # Can be null
                "phoneNumber": metadata.get("phoneNumber"),  # Can be null
                "sex": metadata.get("sex") or "Unknown"
            }
            
        except json.JSONDecodeError as e:
            print(f"ERROR: Failed to parse LLM response as JSON: {e}", file=sys.stderr)
            print(f"Response was: {result_text}", file=sys.stderr)
            return self._fallback_metadata_extraction(report_text)
        except Exception as e:
            print(f"ERROR: Metadata extraction failed: {e}", file=sys.stderr)
            return self._fallback_metadata_extraction(report_text)
    
    def _fallback_metadata_extraction(self, report_text: str) -> Dict[str, Any]:
        """Regex-based fallback for metadata extraction"""
        result = {
            "name": "Unknown",
            "dob": None,
            "phoneNumber": None,
            "sex": "Unknown"
        }
        
        # Try to extract name
        name_match = re.search(r'(?:Name|Patient Name|Patient)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', report_text, re.IGNORECASE)
        if name_match:
            result["name"] = name_match.group(1).strip()
        
        # Try to extract DOB
        dob_match = re.search(r'(?:DOB|Date of Birth|Birth Date)[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})', report_text, re.IGNORECASE)
        if dob_match:
            result["dob"] = dob_match.group(1)
        
        # Try to extract phone
        phone_match = re.search(r'(?:Phone|Mobile|Contact)[:\s]+(\+?\d[\d\s\-\(\)]+)', report_text, re.IGNORECASE)
        if phone_match:
            result["phoneNumber"] = phone_match.group(1).strip()
        
        # Try to extract sex
        sex_match = re.search(r'(?:Sex|Gender)[:\s]+(Male|Female|M|F|Other)', report_text, re.IGNORECASE)
        if sex_match:
            sex = sex_match.group(1).upper()
            if sex in ['M', 'MALE']:
                result["sex"] = "Male"
            elif sex in ['F', 'FEMALE']:
                result["sex"] = "Female"
            else:
                result["sex"] = "Other"
        
        return result
    
    def analyze_cancer_diagnosis(self, report_text: str) -> Dict[str, Any]:
        """
        Analyze the diagnosis section for cancer risk assessment
        
        Args:
            report_text: Full text of the medical report
            
        Returns:
            Dictionary with keys: riskLevel, cancerPositiveScore, diagnosisAnalysis
        """
        prompt = f"""You are an expert oncology AI assistant. Analyze the following medical report and provide a cancer risk assessment.

Return ONLY a valid JSON object with these exact keys:
- "riskLevel": one of "low", "medium", or "high" (string)
- "cancerPositiveScore": probability of cancer from 0 to 100 (integer)
- "diagnosisAnalysis": detailed explanation of your assessment (string, 2-3 sentences)

Focus on the diagnosis section and any pathology findings. Base your assessment on:
- Presence of malignant cells or tissue
- Tumor markers or abnormal cell characteristics
- Staging information if available
- Histopathological findings

Medical Report:
---
{report_text}
---

JSON Response:"""

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=self.generation_config
            )
            
            # Extract JSON from response
            result_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if result_text.startswith('```'):
                result_text = re.sub(r'^```(?:json)?\s*\n', '', result_text)
                result_text = re.sub(r'\n```\s*$', '', result_text)
            
            analysis = json.loads(result_text)
            
            # Validate and normalize
            risk_level = analysis.get("riskLevel", "unknown").lower()
            if risk_level not in ["low", "medium", "high"]:
                risk_level = "unknown"
            
            score = int(analysis.get("cancerPositiveScore", 0))
            score = max(0, min(100, score))  # Clamp to 0-100
            
            return {
                "riskLevel": risk_level,
                "cancerPositiveScore": score,
                "diagnosisAnalysis": analysis.get("diagnosisAnalysis", "Analysis not available")
            }
            
        except json.JSONDecodeError as e:
            print(f"ERROR: Failed to parse LLM response as JSON: {e}", file=sys.stderr)
            print(f"Response was: {result_text}", file=sys.stderr)
            return self._fallback_cancer_analysis(report_text)
        except Exception as e:
            print(f"ERROR: Cancer analysis failed: {e}", file=sys.stderr)
            return self._fallback_cancer_analysis(report_text)
    
    def _fallback_cancer_analysis(self, report_text: str) -> Dict[str, Any]:
        """Keyword-based fallback for cancer analysis"""
        text_lower = report_text.lower()
        
        # Check for cancer-related keywords
        high_risk_keywords = ['malignant', 'carcinoma', 'metastasis', 'cancer', 'tumor grade 3', 'stage iv', 'stage 4']
        medium_risk_keywords = ['abnormal cells', 'atypical', 'dysplasia', 'suspicious', 'tumor', 'neoplasm']
        low_risk_keywords = ['benign', 'normal', 'negative for malignancy', 'no evidence of cancer']
        
        high_risk_count = sum(1 for kw in high_risk_keywords if kw in text_lower)
        medium_risk_count = sum(1 for kw in medium_risk_keywords if kw in text_lower)
        low_risk_count = sum(1 for kw in low_risk_keywords if kw in text_lower)
        
        if high_risk_count > 0:
            return {
                "riskLevel": "high",
                "cancerPositiveScore": 75,
                "diagnosisAnalysis": "Report contains indicators of malignancy. Medical review recommended."
            }
        elif medium_risk_count > 0 and low_risk_count == 0:
            return {
                "riskLevel": "medium",
                "cancerPositiveScore": 40,
                "diagnosisAnalysis": "Report shows abnormal findings. Further investigation may be needed."
            }
        elif low_risk_count > 0:
            return {
                "riskLevel": "low",
                "cancerPositiveScore": 10,
                "diagnosisAnalysis": "Report indicates benign or normal findings."
            }
        else:
            return {
                "riskLevel": "unknown",
                "cancerPositiveScore": 0,
                "diagnosisAnalysis": "Unable to determine cancer risk from available information."
            }
    
    def process_full_report(self, report_text: str) -> Dict[str, Any]:
        """
        Process a full report: extract metadata and perform cancer analysis
        
        Args:
            report_text: Full text of the medical report
            
        Returns:
            Dictionary containing both metadata and analysis
        """
        metadata = self.extract_patient_metadata(report_text)
        analysis = self.analyze_cancer_diagnosis(report_text)
        
        return {
            "metadata": metadata,
            "analysis": analysis
        }


def main():
    """CLI interface for testing"""
    if len(sys.argv) < 2:
        print("Usage: python llmService.py <report_file_path>")
        print("   OR: python llmService.py --test")
        sys.exit(1)
    
    service = LLMService()
    
    if sys.argv[1] == "--test":
        # Test with sample data
        sample_report = """
        PATHOLOGY REPORT
        
        Patient Name: John Smith
        Date of Birth: 1975-03-15
        Phone: +1-555-0123
        Sex: Male
        
        DIAGNOSIS:
        Histological examination reveals adenocarcinoma of the lung with moderate differentiation.
        Tumor size: 3.5 cm. Lymph node involvement detected. Stage IIB.
        
        IMPRESSION:
        Malignant neoplasm consistent with primary lung adenocarcinoma.
        Recommend oncology consultation for treatment planning.
        """
        
        print("Testing with sample report...")
        result = service.process_full_report(sample_report)
        print("\n=== RESULTS ===")
        print(json.dumps(result, indent=2))
    else:
        # Process file
        file_path = sys.argv[1]
        if not os.path.exists(file_path):
            print(f"ERROR: File not found: {file_path}", file=sys.stderr)
            sys.exit(1)
        
        print(f"Processing file: {file_path}", file=sys.stderr)
        result = service.process_file(file_path)
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
