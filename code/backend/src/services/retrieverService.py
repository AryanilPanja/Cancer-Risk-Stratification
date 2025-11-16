import os
import time
import requests
import psycopg2
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient, errors as pymongo_errors

# -------------------------------
# Load environment variables
# -------------------------------
load_dotenv()

OLLAMA_EMBED_URL = os.getenv("OLLAMA_EMBED_URL", "http://localhost:11434/api/embeddings")
EMBED_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
EMBED_DIM = int(os.getenv("EMBED_DIM", 384))

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "rag_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "yourpassword")
RETRIEVER_PORT = int(os.getenv("RETRIEVER_PORT", 9000))
BIOBERT_API = os.getenv("BIOBERT_API", "http://127.0.0.1:8000/ask")
RISK_QUESTION = os.getenv(
    "RISK_QUESTION",
    "Assess the risk of cervical cancer based on this report"
)
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", 500))
TOP_K = int(os.getenv("TOP_K", 3))

# -------------------------------
# MongoDB Atlas setup
# -------------------------------
MONGO_URI = os.getenv("MONGO_URI")
mongo_client = None
mongo_db = None
patients_col = None
reports_col = None
users_col = None

try:
    print("[Retriever] Attempting MongoDB Atlas connection...")
    mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    mongo_client.admin.command('ping')
    mongo_db = mongo_client.get_database("cancer_db")
    patients_col = mongo_db.get_collection("patients")
    reports_col = mongo_db.get_collection("reports")
    users_col = mongo_db.get_collection("users")
    print("[Retriever] MongoDB Atlas connected successfully.")
except pymongo_errors.ServerSelectionTimeoutError as e:
    print(f"[Retriever] CRITICAL MONGODB ERROR: {e}")
except Exception as e:
    print(f"[Retriever] General MongoDB error: {e}")

# -------------------------------
# FastAPI setup
# -------------------------------
app = FastAPI(title="Retriever Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# Embedding function
# -------------------------------
def embed_text(texts):
    payload = {"model": EMBED_MODEL, "input": texts}
    response = requests.post(OLLAMA_EMBED_URL, json=payload)
    response.raise_for_status()
    raw = response.json()

    if "embedding" in raw:
        embeddings = [raw["embedding"]]
    else:
        embeddings = raw["embeddings"]

    # Replace empty embeddings with zero vectors
    fixed_embeddings = []
    for emb in embeddings:
        if not emb or len(emb) == 0:
            fixed_embeddings.append([0.0] * EMBED_DIM)
        else:
            fixed_embeddings.append(emb)
    return fixed_embeddings

# -------------------------------
# Postgres setup
# -------------------------------
def get_conn():
    try:
        return psycopg2.connect(
            host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASSWORD
        )
    except psycopg2.OperationalError as e:
        print(f"[Retriever] CRITICAL POSTGRES ERROR: {e}")
        raise ConnectionError("Postgres connection failed.") from e

def init_db():
    print("[Retriever] Initializing database...")
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        cur.execute(f"""
        CREATE TABLE IF NOT EXISTS report_chunks (
            id SERIAL PRIMARY KEY,
            doc_id TEXT,
            chunk_text TEXT,
            embedding VECTOR({EMBED_DIM}),
            created_at TIMESTAMP DEFAULT NOW()
        );
        """)
        conn.commit()
        cur.close()
        conn.close()
        print("[Retriever] DB ready.")
    except Exception as e:
        print(f"[Retriever] WARNING: DB initialization failed: {e}")

init_db()

# -------------------------------
# Text chunking
# -------------------------------
def chunks_from_text(text: str):
    text = text.strip()
    if not text:
        return []
    # This splits the text by whitespace and returns a list of individual words.
    words = text.split()
    # You might want to remove punctuation if you do this
    import re
    cleaned_words = [re.sub(r'[^\w]', '', word) for word in words]
    return [w for w in cleaned_words if w]

# -------------------------------
# Store embeddings
# -------------------------------
def store_embeddings(doc_id: str, text: str):
    chunks = chunks_from_text(text)
    if not chunks:
        print("[Retriever] No chunks found.")
        return 0

    embeddings = embed_text(chunks)
    conn = get_conn()
    cur = conn.cursor()
    inserted = 0

    try:
        for chunk, emb in zip(chunks, embeddings):
            emb_str = "[" + ",".join(str(float(x)) for x in emb) + "]"
            cur.execute(
                "INSERT INTO report_chunks (doc_id, chunk_text, embedding) VALUES (%s, %s, %s::vector)",
                (doc_id, chunk, emb_str),
            )
            inserted += 1
        conn.commit()
        print(f"[Retriever] Stored {inserted} chunks for doc_id={doc_id}")
    finally:
        cur.close()
        conn.close()
    return inserted

# -------------------------------
# Retrieve top-k similar chunks based on question embedding
# -------------------------------
def retrieve_similar_chunks(query_text: str, doc_id: str, top_k: int = TOP_K):
    # 1) Embed the question
    q_emb = embed_text([query_text])[0]
    q_emb_str = "[" + ",".join(str(float(x)) for x in q_emb) + "]"

    # 2) Query Postgres for closest chunks
    conn = get_conn()
    cur = conn.cursor()
    sql = f"""
        SELECT chunk_text, (embedding <=> '{q_emb_str}') AS distance
        FROM report_chunks
        WHERE doc_id = %s
        ORDER BY distance ASC
        LIMIT %s;
    """
    cur.execute(sql, (doc_id, top_k))
    rows = cur.fetchall()
    cur.close()
    conn.close()

    if not rows:
        print(f"[Retriever] No matching chunks for doc_id={doc_id}")
        return []

    return [row[0] for row in rows]

# -------------------------------
# Call BioBERT LLM
# -------------------------------
def ask_biobert(context: str, question: str, timeout=30):
    try:
        payload = {"context": context, "question": question}
        r = requests.post(BIOBERT_API, json=payload, timeout=timeout)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"BioBERT API error: {str(e)}")

