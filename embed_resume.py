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

# Initialize Groq client with error handling
try:
    if GROQ_API_KEY:
        groq_client = Groq(api_key=GROQ_API_KEY)
        print("Groq client initialized successfully")
    else:
        groq_client = None
        print("GROQ_API_KEY not found, Groq client not initialized")
except Exception as e:
    print(f"Failed to initialize Groq client: {e}")
    groq_client = None

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

# Improved function for skill extraction
def extract_skills_from_text(text: str) -> list[str]:
    """
    Extracts a list of skills from the resume text using comprehensive keyword matching.
    """
    import re
    
    # Comprehensive list of skills to look for
    all_skills = [
        # Programming Languages
        "Python", "JavaScript", "Java", "C++", "C#", "TypeScript", "Go", "Rust", "Swift", "Kotlin",
        "PHP", "Ruby", "Scala", "R", "MATLAB", "Perl", "Shell", "Bash", "PowerShell",
        
        # Web Technologies
        "React", "Angular", "Vue.js", "Node.js", "Express", "Next.js", "Django", "Flask", 
        "Spring", "Laravel", "Rails", "jQuery", "HTML", "CSS", "SASS", "SCSS", "Bootstrap",
        "Tailwind", "Material-UI", "Chakra UI",
        
        # Databases
        "SQL", "MySQL", "PostgreSQL", "MongoDB", "SQLite", "Redis", "Cassandra", "DynamoDB",
        "Oracle", "SQL Server", "MariaDB", "Firebase", "ChromaDB",
        
        # Cloud & DevOps
        "AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "Jenkins", "CI/CD",
        "Terraform", "Ansible", "Chef", "Puppet", "Nginx", "Apache",
        
        # AI/ML & Data Science
        "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Scikit-learn", "Pandas",
        "NumPy", "Matplotlib", "Seaborn", "Jupyter", "OpenCV", "NLP", "Computer Vision",
        "Data Science", "Big Data", "Spark", "Hadoop", "Kafka", "Airflow", "MLflow",
        "Hugging Face", "Transformers", "BERT", "GPT", "LangChain", "LangGraph", "LLM",
        "Generative AI", "RAG", "Vector Search", "Embeddings", "Ollama", "Groq",
        
        # Mobile Development
        "React Native", "Flutter", "iOS", "Android", "Xamarin", "Ionic",
        
        # Tools & Technologies
        "Git", "GitHub", "GitLab", "Bitbucket", "VSCode", "IntelliJ", "Eclipse", "Vim",
        "Linux", "Unix", "Windows", "macOS", "Postman", "Swagger", "REST API", "GraphQL",
        "WebSocket", "gRPC", "Microservices", "Agile", "Scrum", "Jira", "Confluence",
        
        # Testing
        "Jest", "Cypress", "Selenium", "Junit", "PyTest", "Mocha", "Chai", "Enzyme",
        
        # Other
        "Blockchain", "Ethereum", "Solidity", "Unity", "Unreal Engine", "Figma", "Adobe",
        "Photoshop", "Illustrator", "Sketch", "Blender", "AutoCAD"
    ]
    
    found_skills = []
    text_lower = text.lower()
    
    for skill in all_skills:
        # Use word boundaries to avoid partial matches
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.append(skill)
    
    # Remove duplicates and return
    return list(set(found_skills))

# Improved function for extracting academic information
def extract_academic_info(text: str) -> dict:
    """
    Extracts CGPA, 10th marks, and 12th marks from resume text.
    """
    import re
    
    academic_info = {
        "cgpa": None,
        "tenth_percentage": None,
        "twelfth_percentage": None
    }
    
    # CGPA patterns
    cgpa_patterns = [
        r'cgpa[:\s]*(\d+\.?\d*)',
        r'gpa[:\s]*(\d+\.?\d*)',
        r'cumulative[:\s]*gpa[:\s]*(\d+\.?\d*)',
        r'overall[:\s]*gpa[:\s]*(\d+\.?\d*)'
    ]
    
    for pattern in cgpa_patterns:
        match = re.search(pattern, text.lower())
        if match:
            cgpa_value = float(match.group(1))
            # Validate CGPA range (typically 0-10 or 0-4)
            if 0 <= cgpa_value <= 10:
                academic_info["cgpa"] = cgpa_value
                break
    
    # 10th marks patterns
    tenth_patterns = [
        r'10th[:\s]*(\d+\.?\d*)%?',
        r'class\s*10[:\s]*(\d+\.?\d*)%?',
        r'sslc[:\s]*(\d+\.?\d*)%?',
        r'matriculation[:\s]*(\d+\.?\d*)%?'
    ]
    
    for pattern in tenth_patterns:
        match = re.search(pattern, text.lower())
        if match:
            tenth_value = float(match.group(1))
            # Validate percentage range
            if 0 <= tenth_value <= 100:
                academic_info["tenth_percentage"] = tenth_value
                break
    
    # 12th marks patterns
    twelfth_patterns = [
        r'12th[:\s]*(\d+\.?\d*)%?',
        r'class\s*12[:\s]*(\d+\.?\d*)%?',
        r'hsc[:\s]*(\d+\.?\d*)%?',
        r'intermediate[:\s]*(\d+\.?\d*)%?',
        r'higher\s*secondary[:\s]*(\d+\.?\d*)%?'
    ]
    
    for pattern in twelfth_patterns:
        match = re.search(pattern, text.lower())
        if match:
            twelfth_value = float(match.group(1))
            # Validate percentage range
            if 0 <= twelfth_value <= 100:
                academic_info["twelfth_percentage"] = twelfth_value
                break
    
    return academic_info

