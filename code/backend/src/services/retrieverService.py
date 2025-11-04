import psycopg2
import json
import requests
import numpy as np
from sentence_transformers import SentenceTransformer

DB_HOST = "localhost"
DB_NAME = "rag_db"
DB_USER = "postgres"
DB_PASSWORD = "yourpassword"

BIOBERT_API = "http://127.0.0.1:8000/ask"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
EMBED_DIM = 384
RISK_QUESTION = "Assess the risk of high-grade cervical lesions based on this report."

embedder = SentenceTransformer(EMBEDDING_MODEL)

def get_conn():
    return psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASSWORD)

def store_embeddings(doc_id, text):
    chunks = [text[i:i+250] for i in range(0, len(text), 250)]
    embeddings = embedder.encode(chunks, convert_to_numpy=True)
    conn = get_conn()
    cur = conn.cursor()
    for chunk, emb in zip(chunks, embeddings):
        emb_str = '[' + ','.join(map(str, emb)) + ']'
        cur.execute("INSERT INTO report_chunks (doc_id, chunk_text, embedding) VALUES (%s, %s, %s::vector)",
                    (doc_id, chunk, emb_str))
    conn.commit()
    cur.close()
    conn.close()
    print(f"✅ Stored {len(chunks)} chunks.")

def retrieve_context(query, top_k=3):
    q_emb = embedder.encode([query])[0]
    q_emb_str = '[' + ','.join(map(str, q_emb)) + ']'
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"""
        SELECT chunk_text, (embedding <=> '{q_emb_str}') AS dist
        FROM report_chunks
        ORDER BY dist ASC
        LIMIT {top_k};
    """)
    context = "\n".join([row[0] for row in cur.fetchall()])
    cur.close()
    conn.close()
    return context

def ask_biobert(context, question):
    payload = {"context": context, "question": question}
    r = requests.post(BIOBERT_API, json=payload)
    return r.json()

if __name__ == "__main__":
    # Read structured data from OCR output
    with open("output.json") as f:
        data = json.load(f)

    # Flatten text
    report_text = f"""
    PAP DIAGNOSIS: {data['diagnosis']['finding']}
    MOLECULAR RESULTS: {data['results']['molecular_results']}
    ADDITIONAL FINDINGS: {data['findings']}
    """

    store_embeddings("Temp1_Report", report_text)
    context = retrieve_context(RISK_QUESTION)
    result = ask_biobert(context, RISK_QUESTION)

    print("\n=== FINAL RISK SCORE ===")
    print("Answer:", result.get("answer"))
    print("Confidence:", result.get("score"))
