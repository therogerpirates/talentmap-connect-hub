from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Request
from fastapi.responses import JSONResponse
import httpx
import PyPDF2
from supabase import create_client, Client
import io
import os
import traceback
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend URL(s) instead of "*"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure these with your Supabase project details
SUPABASE_URL = "https://vsgyopyvyeeqryzomtgq.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzZ3lvcHl2eWVlcXJ5em9tdGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwOTgzNTksImV4cCI6MjA2MzY3NDM1OX0.oWmn5RIGTfxFiE9O-bUSNoSR7Rnl_rFwleUSR5QDqg4"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

OLLAMA_URL = "http://localhost:11434/api/embeddings"
OLLAMA_MODEL = "bge-m3:latest"

#GROQ_API_URL = "https://api.groq.com/v1/embeddings"
GROQ_API_KEY = "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"

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        print("PDF extraction error:", e)
        traceback.print_exc()
        raise

async def get_embedding(text: str):
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": text
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(OLLAMA_URL, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["embedding"]
    except Exception as e:
        print("Embedding error:", e)
        traceback.print_exc()
        raise

@app.post("/embed-resume/")
async def embed_resume(
    student_id: str = Form(...),
    file: UploadFile = File(...)
):
    # 1. Read PDF in-memory
    try:
        file_bytes = await file.read()
        text = extract_text_from_pdf(file_bytes)
        if not text.strip():
            print("No text found in PDF.")
            raise HTTPException(status_code=400, detail="No text found in PDF.")
    except Exception as e:
        print("PDF extraction failed:", e)
        return JSONResponse({"status": "error", "step": "pdf_extraction", "detail": str(e)}, status_code=500)

    # 2. Get embedding from Ollama
    try:
        embedding = await get_embedding(text)
    except Exception as e:
        print("Embedding failed:", e)
        return JSONResponse({"status": "error", "step": "embedding", "detail": str(e)}, status_code=500)

    # 3. Store embedding in Supabase
    try:
        # Update the student's resume_embedding
        response = supabase.table("students").update({
            "resume_embeddings": embedding
        }).eq("id", student_id).execute()
        if response.error is not None:
            print("Supabase update failed:", response.error)
            raise Exception(response.error)
    except Exception as e:
        print("Supabase update failed:", e)
        traceback.print_exc()
        return JSONResponse({"status": "error", "step": "supabase_update", "detail": str(e)}, status_code=500)

    return JSONResponse({"status": "success", "embedding_dim": len(embedding)})

@app.post("/search-students/")
async def search_students(request: Request):
    data = await request.json()
    query = data.get("query")
    if not query:
        return JSONResponse({"error": "No query provided"}, status_code=400)

    # 1. Get embedding from Ollama (not Groq)
    payload = {"model": OLLAMA_MODEL, "prompt": query}
    async with httpx.AsyncClient() as client:
        ollama_resp = await client.post(OLLAMA_URL, json=payload)
        ollama_resp.raise_for_status()
        embedding = ollama_resp.json()["embedding"]

    # 2. Vector search in Supabase
    try:
        response = supabase.rpc(
            "match_students_by_embedding",
            {"query_embedding": embedding, "match_count": 5}
        ).execute()
        results = response.data
    except Exception as e:
        print("Supabase RPC error:", e)
        return JSONResponse({"error": str(e)}, status_code=500)

    print("Query embedding:", embedding)
    print("Supabase vector search results:", results)

    return JSONResponse({"results": results}) 