# Improved function for extracting projects
def extract_projects_from_text(text: str) -> list[str]:
    """
    Extracts project information from resume text.
    """
    import re
    
    projects = []
    
    # Look for project sections
    project_section_patterns = [
        r'projects?[:\s]*\n(.*?)(?=\n\s*[A-Z][^:\n]*:|$)',
        r'project\s*experience[:\s]*\n(.*?)(?=\n\s*[A-Z][^:\n]*:|$)',
        r'academic\s*projects?[:\s]*\n(.*?)(?=\n\s*[A-Z][^:\n]*:|$)'
    ]
    
    for pattern in project_section_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE | re.DOTALL)
        for match in matches:
            # Split by bullet points or line breaks
            project_lines = re.split(r'[•\-\*]\s*|(?:\n\s*)+', match.strip())
            for line in project_lines:
                line = line.strip()
                if len(line) > 20:  # Filter out short lines
                    projects.append(line)
    
    # If no structured project section found, look for project-like descriptions
    if not projects:
        # Look for lines that might be project descriptions
        project_keywords = ['built', 'developed', 'created', 'designed', 'implemented', 'application', 'system', 'platform', 'website', 'app']
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if any(keyword in line.lower() for keyword in project_keywords) and len(line) > 30:
                projects.append(line)
    
    return projects[:5]  # Return top 5 projects

# Improved function for extracting experience
def extract_experience_from_text(text: str) -> list[str]:
    """
    Extracts work experience from resume text.
    """
    import re
    
    experiences = []
    
    # Look for experience sections
    experience_section_patterns = [
        r'experience[:\s]*\n(.*?)(?=\n\s*[A-Z][^:\n]*:|$)',
        r'work\s*experience[:\s]*\n(.*?)(?=\n\s*[A-Z][^:\n]*:|$)',
        r'professional\s*experience[:\s]*\n(.*?)(?=\n\s*[A-Z][^:\n]*:|$)',
        r'employment[:\s]*\n(.*?)(?=\n\s*[A-Z][^:\n]*:|$)'
    ]
    
    for pattern in experience_section_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE | re.DOTALL)
        for match in matches:
            # Split by bullet points or line breaks
            exp_lines = re.split(r'[•\-\*]\s*|(?:\n\s*)+', match.strip())
            for line in exp_lines:
                line = line.strip()
                if len(line) > 20:  # Filter out short lines
                    experiences.append(line)
    
    # Look for job titles and companies
    if not experiences:
        job_patterns = [
            r'(intern|developer|engineer|analyst|manager|coordinator|assistant|associate|specialist|consultant|lead|senior|junior)\s+at\s+[A-Za-z\s]+',
            r'[A-Za-z\s]+\s+at\s+[A-Za-z\s]+\s*\([^)]*\d{4}[^)]*\)'
        ]
        
        for pattern in job_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            experiences.extend(matches)
    
    return experiences[:5]  # Return top 5 experiences

