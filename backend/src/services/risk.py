from transformers import pipeline
import json
import os

# ✅ Load BioBERT model
print("Loading BioBERT model...")
nlp_pipeline = pipeline(
    'question-answering',
    model='dmis-lab/biobert-base-cased-v1.1-squad',
    tokenizer='dmis-lab/biobert-base-cased-v1.1-squad'
)
print("✅ BioBERT model loaded successfully.")


# ✅ Function to flatten nested JSON
def flatten_json(json_obj):
    """Recursively flattens a JSON object into a single string."""
    flattened_text = []

    def extract_values(obj):
        if isinstance(obj, dict):
            for v in obj.values():
                extract_values(v)
        elif isinstance(obj, list):
            for item in obj:
                extract_values(item)
        else:
            flattened_text.append(str(obj))

    extract_values(json_obj)
    return " ".join(flattened_text)


# ✅ Function to calculate risk from output.json
def calculate_risk(output_json_path: str):
    if not os.path.exists(output_json_path):
        raise FileNotFoundError(f"❌ File not found: {output_json_path}")

    # Load OCR output
    with open(output_json_path, "r") as f:
        data = json.load(f)

    # Flatten JSON to plain text
    context_text = flatten_json(data)

    # Define the question for the model
    question = "Based on the report, what is the estimated cervical cancer risk level in percentage?"

    # Ask BioBERT
    result = nlp_pipeline(question=question, context=context_text)

    # Print or return risk info
    print("\n--- Risk Estimation ---")
    print(f"Answer: {result['answer']}")
    print(f"Confidence: {result['score']:.4f}")

    return result


if __name__ == "__main__":
    # Run on the OCR output
    calculate_risk("output.json")