# -------------------------------
# API Models
# -------------------------------
class AnalyzeRequest(BaseModel):
    text: str

# -------------------------------
# Health check
# -------------------------------
@app.get("/health")
def health():
    return {"status": "ok", "service": "retriever", "embedder_model": EMBED_MODEL}

# -------------------------------
# Main analysis endpoint
# -------------------------------
@app.post("/analyze")
def analyze_report(request: AnalyzeRequest):
    if reports_col is None:
         raise HTTPException(status_code=503, detail="MongoDB Atlas connection failed.")

    try:
        report_text = request.text.strip()
        if not report_text:
            raise HTTPException(status_code=400, detail="Empty text provided")

        # 0) Store raw report in MongoDB Atlas
        report_doc = {
            "text": report_text,
            "created_at": time.time(),
            "status": "pending"
        }
        report_id = reports_col.insert_one(report_doc).inserted_id
        doc_id = str(report_id)

        # 1) Store report chunks embeddings in Postgres
        count = store_embeddings(doc_id, report_text)

        # 2) Embed question and retrieve top 3 similar chunks
        top_chunks = retrieve_similar_chunks(RISK_QUESTION, doc_id, top_k=TOP_K)
        if not top_chunks:
            context = report_text[:2000]  # fallback
        else:
            context = "\n".join(top_chunks)

        # 3) BioBERT inference
        result = ask_biobert(context, RISK_QUESTION)
        answer = result.get("answer", "No answer").lower()

        # 4) Scoring
        if "high" in answer:
            score = 90.0
        elif "moderate" in answer or "intermediate" in answer:
            score = 60.0
        elif "low" in answer:
            score = 20.0
        else:
            score = 50.0

        return {
            "doc_id": doc_id,
            "stored_chunks": count,
            "answer": answer,
            "score": score,
            "context_preview": context[:1000]
        }

    except ConnectionError as e:
        print(f"[Retriever] Connection Error: {e}")
        raise HTTPException(status_code=503, detail="Database connectivity issue.")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Retriever] UNEXPECTED ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# -------------------------------
# Run service
# -------------------------------
if __name__ == "__main__":
    print(f"[Retriever] Starting service on 127.0.0.1:{RETRIEVER_PORT}")
    uvicorn.run(app, host="127.0.0.1", port=RETRIEVER_PORT)
