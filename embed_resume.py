from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Request
from fastapi.responses import JSONResponse, StreamingResponse
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
import csv # Import csv module
import zipfile # Import zipfile module

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

# Placeholder function for skill extraction
def extract_skills_from_text(text: str) -> list[str]:
    """
    Extracts a list of skills from the resume text.
    This is a placeholder - you need to implement the actual skill extraction logic.
    """
    # TODO: Implement actual skill extraction logic here.
    # This could involve keyword matching, regex, or an NLP library.
    # Example: basic keyword matching
    potential_skills = ["Python", "JavaScript", "React", "SQL", "AWS", "Docker"]
    found_skills = [skill for skill in potential_skills if skill.lower() in text.lower()]
    return found_skills

# Placeholder function for extracting experience and internship status
def extract_experience_data(text: str) -> dict:
    """
    Extracts experience data, including internship status, from the resume text.
    This is a placeholder - you need to implement the actual extraction logic.
    """
    # TODO: Implement actual experience and internship extraction logic here.
    # This is significantly more complex than skill extraction and may require advanced NLP.
    # A simple placeholder might just check for keywords like "intern" or "internship".
    has_internship = "internship" in text.lower() or "intern" in text.lower()
    # In a real application, you'd extract job titles, companies, dates, descriptions, etc.
    # For this placeholder, we'll just return the internship status.
    return {"has_internship": has_internship, "experience_entries": []} # Add more fields as needed

# Placeholder function for calculating ATS score
def calculate_ats_score(text: str) -> int:
    """
    Calculates a basic Applicant Tracking System (ATS) compatibility score.
    This is a placeholder - you need to implement the actual scoring logic.
    """
    # TODO: Implement actual ATS scoring logic here.
    # This could involve keyword density (against a job description if available), formatting, section headers, etc.
    # A very simple placeholder score based on resume length:
    words_count = len(text.split())
    # Simple scoring: 0-100. Assume a good resume is between 300-800 words.
    if words_count < 300:
        score = max(0, int(words_count / 3))
    elif words_count > 800:
        score = max(0, 100 - int((words_count - 800) / 5))
    else:
        score = 50 + int((words_count - 300) / 10) # Scale from 50 to 100
    
    # Cap score between 0 and 100
    return max(0, min(100, score))

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

    # 4. Extract skills from text
    try:
        skills = extract_skills_from_text(text)
        print(f"Extracted skills: {skills}") # Log extracted skills
    except Exception as e:
        print("Skill extraction failed:", e)
        # Decide how to handle skill extraction failure - proceed without skills or return error?
        # For now, we'll just log and proceed.
        skills = [] # Ensure skills is an empty list on failure

    # 5. Extract experience data
    try:
        experience_data = extract_experience_data(text)
        has_internship = experience_data.get("has_internship", False)
        # You might also want to store experience_entries if you extract them
        print(f"Extracted experience data: {experience_data}") # Log extracted data
    except Exception as e:
        print("Experience extraction failed:", e)
        # Decide how to handle failure - proceed or return error?
        # For now, log and proceed with defaults.
        has_internship = False
        experience_data = {"has_internship": False, "experience_entries": []}

    # 6. Calculate ATS score
    try:
        ats_score = calculate_ats_score(text)
        print(f"Calculated ATS score: {ats_score}") # Log the score
    except Exception as e:
        print("ATS score calculation failed:", e)
        # Decide how to handle failure - proceed or return error?
        # For now, log and proceed with a default score.
        ats_score = 0 # Default score on failure

    # 7. Store data in Supabase
    try:
        update_data = {
            "resume_embeddings": embedding,
            "summary": summary,
            "skills": skills,
            "has_internship": has_internship, # Add has_internship
            "ats_score": ats_score # Add ATS score
            # Add experience_entries here if you decide to store them
        }

        # Only add summary_embedding if summary was generated - kept for potential future use
        # if summary:
        #     update_data["summary_embedding"] = await get_embedding(summary) # Need to re-generate if not done yet

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

# Helper to get file path from Supabase URL
def get_file_path_from_supabase_url(url: str) -> str | None:
    public_url_base = f"https://vsgyopyvyeeqryzomtgq.supabase.co/storage/v1/object/public/resumes/"
    if url.startswith(public_url_base):
        return url[len(public_url_base):]
    return None # Or raise an error for invalid URL

