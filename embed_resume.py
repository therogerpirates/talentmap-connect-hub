from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Request
from fastapi.responses import JSONResponse
import httpx
import PyPDF2
from supabase import create_client, Client
import io
import os
import traceback
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from dotenv import load_dotenv
import os

# Load environment variables from a .env file
load_dotenv()

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
GROQ_API_KEY = os.environ.get("GROQ_API_KEY") # It's safer to use environment variables
groq_client = Groq(api_key=GROQ_API_KEY)

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

async def generate_summary(text: str) -> str:
    if not GROQ_API_KEY:
        print("GROQ_API_KEY not set. Skipping summary generation.")
        return ""
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant trained to summarize resumes. Provide a concise and well-structured summary of the following resume text.",
                },
                {
                    "role": "user",
                    "content": text,
                },
            ],
            model="llama3-8b-8192", # Or choose another Groq model
            temperature=0.7,
            max_tokens=500, # Adjust as needed
        )
        return chat_completion.choices[0].message.content or ""
    except Exception as e:
        print("Groq summarization error:", e)
        traceback.print_exc()
        # Decide how to handle this - maybe return empty string or raise? Returning empty for now.
        return ""

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
            # Don't raise HTTPException for 400 here, just return error JSON
            return JSONResponse({"status": "error", "step": "pdf_extraction", "detail": "No text found in PDF."}, status_code=400)
    except Exception as e:
        print("PDF extraction failed:", e)
        return JSONResponse({"status": "error", "step": "pdf_extraction", "detail": str(e)}, status_code=500)

    # 2. Get embedding from Ollama
    try:
        embedding = await get_embedding(text)
    except Exception as e:
        print("Embedding failed:", e)
        return JSONResponse({"status": "error", "step": "embedding", "detail": str(e)}, status_code=500)

    # 3. Generate summary using Groq
    summary = await generate_summary(text)

    # 4. Store embedding and summary in Supabase
    try:
        update_data = {"resume_embeddings": embedding}
        if summary:
             update_data["summary"] = summary # Only add summary if generated

        response = supabase.table("students").update(
            update_data
        ).eq("id", student_id).execute()

        # Check for error in the response data for RPCs/updates
        if response.data is None or (isinstance(response.data, list) and len(response.data) == 0):
             # Supabase update doesn't always raise an exception on failure for update/insert
             # Check if the data was actually updated by verifying the response.data
             print("Supabase update likely failed or target student not found.", response)
             # You might want to check the response structure more thoroughly depending on the actual Supabase client response for an update that finds no row.
             # For now, assuming if data is None/empty list, it didn't find/update the row.
             return JSONResponse({"status": "error", "step": "supabase_update", "detail": "Supabase update failed or student ID not found."}, status_code=500)

        # Check for APIError which is raised for RPCs but maybe not always for update?
        # The previous error was an AttributeError on response.error, so removing that check.

    except Exception as e:
        print("Supabase update failed:", e)
        traceback.print_exc()
        return JSONResponse({"status": "error", "step": "supabase_update", "detail": str(e)}, status_code=500)

    # 2. Get embedding for the SUMMARY from Ollama
    try:
        # Use the generated summary to create the embedding
        summary_embedding = await get_embedding(summary)
    except Exception as e:
        print("Summary Embedding failed:", e)
        return JSONResponse({"status": "error", "step": "summary_embedding", "detail": str(e)}, status_code=500)

    # 3. Store summary and summary embedding in Supabase
    try:
        update_data = {
            "summary": summary,
            "summary_embedding": summary_embedding # Store the embedding of the summary
        }

        response = supabase.table("students").update(
            update_data
        ).eq("id", student_id).execute()

        # Check for error in the response data for RPCs/updates
        if response.data is None or (isinstance(response.data, list) and len(response.data) == 0):
             # Supabase update doesn't always raise an exception on failure for update/insert
             # Check if the data was actually updated by verifying the response.data
             print("Supabase update likely failed or target student not found.", response)
             # You might want to check the response structure more thoroughly depending on the actual Supabase client response for an update that finds no row.
             # For now, assuming if data is None/empty list, it didn't find/update the row.
             return JSONResponse({"status": "error", "step": "supabase_update", "detail": "Supabase update failed or student ID not found."}, status_code=500)

        # Check for APIError which is raised for RPCs but maybe not always for update?
        # The previous error was an AttributeError on response.error, so removing that check.

    except Exception as e:
        print("Supabase update failed:", e)
        traceback.print_exc()
        return JSONResponse({"status": "error", "step": "supabase_update", "detail": str(e)}, status_code=500)

    return JSONResponse({"status": "success", "embedding_dim": len(embedding), "summary_generated": bool(summary)})

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