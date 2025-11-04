from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline
import uvicorn

app = FastAPI()

print("Loading BioBERT model...")
nlp_pipeline = pipeline('question-answering', 
                        model='dmis-lab/biobert-base-cased-v1.1-squad',
                        tokenizer='dmis-lab/biobert-base-cased-v1.1-squad')
print("Model loaded successfully.")

class Query(BaseModel):
    context: str
    question: str

@app.post("/ask")
def ask_biobert(query: Query):
    try:
        result = nlp_pipeline(question=query.question, context=query.context)
        return {"answer": result["answer"], "score": result["score"]}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