# Updated function for extracting experience data with has_internship
def extract_experience_data(text: str) -> dict:
    """
    Extracts experience data, including internship status, from the resume text.
    """
    has_internship = "internship" in text.lower() or "intern" in text.lower()
    experience_entries = extract_experience_from_text(text)
    
    return {
        "has_internship": has_internship, 
        "experience_entries": experience_entries
    }

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
    # Validate input text
    if not text or not text.strip():
        print("Warning: Empty text provided for embedding")
        return []  # Return empty list instead of None
    
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": text.strip()
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:  # Add timeout
            response = await client.post(OLLAMA_URL, json=payload)
            response.raise_for_status()
            data = response.json()
            
            # Validate embedding response
            embedding = data.get("embedding", [])
            if not embedding or len(embedding) == 0:
                print(f"Warning: Empty embedding returned for text: {text[:100]}...")
                return []
            
            print(f"Generated embedding with {len(embedding)} dimensions")
            return embedding
    except Exception as e:
        print("Embedding error:", e)
        traceback.print_exc()
        return []  # Return empty list instead of raising

async def generate_summary(text: str) -> str:
    if not GROQ_API_KEY or GROQ_API_KEY.strip() == "" or groq_client is None:
        print("GROQ_API_KEY not set, empty, or Groq client not initialized. Skipping summary generation.")
        return ""
    
    if not text or not text.strip():
        print("Empty text provided for summary generation.")
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
                    "content": text.strip(),
                },
            ],
            model="llama3-8b-8192", # Or choose another Groq model
            temperature=0.7,
            max_tokens=500, # Adjust as needed
        )
        summary = chat_completion.choices[0].message.content or ""
        print(f"Generated summary: {len(summary)} characters")
        return summary
    except Exception as e:
        print("Groq summarization error:", e)
        traceback.print_exc()
        # Return empty string instead of raising to continue processing
        return ""

# New endpoint to test Groq connection
@app.get("/test-groq/")
async def test_groq():
    try:
        if not GROQ_API_KEY or GROQ_API_KEY.strip() == "":
            return JSONResponse({
                "status": "error",
                "error": "GROQ_API_KEY not set or empty"
            }, status_code=400)
        
        test_text = "This is a test resume. John is a software engineer with 5 years of experience in Python and JavaScript."
        summary = await generate_summary(test_text)
        
        return JSONResponse({
            "status": "success",
            "api_key_set": bool(GROQ_API_KEY),
            "api_key_preview": f"{GROQ_API_KEY[:10]}..." if GROQ_API_KEY else "None",
            "summary_generated": bool(summary),
            "summary_length": len(summary) if summary else 0,
            "summary_preview": summary[:100] + "..." if summary and len(summary) > 100 else summary
        })
    except Exception as e:
        return JSONResponse({
            "status": "error",
            "api_key_set": bool(GROQ_API_KEY),
            "error": str(e)
        }, status_code=500)

# New endpoint to test Ollama connection
@app.get("/test-ollama/")
async def test_ollama():
    try:
        test_text = "This is a test sentence for embedding generation."
        embedding = await get_embedding(test_text)
        
        return JSONResponse({
            "status": "success",
            "ollama_url": OLLAMA_URL,
            "model": OLLAMA_MODEL,
            "embedding_dim": len(embedding) if embedding else 0,
            "embedding_preview": embedding[:5] if embedding and len(embedding) >= 5 else embedding
        })
    except Exception as e:
        return JSONResponse({
            "status": "error",
            "ollama_url": OLLAMA_URL,
            "model": OLLAMA_MODEL,
            "error": str(e)
        }, status_code=500)

