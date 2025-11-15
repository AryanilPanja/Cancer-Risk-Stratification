# retrieverService.py
import os
import time
import requests
import psycopg2
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware


OLLAMA_EMBED_URL = "http://localhost:11434/api/embeddings"
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")

# -------------------------------
# ENV CONFIG
# -------------------------------
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "rag_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "yourpassword")
RETRIEVER_PORT = int(os.getenv("RETRIEVER_PORT", 9000))
BIOBERT_API = os.getenv("BIOBERT_API", "http://127.0.0.1:8000/ask")
EMBED_DIM = int(os.getenv("EMBED_DIM", 384)) 
RISK_QUESTION = os.getenv(
    "RISK_QUESTION",
    "Assess the risk of high-grade cervical lesions based on this report, give a score between 0-100 percent based on the severity."
)
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", 500))
TOP_K = int(os.getenv("TOP_K", 3))

# -------------------------------
# FASTAPI SETUP
# -------------------------------
app = FastAPI(title="Retriever Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# OLLAMA EMBEDDING FUNCTION (FIXED)
# -------------------------------
def embed_text(texts):
    """
    Sends text to Ollama and guarantees valid embeddings.
    Empty embeddings are replaced with zero-vectors.
    """
    payload = {"model": EMBED_MODEL, "input": texts}
    response = requests.post(OLLAMA_EMBED_URL, json=payload)
    response.raise_for_status()

    raw = response.json()

    # Normalize Ollama output
    if "embedding" in raw:
        embeddings = [raw["embedding"]]
    else:
        embeddings = raw["embeddings"]

    # FIX: replace empty embeddings with zero vectors
    fixed_embeddings = []
    for emb in embeddings:
        if not emb or len(emb) == 0:        # empty list
            fixed_embeddings.append([0.0] * EMBED_DIM)
        else:
            fixed_embeddings.append(emb)

    return fixed_embeddings
# -------------------------------
# PGVECTOR SETUP
# -------------------------------
def get_conn():
    return psycopg2.connect(
        host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASSWORD
    )

def init_db():
    print("[Retriever] Initializing database...")
    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    except Exception as e:
        print("[Retriever] Could not create extension:", e)

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

init_db()

# -------------------------------
# TEXT CHUNKING
# -------------------------------
def chunks_from_text(text: str):
    text = text.strip()
    if not text:
        return []
    return [text[i:i+CHUNK_SIZE] for i in range(0, len(text), CHUNK_SIZE)]

# -------------------------------
# STORE EMBEDDINGS IN PGVECTOR
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
# RETRIEVE SIMILAR CHUNKS
# -------------------------------
def retrieve_context(query: str, doc_id: str, top_k: int = TOP_K):
    q_emb = embed_text([query])[0]
    q_emb_str = "[" + ",".join(str(float(x)) for x in q_emb) + "]"

    conn = get_conn()
    cur = conn.cursor()

    sql = f"""
        SELECT chunk_text, (embedding <=> '{q_emb_str}') AS dist
        FROM report_chunks
        WHERE doc_id = %s
        ORDER BY dist ASC
        LIMIT %s;
    """

    cur.execute(sql, (doc_id, top_k))
    rows = cur.fetchall()

    cur.close()
    conn.close()

    if not rows:
        print(f"[Retriever] No matches for doc_id={doc_id}")
        return ""

    context = "\n".join([row[0] for row in rows])
    print(f"[Retriever] Retrieved {len(rows)} chunks for doc_id={doc_id}")
    return context

# -------------------------------
# CALL BIOBERT LLM
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
# API MODELS
# -------------------------------
class AnalyzeRequest(BaseModel):
    text: str

# -------------------------------
# HEALTH CHECK
# -------------------------------
@app.get("/health")
def health():
    return {"status": "ok", "service": "retriever", "embedder_model": EMBED_MODEL}

# -------------------------------
# MAIN ANALYSIS ENDPOINT
# -------------------------------
@app.post("/analyze")
def analyze_report(request: AnalyzeRequest):
    try:
        report_text = request.text.strip()
        if not report_text:
            raise HTTPException(status_code=400, detail="Empty text provided")

        doc_id = f"doc_{int(time.time())}"

        # 1) vector storage
        count = store_embeddings(doc_id, report_text)

        # 2) similarity search
        context = retrieve_context(RISK_QUESTION, doc_id, top_k=TOP_K)
        if not context:
            context = report_text[:2000]

        # 3) BioBERT inference
        result = ask_biobert(context, RISK_QUESTION)
        answer = result.get("answer", "No answer").lower()

        # 4) scoring
        if "high" in answer:
            score = 9.0
        elif "moderate" in answer or "intermediate" in answer:
            score = 6.0
        elif "low" in answer:
            score = 2.0
        else:
            score = 5.0

        return {
            "doc_id": doc_id,
            "stored_chunks": count,
            "answer": answer,
            "score": score,
            "context_preview": context[:1000]
        }

    except HTTPException:
        raise
    except Exception as e:
        print("[Retriever] Error:", e)
        raise HTTPException(status_code=500, detail=str(e))

# -------------------------------
# RUN SERVICE
# -------------------------------
if __name__ == "__main__":
    print(f"[Retriever] Starting service on 127.0.0.1:{RETRIEVER_PORT}")
    uvicorn.run(app, host="127.0.0.1", port=RETRIEVER_PORT)
