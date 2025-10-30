# llm_service.py
# Purpose: This is your local "NLP/ML Service"
# It uses FastAPI to create an API endpoint for the BioBERT model.

from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline
import uvicorn

# 1. Initialize the FastAPI app
app = FastAPI()

# 2. Load the BioBERT model (Question-Answering model)
# This will download the model the first time you run it.
print("Loading BioBERT model...")
# We use a model fine-tuned on the SQuAD dataset for QA
# This is the corrected line
nlp_pipeline = pipeline('question-answering', 
                        model='dmis-lab/biobert-base-cased-v1.1-squad', 
                        tokenizer='dmis-lab/biobert-base-cased-v1.1-squad')
print("Model loaded successfully.")

# 3. Define the request data structure
class ReportQuery(BaseModel):
    context: str
    question: str

# 4. Create the API endpoint
@app.post("/ask")
def process_report(query: ReportQuery):
    """
    Receives a context (the report) and a question,
    and returns the BioBERT model's answer.
    """
    try:
        result = nlp_pipeline(question=query.question, context=query.context)
        return {"answer": result['answer'], "score": result['score']}
    except Exception as e:
        return {"error": str(e)}

# 5. Run the server
if __name__ == "__main__":
    # This will run the service on http://localhost:8000
    uvicorn.run(app, host="127.0.0.1", port=8000)