@app.post("/embed-resume/")
async def embed_resume(
    student_id: str = Form(...),
    file: UploadFile = File(...)
):
    print(f"Processing resume for student: {student_id}")
    print(f"File name: {file.filename}, Content type: {file.content_type}")
    
    # 1. Read PDF in-memory
    try:
        file_bytes = await file.read()
        text = extract_text_from_pdf(file_bytes)
        if not text.strip():
            print("No text found in PDF.")
            return JSONResponse({"status": "error", "step": "pdf_extraction", "detail": "No text found in PDF."}, status_code=400)
        print(f"Extracted text length: {len(text)} characters")
        print(f"Text preview: {text[:200]}...")
    except Exception as e:
        print("PDF extraction failed:", e)
        return JSONResponse({"status": "error", "step": "pdf_extraction", "detail": str(e)}, status_code=500)

    # 2. Get embedding from Ollama
    try:
        embedding = await get_embedding(text)
        if not embedding or len(embedding) == 0:
            print("Warning: No embedding generated, using placeholder")
            # Create a placeholder embedding with required dimensions (typically 1024 for bge-m3)
            embedding = [0.0] * 1024  # Adjust dimension based on your model
    except Exception as e:
        print("Embedding failed:", e)
        # Use placeholder embedding instead of failing
        embedding = [0.0] * 1024
        # Don't return error, continue processing

    # 3. Generate summary using Groq
    summary = await generate_summary(text)

    # 4. Extract skills from text
    try:
        skills = extract_skills_from_text(text)
        print(f"Extracted skills: {skills}")
    except Exception as e:
        print("Skill extraction failed:", e)
        skills = []

    # 5. Extract academic information (CGPA, 10th, 12th marks)
    try:
        academic_info = extract_academic_info(text)
        print(f"Extracted academic info: {academic_info}")
    except Exception as e:
        print("Academic info extraction failed:", e)
        academic_info = {"cgpa": None, "tenth_percentage": None, "twelfth_percentage": None}

    # 6. Extract projects
    try:
        projects = extract_projects_from_text(text)
        print(f"Extracted projects: {projects}")
    except Exception as e:
        print("Project extraction failed:", e)
        projects = []

    # 7. Extract experience data
    try:
        experience_data = extract_experience_data(text)
        has_internship = experience_data.get("has_internship", False)
        experience_entries = experience_data.get("experience_entries", [])
        print(f"Extracted experience data: {experience_data}")
    except Exception as e:
        print("Experience extraction failed:", e)
        has_internship = False
        experience_entries = []

    # 8. Calculate ATS score
    try:
        ats_score = calculate_ats_score(text)
        print(f"Calculated ATS score: {ats_score}")
    except Exception as e:
        print("ATS score calculation failed:", e)
        ats_score = 0

    # 9. Store all extracted data in Supabase
    try:
        update_data = {
            "resume_embeddings": embedding,
            "summary": summary,
            "skills": skills,
            "projects": projects,
            "experience": experience_entries,
            "has_internship": has_internship,
            "ats_score": ats_score,
        }
        
        # Add academic information if available
        if academic_info.get("cgpa") is not None:
            update_data["gpa"] = str(academic_info["cgpa"])
        if academic_info.get("tenth_percentage") is not None:
            update_data["tenth_percentage"] = academic_info["tenth_percentage"]
        if academic_info.get("twelfth_percentage") is not None:
            update_data["twelfth_percentage"] = academic_info["twelfth_percentage"]

        response = supabase.table("students").update(
            update_data
        ).eq("id", student_id).execute()

        if response.data is None or (isinstance(response.data, list) and len(response.data) == 0):
            print("Supabase update likely failed or target student not found.", response)
            return JSONResponse({"status": "error", "step": "supabase_update", "detail": "Supabase update failed or student ID not found."}, status_code=500)

    except Exception as e:
        print("Supabase update failed:", e)
        traceback.print_exc()
        return JSONResponse({"status": "error", "step": "supabase_update", "detail": str(e)}, status_code=500)

    # 2. Get embedding for the SUMMARY from Ollama (only if summary exists)
    try:
        if summary and summary.strip():
            summary_embedding = await get_embedding(summary)
            if not summary_embedding or len(summary_embedding) == 0:
                print("Warning: No summary embedding generated, using placeholder")
                summary_embedding = [0.0] * 1024
        else:
            print("No summary to embed, using placeholder")
            summary_embedding = [0.0] * 1024
    except Exception as e:
        print("Summary Embedding failed:", e)
        summary_embedding = [0.0] * 1024
        # Don't return error, continue processing

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

    return JSONResponse({
        "status": "success",
        "data_extracted": {
            "skills": skills,
            "projects": projects,
            "experience": experience_entries,
            "has_internship": has_internship,
            "cgpa": academic_info.get("cgpa"),
            "tenth_percentage": academic_info.get("tenth_percentage"),
            "twelfth_percentage": academic_info.get("twelfth_percentage"),
            "ats_score": ats_score
        },
        "embedding_dim": len(embedding), 
        "summary_generated": bool(summary),
        "embedding_is_placeholder": all(x == 0.0 for x in embedding) if embedding else True,
        "summary_embedding_is_placeholder": all(x == 0.0 for x in summary_embedding) if summary_embedding else True
    })

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

# New endpoint to debug what's stored in the database
@app.get("/debug-student/{student_id}")
async def debug_student_data(student_id: str):
    try:
        response = supabase.table("students").select("*").eq("id", student_id).execute()
        if response.data:
            return {"status": "success", "data": response.data[0]}
        else:
            return {"status": "error", "message": "Student not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# New endpoint to list all students for debugging
@app.get("/debug-students")
async def debug_all_students():
    try:
        response = supabase.table('students').select('*').execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

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