# New endpoint to download student details as CSV
@app.post("/download-students-csv/")
async def download_students_csv(student_ids: list[str]):
    if not student_ids:
        raise HTTPException(status_code=400, detail="No student IDs provided")

    try:
        # Fetch student-specific data from students table
        student_response = supabase.table("students").select("id, year, department, gpa, skills, ats_score, has_internship, summary").in_("id", student_ids).execute()
        students_data = student_response.data

        if not students_data:
            # Return a response indicating no student data found, but still a valid CSV structure if needed
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["ID", "Full Name", "Year", "Department", "GPA", "Skills", "ATS Score", "Has Internship", "Summary", "Email"])
            output.seek(0)
            return StreamingResponse(output, media_type="text/csv", headers={'Content-Disposition': 'attachment; filename="students_details.csv"'})

        # Fetch full_name and email from profiles table
        profile_response = supabase.table("profiles").select("id, full_name, email").in_("id", student_ids).execute()
        profiles_data = profile_response.data if profile_response.data else []

        # Create a dictionary for easy lookup of full_names and emails by ID
        profile_info = {profile['id']: {"full_name": profile.get('full_name', ''), "email": profile.get('email', '')} for profile in profiles_data}

        # Prepare data for CSV
        output = io.StringIO()
        writer = csv.writer(output)

        # Write header row
        writer.writerow(["ID", "Full Name", "Year", "Department", "GPA", "Skills", "ATS Score", "Has Internship", "Summary", "Email"])

        # Write data rows, combining student data and profile info
        for student in students_data:
            student_id = student.get("id", "")
            writer.writerow([
                student_id,
                profile_info.get(student_id, {}).get("full_name", ""), # Get full_name from the profiles data
                student.get("year", ""),
                student.get("department", ""),
                student.get("gpa", ""),
                # Handle skills array/string
                ", ".join(student.get("skills", [])) if isinstance(student.get("skills"), list) else student.get("skills", ""),
                student.get("ats_score", ""),
                # Convert boolean to Yes/No or similar
                "Yes" if student.get("has_internship") else "No",
                student.get("summary", ""),
                profile_info.get(student_id, {}).get("email", ""), # Get email from the profiles data
            ])

        # Move to the beginning of the stream
        output.seek(0)

        # Return as StreamingResponse
        return StreamingResponse(output, 
            media_type="text/csv", 
            headers={'Content-Disposition': 'attachment; filename="students_details.csv"'}
        )

    except Exception as e:
        print("CSV download error:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate CSV: {e}")

# New endpoint to download resumes as a Zip file
@app.post("/download-resumes-zip/")
async def download_resumes_zip(student_ids: list[str]):
    if not student_ids:
        raise HTTPException(status_code=400, detail="No student IDs provided")

    # Use io.BytesIO for binary zip file
    zip_output = io.BytesIO()

    try:
        with zipfile.ZipFile(zip_output, 'w') as zf:
            for student_id in student_ids:
                # Fetch resume_url for each student
                response = supabase.table("students").select("resume_url").eq("id", student_id).single().execute()
                resume_url_data = response.data

                if resume_url_data and resume_url_data.get("resume_url"):
                    resume_url = resume_url_data["resume_url"]
                    file_path = get_file_path_from_supabase_url(resume_url)

                    if file_path:
                         try:
                            # Download the file content from Supabase Storage
                            # Assuming 'resumes' is your bucket name
                            # Correctly handle the return value which is bytes if successful, or raises exception
                            file_content = supabase.storage.from_('resumes').download(file_path)

                            # If download is successful, file_content is bytes
                            # Use a cleaner filename for the zip entry
                            file_name = os.path.basename(file_path) # Keep original file name
                            zf.writestr(f"{student_id}_{file_name}", file_content)

                         except Exception as download_err:
                            # Catch exceptions during download (e.g., file not found, permission issues)
                            print(f"Exception during download for {file_path}:", download_err)
                            zf.writestr(f"error_{student_id}.txt", f"Exception downloading resume for student ID {student_id}: {download_err}")

                    else:
                        print(f"Invalid resume URL for student {student_id}: {resume_url}")
                        zf.writestr(f"no_resume_{student_id}.txt", f"Invalid resume URL for student ID {student_id}: {resume_url}")

                else:
                    print(f"No resume URL found for student {student_id}")
                    zf.writestr(f"no_resume_{student_id}.txt", f"No resume URL found for student ID {student_id}")

        # Move to the beginning of the stream
        zip_output.seek(0)

        # Return as StreamingResponse
        return StreamingResponse(zip_output, 
            media_type="application/zip", 
            headers={'Content-Disposition': 'attachment; filename="students_resumes.zip"'}
        )

    except Exception as e:
        print("Zip download error:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate zip: {e}") 