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
import re
from typing import Dict, List, Optional, Union
import json

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
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

OLLAMA_URL = "http://localhost:11434/api/embeddings"
OLLAMA_MODEL = "bge-m3:latest"

#GROQ_API_URL = "https://api.groq.com/v1/embeddings"
GROQ_API_KEY = os.environ.get("GROQ_API_KEY") # It's safer to use environment variables

# Initialize Groq client with error handling
try:
    if GROQ_API_KEY:
        # Temporarily disable Groq to avoid proxies error
        groq_client = None
        print("Groq client temporarily disabled due to proxies error")
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
    
    project_block = ""
    for pattern in project_section_patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            project_block = match.group(1).strip()
            break
            
    if project_block:
        lines = project_block.split('\n')
        current_project = []
        
        # bullet_pattern = r'^[\s]*[•\-\*–]' # Regex for checking if line is a bullet
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            is_bullet = line.startswith(('•', '-', '*', '–')) or re.match(r'^[\s]*[•\-\*–]', line)
            
            if is_bullet:
                # Append to current project
                current_project.append(line)
            else:
                # Not a bullet. 
                # If we have a current project and the LAST line we added was a bullet,
                # then this new non-bullet line is likely a NEW project name.
                # If the last line was NOT a bullet (i.e., it was a title/text), then this might be a 
                # multi-line title or continuation of description text.
                
                # Check if we should start a new project
                should_start_new = False
                if current_project:
                    last_line = current_project[-1]
                    last_was_bullet = last_line.startswith(('•', '-', '*', '–')) or re.match(r'^[\s]*[•\-\*–]', last_line)
                    if last_was_bullet:
                        should_start_new = True
                
                if should_start_new:
                    # Save current project
                    projects.append("\n".join(current_project))
                    current_project = [line]
                else:
                    # Continue current project (or start first one)
                    current_project.append(line)
                    
        # Append the last project
        if current_project:
            projects.append("\n".join(current_project))

    # If parsing failed or returned nothing, fall back to simple keyword search
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

# Job Description Extraction Functions for Recruiters
def extract_required_skills_from_job_desc(description: str) -> List[str]:
    """
    Extract required skills from job description text using regex patterns
    """
    skills = []
    description_lower = description.lower()
    
    # Common technical skills patterns
    technical_skills = {
        'programming_languages': [
            'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'php', 'ruby', 'go', 'rust',
            'kotlin', 'swift', 'scala', 'r', 'matlab', 'perl', 'shell scripting', 'bash'
        ],
        'web_technologies': [
            'html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask',
            'spring boot', 'asp.net', 'laravel', 'codeigniter', 'jquery', 'bootstrap', 'sass', 'less'
        ],
        'databases': [
            'mysql', 'postgresql', 'mongodb', 'sqlite', 'redis', 'oracle', 'sql server', 'dynamodb',
            'cassandra', 'elasticsearch', 'neo4j', 'mariadb'
        ],
        'cloud_platforms': [
            'aws', 'azure', 'google cloud', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab ci/cd',
            'terraform', 'ansible', 'vagrant', 'heroku', 'digitalocean'
        ],
        'ai_ml': [
            'machine learning', 'deep learning', 'artificial intelligence', 'tensorflow', 'pytorch',
            'scikit-learn', 'pandas', 'numpy', 'opencv', 'nltk', 'spacy', 'keras', 'xgboost'
        ],
        'tools': [
            'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'slack', 'teams',
            'visual studio code', 'intellij', 'eclipse', 'postman', 'swagger'
        ],
        'mobile': [
            'android', 'ios', 'react native', 'flutter', 'xamarin', 'ionic', 'cordova'
        ]
    }
    
    # Search for skills in the description
    for category, skill_list in technical_skills.items():
        for skill in skill_list:
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, description_lower):
                skills.append(skill.title())
    
    # Look for experience patterns (e.g., "2+ years of Python", "experience in Java")  
    experience_patterns = [
        r'(?:experience (?:in|with)|knowledge of|proficiency in|familiar with|expertise in)\s+([a-zA-Z\s,/+.-]+?)(?:\s+(?:is|and|or|\.|,|;|required|preferred|desired|essential))',
        r'(?:must know|should know|required:?|skills:?)\s*([a-zA-Z\s,/+.-]+?)(?:\.|,|;|$)',
        r'(?:technologies?|tools?|frameworks?):?\s*([a-zA-Z\s,/+.-]+?)(?:\.|,|;|$)'
    ]
    
    # Common technical terms to filter out
    filter_terms = [
        'years of', 'experience', 'required', 'preferred', 'must have', 'should have',
        'knowledge of', 'familiar with', 'expertise in', 'proficiency in', 'data scientist role for',
        'cloud platforms like aws', 'software engineer', 'full stack developer'
    ]
    
    for pattern in experience_patterns:
        matches = re.finditer(pattern, description_lower, re.IGNORECASE)
        for match in matches:
            skill_text = match.group(1).strip()
            # Split by common delimiters and clean up
            skill_candidates = re.split(r'[,/&+\n]', skill_text)
            for candidate in skill_candidates:
                candidate = candidate.strip().title()
                # Filter out non-technical terms and common phrases
                if (len(candidate) > 2 and len(candidate) < 30 and 
                    candidate not in skills and 
                    candidate.lower() not in filter_terms and
                    not any(term in candidate.lower() for term in filter_terms)):
                    skills.append(candidate)
    
    # Remove duplicates and return first 10 most relevant skills
    unique_skills = list(dict.fromkeys(skills))[:10]
    return unique_skills

def extract_eligibility_criteria_from_job_desc(description: str) -> Dict[str, Union[str, List[str], int]]:
    """
    Extract eligibility criteria from job description
    """
    criteria = {
        'education': [],
        'experience_years': 0,
        'cgpa_minimum': 0.0,
        'specific_requirements': []
    }
    
    description_lower = description.lower()
    
    # Extract education requirements - improved patterns
    education_patterns = [
        r'\b(?:bachelor(?:\'?s)?|b\.?tech|b\.?e\.?|b\.?sc|bca)\b',
        r'\b(?:master(?:\'?s)?|m\.?tech|m\.?e\.?|m\.?sc|mca)\b',
        r'\b(?:phd|doctorate|doctoral)\b',
        r'\b(?:computer science|information technology|software engineering)\b',
        r'\b(?:electronics|electrical|mechanical|civil) engineering\b',
        r'\b(?:engineering|technology|science) degree\b'
    ]
    
    for pattern in education_patterns:
        matches = re.findall(pattern, description_lower, re.IGNORECASE)
        for match in matches:
            # Clean up the match
            cleaned_match = match.strip()
            if len(cleaned_match) > 2 and cleaned_match not in criteria['education']:
                # Convert common abbreviations to full forms
                if cleaned_match in ['b.tech', 'btech']:
                    cleaned_match = 'B.Tech'
                elif cleaned_match in ['b.e', 'be']:
                    cleaned_match = 'B.E'
                elif cleaned_match in ['b.sc', 'bsc']:
                    cleaned_match = 'B.Sc'
                elif cleaned_match in ['m.tech', 'mtech']:
                    cleaned_match = 'M.Tech'
                elif cleaned_match in ['m.e', 'me']:
                    cleaned_match = 'M.E'
                elif cleaned_match == 'bachelor' or cleaned_match == "bachelor's":
                    cleaned_match = "Bachelor's Degree"
                elif cleaned_match == 'master' or cleaned_match == "master's":
                    cleaned_match = "Master's Degree"
                else:
                    cleaned_match = cleaned_match.title()
                
                criteria['education'].append(cleaned_match)
    
    # Extract experience requirements
    exp_patterns = [
        r'(\d+)[\s]*(?:\+|plus)?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)',
        r'(?:minimum|atleast|at least)\s*(\d+)\s*(?:years?|yrs?)',
        r'(\d+)[-–]\d+\s*(?:years?|yrs?)'
    ]
    
    for pattern in exp_patterns:
        matches = re.findall(pattern, description_lower)
        if matches:
            try:
                years = max([int(match) for match in matches])
                criteria['experience_years'] = years
            except ValueError:
                pass
    
    # Extract CGPA/GPA requirements
    cgpa_patterns = [
        r'(?:cgpa|gpa)\s*(?:of|above|minimum|atleast|at least)?\s*(\d+\.?\d*)',
        r'(?:minimum|atleast|at least)\s*(\d+\.?\d*)\s*(?:cgpa|gpa)',
        r'grade\s*(?:of|above|minimum)?\s*([a-zA-Z]+)',
        r'(\d+)\.?\d*\s*(?:cgpa|gpa|grade)'
    ]
    
    for pattern in cgpa_patterns:
        matches = re.findall(pattern, description_lower)
        if matches:
            try:
                # Handle both numeric and letter grades
                for match in matches:
                    if match.replace('.', '').isdigit():
                        cgpa = float(match)
                        if cgpa <= 10:  # Assuming 10-point scale
                            criteria['cgpa_minimum'] = max(criteria['cgpa_minimum'], cgpa)
                    elif match.upper() in ['A', 'B', 'C']:
                        # Convert letter grades to approximate CGPA
                        grade_map = {'A': 8.0, 'B': 7.0, 'C': 6.0}
                        criteria['cgpa_minimum'] = max(criteria['cgpa_minimum'], grade_map.get(match.upper(), 0))
            except ValueError:
                pass
    
    # Extract other specific requirements
    requirement_patterns = [
        r'(?:must have|should have|required:?|mandatory:?)\s*([^.!?]+)',
        r'(?:preferred|desirable|good to have):?\s*([^.!?]+)',
        r'(?:certification|certified) in\s+([^.!?]+)'
    ]
    
    for pattern in requirement_patterns:
        matches = re.findall(pattern, description_lower, re.IGNORECASE)
        for match in matches:
            req = match.strip()
            if len(req) > 5 and len(req) < 100:
                criteria['specific_requirements'].append(req.capitalize())
    
    return criteria

def extract_eligible_years_from_job_desc(description: str) -> List[int]:
    """
    Extract eligible academic years from job description
    """
    eligible_years = []
    description_lower = description.lower()
    
    # Patterns for academic year requirements
    year_patterns = [
        r'(?:final year|4th year|fourth year)',
        r'(?:3rd year|third year)',
        r'(?:2nd year|second year)', 
        r'(?:1st year|first year)',
        r'(?:freshers?|fresher)',
        r'(?:graduates?|passed out)',
        r'year\s*(?:students?|candidates?)',
        r'(?:be|btech|b\.tech)\s*(?:final|3rd|4th|third|fourth)',
        r'(?:2024|2023|2022|2021)\s*(?:pass out|graduate|batch)'
    ]
    
    year_mapping = {
        'final year': [4],
        '4th year': [4],
        'fourth year': [4],
        '3rd year': [3],
        'third year': [3],
        '2nd year': [2],
        'second year': [2],
        '1st year': [1],
        'first year': [1],
        'freshers': [4],  # Assuming freshers are final year or recent graduates
        'fresher': [4],
        'graduates': [4],
        'passed out': [4]
    }
    
    for pattern in year_patterns:
        if re.search(pattern, description_lower):
            for key, years in year_mapping.items():
                if key in pattern or pattern in key:
                    eligible_years.extend(years)
                    break
    
    # If no specific year mentioned, assume all years are eligible
    if not eligible_years:
        eligible_years = [1, 2, 3, 4]
    
    # Remove duplicates and sort
    return sorted(list(set(eligible_years)))

def extract_job_info_from_description(description: str) -> Dict:
    """
    Main function to extract all job information from description
    """
    return {
        'required_skills': extract_required_skills_from_job_desc(description),
        'eligibility_criteria': extract_eligibility_criteria_from_job_desc(description),
        'eligible_years': extract_eligible_years_from_job_desc(description)
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


@app.post("/session-llm-suggestions")
async def session_llm_suggestions(request: Request):
    """
    Generate a concise LLM suggestion for a hiring session given:
    - session_id
    - required_skills (list)
    - student_skills (list)
    - description (string)
    - instructions (optional string)

    The endpoint will attempt to call Groq if configured; otherwise it falls back
    to a small heuristic generator. The final suggestion string is stored under
    the session's `requirements.llm_suggestion` key in the `hiring_sessions` table.
    """
    try:
        payload = await request.json()
    except Exception as e:
        return JSONResponse({"status": "error", "message": "Invalid JSON"}, status_code=400)

    session_id = payload.get('session_id')
    required_skills = payload.get('required_skills', []) or []
    student_skills = payload.get('student_skills', []) or []
    description = payload.get('description', '') or ''
    instructions = payload.get('instructions', '') or (
        "Provide 2 short bullets: 1) Improvements the student should make; 2) What to focus on now. "
        "Keep it very short, direct, and avoid filler words like 'here' or 'absolutely'."
    )

    if not session_id:
        return JSONResponse({"status": "error", "message": "session_id is required"}, status_code=400)

    # Build messages for Groq (if available)
    system_msg = (
        "You are an expert career coach. Produce exactly 2 very short bullet points. "
        "1) Improvements the student should make; 2) What to focus on now. Be direct and concise. "
        "Avoid any filler or lead-in phrases. Return plain text with one bullet per line."
    )

    user_parts = [f"Job description: {description}" if description else "",
                  f"Required skills: {', '.join(required_skills)}" if required_skills else "",
                  f"Student skills: {', '.join(student_skills)}" if student_skills else "",
                  f"Extra instructions: {instructions}"]

    user_msg = "\n\n".join([p for p in user_parts if p])

    suggestion_text = ""

    # Try Groq if client available
    try:
        if GROQ_API_KEY and groq_client is not None:
            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": user_msg},
                ],
                model="llama3-8b-8192",
                temperature=0.0,
                max_tokens=200,
            )
            suggestion_text = (chat_completion.choices[0].message.content or "").strip()
        else:
            # Fallback: generate a very short, deterministic suggestion using missing skills
            missing = []
            try:
                student_lower = [s.lower().strip() for s in (student_skills or [])]
                for rs in (required_skills or []):
                    if isinstance(rs, str) and rs.lower().strip() not in student_lower:
                        missing.append(rs)
            except Exception:
                missing = []

            if missing:
                top_missing = missing[:4]
                suggestion_text = f"- Improvements: Learn {', '.join(top_missing)}.\n- Focus: Build 1 project showing {top_missing[0]}."
            else:
                suggestion_text = "- Improvements: Strengthen projects and examples for required skills.\n- Focus: Add one focused project that highlights core technologies."
    except Exception as e:
        print(f"LLM call failed: {e}")
        traceback.print_exc()
        # Provide fallback suggestion
        suggestion_text = "- Improvements: Improve project examples and emphasize required skills.\n- Focus: Build a concise project showcasing core skills."

    # Persist suggestion into hiring_sessions.requirements.llm_suggestion
    try:
        # Fetch existing requirements
        resp = supabase.table('hiring_sessions').select('requirements').eq('id', session_id).execute()
        existing_req = None
        if resp and getattr(resp, 'data', None):
            # response.data is usually a list
            data = resp.data
            if isinstance(data, list) and len(data) > 0:
                existing_req = data[0].get('requirements') or {}
            elif isinstance(data, dict):
                existing_req = data.get('requirements') or {}

        if existing_req is None:
            existing_req = {}

        # Attach the suggestion (store as plain string)
        existing_req['llm_suggestion'] = suggestion_text

        update_resp = supabase.table('hiring_sessions').update({
            'requirements': existing_req
        }).eq('id', session_id).execute()

        # If update failed, log but still return suggestion
        if update_resp is None or getattr(update_resp, 'data', None) is None:
            print('Warning: failed to store LLM suggestion in DB for session', session_id)

    except Exception as e:
        print('Error storing LLM suggestion in DB:', e)
        traceback.print_exc()

    return JSONResponse({"status": "success", "suggestion": suggestion_text})

@app.post("/extract-resume-for-builder/")
async def extract_resume_for_builder(
    student_id: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Extract resume data and format it specifically for the Resume Builder.
    Returns structured JSON that can be directly used in the Resume Builder template.
    """
    print(f"Extracting resume for builder - Student: {student_id}")
    print(f"File: {file.filename}")
    
    try:
        # 1. Read PDF
        file_bytes = await file.read()
        text = extract_text_from_pdf(file_bytes)
        
        if not text.strip():
            return JSONResponse({
                "status": "error",
                "message": "No text found in PDF"
            }, status_code=400)
        
        print(f"Extracted text: {len(text)} characters")
        
        # 2. Extract all information
        skills = extract_skills_from_text(text)
        projects_raw = extract_projects_from_text(text)
        experience_raw = extract_experience_from_text(text)
        academic_info = extract_academic_info(text)
        
        # 3. Extract personal information using regex patterns
        personal_info = extract_personal_info_from_text(text)
        
        # 4. Extract education details
        education_details = extract_education_details(text)
        
        # 5. Format projects for resume builder
        projects = []
        for proj_text in projects_raw[:5]:  # Top 5 projects
            project_data = parse_project_text(proj_text)
            projects.append(project_data)
        
        # 6. Format experience for resume builder
        experiences = []
        for exp_text in experience_raw[:5]:  # Top 5 experiences
            exp_data = parse_experience_text(exp_text)
            experiences.append(exp_data)
        
        # 7. Extract certifications/achievements
        certifications = extract_certifications_from_text(text)
        
        # 8. Extract summary
        summary = extract_summary_from_text(text)
        
        # 9. Structure the data for Resume Builder
        resume_builder_data = {
            "personal": {
                "fullName": personal_info.get("name", ""),
                "email": personal_info.get("email", ""),
                "phone": personal_info.get("phone", ""),
                "address": personal_info.get("address", ""),
                "linkedin": personal_info.get("linkedin", ""),
                "github": personal_info.get("github", ""),
                "leetcode": personal_info.get("leetcode", "")
            },
            "education": education_details if education_details else [{
                "degree": "",
                "institution": "",
                "department": "",
                "year": "",
                "cgpa": str(academic_info.get("cgpa", "")) if academic_info.get("cgpa") else ""
            }],
            "skills": skills if skills else [""],
            "experience": experiences if experiences else [{
                "jobTitle": "",
                "company": "",
                "duration": "",
                "description": ""
            }],
            "projects": projects if projects else [{
                "title": "",
                "description": "",
                "technologies": "",
                "link": ""
            }],
            "achievements": certifications if certifications else [{
                "title": "",
                "description": "",
                "date": ""
            }],
            "extracurricular": [{
                "role": "",
                "organization": "",
                "duration": "",
                "description": ""
            }],  # Default empty structure matching Resume Builder format
            "summary": summary
        }
        
        # 10. Store in Supabase for persistence
        try:
            # Store the structured resume data
            update_data = {
                "resume_form_data": resume_builder_data,  # Changed from resume_builder_data to resume_form_data
                "skills": skills,
                "projects": [p["title"] for p in projects if p.get("title")],
                "experience": [e["jobTitle"] for e in experiences if e.get("jobTitle")],
                "summary": summary
            }
            
            if academic_info.get("cgpa"):
                update_data["gpa"] = str(academic_info["cgpa"])
            if academic_info.get("tenth_percentage"):
                update_data["tenth_percentage"] = academic_info["tenth_percentage"]
            if academic_info.get("twelfth_percentage"):
                update_data["twelfth_percentage"] = academic_info["twelfth_percentage"]
            
            # Persist extracted profile URLs if present
            if personal_info.get("linkedin"):
                val = personal_info.get("linkedin")
                if val and not val.startswith("http"):
                    val = f"https://{val}"
                update_data["linkedin_url"] = val
            if personal_info.get("github"):
                val = personal_info.get("github")
                if val and not val.startswith("http"):
                    val = f"https://{val}"
                update_data["github_url"] = val
            if personal_info.get("leetcode"):
                val = personal_info.get("leetcode")
                if val and not val.startswith("http"):
                    val = f"https://{val}"
                update_data["leetcode_url"] = val
            
            supabase.table("students").update(update_data).eq("id", student_id).execute()
            print("✅ Stored resume form data in Supabase (resume_form_data column)")
            
        except Exception as db_error:
            print(f"⚠️ Database storage failed: {db_error}")
            # Continue even if database fails
        
        return JSONResponse({
            "status": "success",
            "message": "Resume extracted successfully",
            "resume_data": resume_builder_data,
            "extraction_stats": {
                "skills_found": len(skills),
                "projects_found": len(projects),
                "experiences_found": len(experiences),
                "certifications_found": len(certifications),
                "has_personal_info": bool(personal_info.get("name") or personal_info.get("email")),
                "has_education": bool(education_details),
                "has_summary": bool(summary)
            }
        })
        
    except Exception as e:
        print(f"❌ Resume extraction failed: {e}")
        traceback.print_exc()
        return JSONResponse({
            "status": "error",
            "message": f"Failed to extract resume: {str(e)}"
        }, status_code=500)


def extract_personal_info_from_text(text: str) -> dict:
    """Extract personal information like name, email, phone, etc."""
    info = {}
    
    # Extract email
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text)
    if emails:
        info["email"] = emails[0]
    
    # Extract phone
    phone_patterns = [
        r'\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
        r'\d{10}',
        r'\+91[-.\s]?\d{10}'
    ]
    for pattern in phone_patterns:
        phones = re.findall(pattern, text)
        if phones:
            info["phone"] = phones[0]
            break
    
    # Extract LinkedIn
    linkedin_pattern = r'linkedin\.com/in/[\w-]+'
    linkedin = re.search(linkedin_pattern, text.lower())
    if linkedin:
        info["linkedin"] = linkedin.group()
    
    # Extract GitHub
    github_pattern = r'github\.com/[\w-]+'
    github = re.search(github_pattern, text.lower())
    if github:
        info["github"] = github.group()

    # Extract LeetCode profile (common patterns: leetcode.com/u/<user> or leetcode.com/<user>)
    leetcode_pattern = r'leetcode\.com\/(?:u\/)?[\w\-]+'
    leetcode = re.search(leetcode_pattern, text.lower())
    if leetcode:
        info["leetcode"] = leetcode.group()
    
    # Extract name (usually in first few lines, capitalized)
    lines = text.split('\n')[:10]
    for line in lines:
        line = line.strip()
        # Name is typically 2-4 words, capitalized, at the top
        if len(line.split()) >= 2 and len(line.split()) <= 4:
            if line[0].isupper() and not any(char.isdigit() for char in line):
                if len(line) > 5 and len(line) < 50:
                    info["name"] = line
                    break
    
    # Extract address (look for city, state patterns)
    address_patterns = [
        r'[A-Za-z\s]+,\s*[A-Za-z\s]+\s*-?\s*\d{6}',
        r'[A-Za-z\s]+,\s*[A-Za-z\s]+\s+\d{5,6}'
    ]
    for pattern in address_patterns:
        addresses = re.findall(pattern, text)
        if addresses:
            info["address"] = addresses[0]
            break
    
    return info


def extract_education_details(text: str) -> list:
    """Extract detailed education information"""
    education_list = []
    
    # Look for education section
    education_section_pattern = r'(?i)education[:\s]*\n(.*?)(?=\n\s*[A-Z][^:\n]*:|$)'
    matches = re.findall(education_section_pattern, text, re.DOTALL)
    
    if matches:
        education_text = matches[0]
        
        # Extract degree patterns
        degree_patterns = [
            r'(B\.?Tech|Bachelor|B\.?E\.?|B\.?Sc|BCA|MCA|M\.?Tech|Master|M\.?E\.?|M\.?Sc)\s+(?:in\s+)?([A-Za-z\s]+?)(?:\s+from\s+|\s+at\s+|\s+-\s+)([A-Za-z\s,\.]+?)(?:\s+\(?(\d{4})[^\d])',
            r'([A-Za-z\s\.]+?)\s+(?:from|at)\s+([A-Za-z\s,\.]+?)\s+\(?(\d{4})'
        ]
        
        for pattern in degree_patterns:
            degree_matches = re.findall(pattern, education_text, re.IGNORECASE)
            for match in degree_matches:
                if len(match) >= 3:
                    edu = {
                        "degree": match[0].strip() if len(match) > 0 else "",
                        "department": match[1].strip() if len(match) > 1 else "",
                        "institution": match[2].strip() if len(match) > 2 else "",
                        "year": match[3].strip() if len(match) > 3 else "",
                        "cgpa": ""
                    }
                    
                    # Try to find CGPA near this education entry
                    cgpa_pattern = r'(?:cgpa|gpa)[:\s]*(\d+\.?\d*)'
                    cgpa_match = re.search(cgpa_pattern, education_text[max(0, education_text.find(match[0])-100):education_text.find(match[0])+200], re.IGNORECASE)
                    if cgpa_match:
                        edu["cgpa"] = cgpa_match.group(1)
                    
                    education_list.append(edu)
    
    return education_list[:3]  # Return top 3 education entries


def parse_project_text(project_text: str) -> dict:
    """Parse project text into structured format"""
    project = {
        "title": "",
        "description": "",
        "technologies": "",
        "link": ""
    }
    
    # Extract title (usually first line or before colon)
    lines = project_text.split('\n')
    if lines:
        first_line = lines[0].strip()
        # Title is usually before colon or dash
        if ':' in first_line:
            project["title"] = first_line.split(':')[0].strip()
            project["description"] = first_line.split(':', 1)[1].strip()
        elif '-' in first_line and len(first_line.split('-')[0]) < 50:
            project["title"] = first_line.split('-')[0].strip()
            project["description"] = first_line.split('-', 1)[1].strip()
        else:
            # Take first 50 chars as title
            project["title"] = first_line[:50]
            project["description"] = project_text
    
    # Extract technologies (look for tech keywords in brackets or after "using")
    tech_pattern = r'\[(.*?)\]|(?:using|technologies?:?)\s*([A-Za-z\s,/+.-]+?)(?:\.|$)'
    tech_matches = re.findall(tech_pattern, project_text, re.IGNORECASE)
    if tech_matches:
        techs = []
        for match in tech_matches:
            tech = match[0] if match[0] else match[1]
            if tech:
                techs.append(tech.strip())
        project["technologies"] = ", ".join(techs)
    
    # Extract link (URL pattern)
    url_pattern = r'https?://[^\s]+'
    urls = re.findall(url_pattern, project_text)
    if urls:
        project["link"] = urls[0]
    
    # Clean up description
    if not project["description"]:
        project["description"] = project_text.strip()
    
    return project


def parse_experience_text(exp_text: str) -> dict:
    """Parse experience text into structured format"""
    experience = {
        "jobTitle": "",
        "company": "",
        "duration": "",
        "description": ""
    }
    
    # Extract job title and company (pattern: "Job Title at Company")
    at_pattern = r'([A-Za-z\s]+?)\s+at\s+([A-Za-z\s&\.]+?)(?:\s*[\(,]|\s*$)'
    at_match = re.search(at_pattern, exp_text, re.IGNORECASE)
    
    if at_match:
        experience["jobTitle"] = at_match.group(1).strip()
        experience["company"] = at_match.group(2).strip()
    
    # Extract duration (date patterns)
    duration_patterns = [
        r'(\d{4}\s*-\s*\d{4})',
        r'(\d{4}\s*-\s*Present)',
        r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*-\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})',
        r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*-\s*Present)',
        r'\(([^)]*\d{4}[^)]*)\)'
    ]
    
    for pattern in duration_patterns:
        duration_match = re.search(pattern, exp_text, re.IGNORECASE)
        if duration_match:
            experience["duration"] = duration_match.group(1).strip()
            break
    
    # Description is the full text
    experience["description"] = exp_text.strip()
    
    return experience


def extract_certifications_from_text(text: str) -> list:
    """Extract certifications and achievements"""
    certifications = []
    
    # Look for certification section
    cert_patterns = [
        r'(?i)(?:certifications?|achievements?|awards?)[:\s]*\n(.*?)(?=\n\s*[A-Z][^:\n]*:|$)',
    ]
    
    for pattern in cert_patterns:
        matches = re.findall(pattern, text, re.DOTALL)
        for match in matches:
            # Split by bullets or newlines
            cert_lines = re.split(r'[•\-\*]\s*|(?:\n\s*)+', match.strip())
            
            for line in cert_lines:
                line = line.strip()
                if len(line) > 10:
                    # Extract date if present
                    date_pattern = r'[\(\[]?(\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})[\)\]]?'
                    date_match = re.search(date_pattern, line)
                    
                    cert = {
                        "title": line,
                        "description": "",
                        "date": date_match.group(1) if date_match else ""
                    }
                    
                    # Remove date from title
                    if date_match:
                        cert["title"] = line.replace(date_match.group(0), "").strip()
                    
                    certifications.append(cert)
    
    return certifications[:5]  # Top 5 certifications


def extract_summary_from_text(text: str) -> str:
    """Extract professional summary"""
    summary_patterns = [
        r'(?i)(?:summary|objective|profile)[:\s]*\n(.*?)(?=\n\s*[A-Z][^:\n]*:|$)',
        r'(?i)(?:about me|introduction)[:\s]*\n(.*?)(?=\n\s*[A-Z][^:\n]*:|$)'
    ]
    
    for pattern in summary_patterns:
        matches = re.findall(pattern, text, re.DOTALL)
        if matches:
            summary = matches[0].strip()
            # Clean up and return first paragraph
            paragraphs = summary.split('\n\n')
            if paragraphs:
                return paragraphs[0].strip()[:500]  # Max 500 chars
    
    # If no summary section found, generate from first few lines
    lines = text.split('\n')[:20]
    for i, line in enumerate(lines):
        if len(line.strip()) > 50 and not any(keyword in line.lower() for keyword in ['email', 'phone', 'linkedin', 'github', 'address']):
            return line.strip()[:300]
    
    return ""


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

    # Extract personal info (links) so we can persist profile URLs alongside other data
    try:
        personal_info = extract_personal_info_from_text(text)
    except Exception:
        personal_info = {}

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
        # Persist extracted profile URLs if present
        if personal_info.get("linkedin"):
            val = personal_info.get("linkedin")
            if val and not val.startswith("http"):
                val = f"https://{val}"
            update_data["linkedin_url"] = val
        if personal_info.get("github"):
            val = personal_info.get("github")
            if val and not val.startswith("http"):
                val = f"https://{val}"
            update_data["github_url"] = val
        if personal_info.get("leetcode"):
            val = personal_info.get("leetcode")
            if val and not val.startswith("http"):
                val = f"https://{val}"
            update_data["leetcode_url"] = val

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

@app.post("/create-test-session/")
async def create_test_session():
    """
    Create a test hiring session for debugging purposes
    """
    try:
        # First, check if we have any profiles to use as recruiter_id
        profiles_response = supabase.table('profiles').select('id').limit(1).execute()
        
        if not profiles_response.data:
            # Create a test profile first
            import uuid
            test_recruiter_uuid = str(uuid.uuid4())
            profile_data = {
                'id': test_recruiter_uuid,
                'full_name': 'Test Recruiter',
                'email': 'test@example.com',
                'role': 'recruiter'
            }
            supabase.table('profiles').insert(profile_data).execute()
            recruiter_id = test_recruiter_uuid
        else:
            recruiter_id = profiles_response.data[0]['id']
        
        test_session_data = {
            'title': 'Test Machine Learning Engineer Position',
            'role': 'ML Engineer',
            'recruiter_id': recruiter_id,
            'description': 'Test position for machine learning engineer with Python experience',
            'target_hires': 1,
            'current_hires': 0,
            'status': 'active'
        }
        
        response = supabase.table('hiring_sessions').insert(test_session_data).execute()
        
        if response.data and len(response.data) > 0:
            session_id = response.data[0]['id']
            print(f"✅ Created test session: {session_id}")
            
            return JSONResponse({
                "status": "success",
                "session_id": session_id,
                "session_data": response.data[0],
                "message": "Test hiring session created successfully"
            })
        else:
            print("❌ Failed to create test session")
            return JSONResponse({
                "status": "error", 
                "message": "Failed to create test session"
            }, status_code=500)
            
    except Exception as e:
        print(f"❌ Error creating test session: {e}")
        traceback.print_exc()
        return JSONResponse({
            "status": "error", 
            "message": f"Failed to create test session: {str(e)}"
        }, status_code=500)

@app.post("/process-hiring-session/")
async def process_hiring_session(
    session_id: str = Form(...),
    description: str = Form(...)
):
    """
    Process a hiring session description to extract required skills, 
    eligibility criteria, and eligible years, then update the database.
    Checks for existing criteria to avoid re-extraction.
    """
    print(f"Processing hiring session: {session_id}")
    print(f"Description length: {len(description)} characters")
    
    try:
        # First, check if the session exists and get current criteria
        session_check = supabase.table('hiring_sessions').select(
            "id, title, recruiter_id, requirements, eligibility_criteria"
        ).eq('id', session_id).execute()
        
        if not session_check.data:
            print(f"❌ Session {session_id} not found in database")
            
            # Let's also check what sessions do exist for debugging
            all_sessions = supabase.table('hiring_sessions').select("id, title").execute()
            print(f"📊 Available sessions in database: {len(all_sessions.data if all_sessions.data else 0)}")
            if all_sessions.data:
                for session in all_sessions.data[:3]:  # Show first 3 sessions
                    print(f"   - {session['id']}: {session['title']}")
            
            return JSONResponse({
                "status": "error", 
                "message": f"Hiring session {session_id} not found in database",
                "debug_info": {
                    "total_sessions": len(all_sessions.data if all_sessions.data else 0),
                    "session_exists": False
                }
            }, status_code=404)
        
        session_data = session_check.data[0]
        print(f"✅ Found session: {session_data['title']}")
        
        # Check if criteria already exists and is meaningful
        existing_requirements = session_data.get('requirements', {})
        existing_eligibility = session_data.get('eligibility_criteria', {})
        
        has_skills = existing_requirements.get('required_skills') and len(existing_requirements['required_skills']) > 0
        has_criteria = (existing_eligibility.get('education') and len(existing_eligibility['education']) > 0) or \
                      existing_eligibility.get('experience_years', 0) > 0 or \
                      existing_eligibility.get('cgpa_minimum', 0) > 0
        has_eligible_years = existing_eligibility.get('eligible_years') and len(existing_eligibility['eligible_years']) > 0
        
        if has_skills and (has_criteria or has_eligible_years):
            print(f"✅ Session {session_id} already has extracted criteria, returning existing data")
            
            return JSONResponse({
                "status": "success",
                "session_id": session_id,
                "extracted_data": {
                    "required_skills": existing_requirements.get('required_skills', []),
                    "eligibility_criteria": {
                        "education": existing_eligibility.get('education', []),
                        "experience_years": existing_eligibility.get('experience_years', 0),
                        "cgpa_minimum": existing_eligibility.get('cgpa_minimum', 0.0),
                        "specific_requirements": existing_eligibility.get('specific_requirements', [])
                    },
                    "eligible_years": existing_eligibility.get('eligible_years', [])
                },
                "message": "Existing criteria found, no re-extraction needed"
            })
        
        print(f"📝 Session {session_id} has incomplete criteria, extracting from description")
        
        # Extract information from description
        extracted_info = extract_job_info_from_description(description)
        
        print(f"Extracted skills: {extracted_info['required_skills']}")
        print(f"Extracted eligibility criteria: {extracted_info['eligibility_criteria']}")
        print(f"Extracted eligible years: {extracted_info['eligible_years']}")
        
        # Prepare update data for the hiring_sessions table
        update_data = {
            'requirements': {
                'required_skills': extracted_info['required_skills']
            },
            'eligibility_criteria': {
                **extracted_info['eligibility_criteria'],
                'eligible_years': extracted_info['eligible_years']
            }
        }
        
        # Update the hiring session in Supabase
        response = supabase.table('hiring_sessions').update(update_data).eq('id', session_id).execute()
        
        if response.data and len(response.data) > 0:
            print(f"✅ Successfully updated hiring session {session_id}")
            
            return JSONResponse({
                "status": "success",
                "session_id": session_id,
                "extracted_data": {
                    "required_skills": extracted_info['required_skills'],
                    "eligibility_criteria": extracted_info['eligibility_criteria'],
                    "eligible_years": extracted_info['eligible_years']
                },
                "message": "Hiring session updated successfully with extracted information"
            })
        else:
            print(f"❌ Failed to update hiring session {session_id} - update returned no data")
            return JSONResponse({
                "status": "error", 
                "message": f"Failed to update hiring session {session_id} - database update failed",
                "debug_info": {
                    "session_exists": True,
                    "update_response": response.data
                }
            }, status_code=500)
            
    except Exception as e:
        print(f"❌ Error processing hiring session: {e}")
        traceback.print_exc()
        return JSONResponse({
            "status": "error", 
            "message": f"Failed to process hiring session: {str(e)}"
        }, status_code=500)

@app.get("/test-job-extraction/")
async def test_job_extraction():
    """
    Test endpoint to verify job information extraction functionality
    """
    sample_description = """
    We are looking for a Full Stack Developer with 2+ years of experience in React, Node.js, and Python.
    The candidate should have a B.Tech in Computer Science with minimum CGPA of 7.5.
    Experience with AWS, Docker, and MongoDB is preferred.
    Final year students and fresh graduates are welcome to apply.
    Must have knowledge of Git and agile development practices.
    """
    
    try:
        extracted_info = extract_job_info_from_description(sample_description)
        
        return JSONResponse({
            "status": "success",
            "sample_description": sample_description,
            "extracted_data": {
                "required_skills": extracted_info['required_skills'],
                "eligibility_criteria": extracted_info['eligibility_criteria'],
                "eligible_years": extracted_info['eligible_years']
            }
        })
        
    except Exception as e:
        return JSONResponse({
            "status": "error",
            "message": f"Extraction test failed: {str(e)}"
        }, status_code=500)

@app.post("/extract-job-info/")
async def extract_job_info(request: Request):
    """
    Extract job information from a provided job description.
    If session_id is provided, checks if criteria already exists to avoid re-extraction.
    """
    try:
        data = await request.json()
        job_description = data.get("job_description", "")
        session_id = data.get("session_id", None)  # Optional session ID
        
        if not job_description or not job_description.strip():
            return JSONResponse({
                "status": "error",
                "message": "Job description is required"
            }, status_code=400)
        
        # Check if session_id is provided and criteria already exists
        if session_id:
            try:
                session_check = supabase.table('hiring_sessions').select(
                    "id, requirements, eligibility_criteria"
                ).eq('id', session_id).execute()
                
                if session_check.data and len(session_check.data) > 0:
                    session_data = session_check.data[0]
                    requirements = session_data.get('requirements', {})
                    eligibility_criteria = session_data.get('eligibility_criteria', {})
                    
                    # Check if both requirements and eligibility_criteria have meaningful data
                    has_skills = requirements.get('required_skills') and len(requirements['required_skills']) > 0
                    has_criteria = (eligibility_criteria.get('education') and len(eligibility_criteria['education']) > 0) or \
                                 eligibility_criteria.get('experience_years', 0) > 0 or \
                                 eligibility_criteria.get('cgpa_minimum', 0) > 0
                    has_eligible_years = eligibility_criteria.get('eligible_years') and len(eligibility_criteria['eligible_years']) > 0
                    
                    if has_skills and (has_criteria or has_eligible_years):
                        print(f"✅ Session {session_id} already has extracted criteria, returning existing data")
                        
                        return JSONResponse({
                            "status": "success",
                            "extracted_data": {
                                "required_skills": requirements.get('required_skills', []),
                                "eligibility_criteria": {
                                    "education": eligibility_criteria.get('education', []),
                                    "experience_years": eligibility_criteria.get('experience_years', 0),
                                    "cgpa_minimum": eligibility_criteria.get('cgpa_minimum', 0.0),
                                    "specific_requirements": eligibility_criteria.get('specific_requirements', [])
                                },
                                "eligible_years": eligibility_criteria.get('eligible_years', [])
                            },
                            "message": "Existing criteria found, no re-extraction needed"
                        })
                    else:
                        print(f"📝 Session {session_id} exists but has incomplete criteria, will extract")
                else:
                    print(f"⚠️ Session {session_id} not found, proceeding with extraction")
                    
            except Exception as session_error:
                print(f"Error checking session {session_id}: {session_error}")
                # Continue with extraction if session check fails
        
        print(f"Extracting info from job description: {len(job_description)} characters")
        
        # Extract information using our existing function
        extracted_info = extract_job_info_from_description(job_description)
        
        return JSONResponse({
            "status": "success",
            "extracted_data": {
                "required_skills": extracted_info['required_skills'],
                "eligibility_criteria": extracted_info['eligibility_criteria'],
                "eligible_years": extracted_info['eligible_years']
            },
            "message": "Job information extracted successfully"
        })
        
    except Exception as e:
        print(f"Job extraction error: {e}")
        traceback.print_exc()
        return JSONResponse({
            "status": "error", 
            "message": f"Failed to extract job information: {str(e)}"
        }, status_code=500)


def calculate_student_job_match_score(student_data: dict, job_requirements: dict, job_eligibility: dict) -> float:
    """
    Calculate match score between a student and job requirements.
    Returns a score from 0-100 based on various criteria.
    """
    try:
        total_score = 0.0
        
        # 1. Skills Match (40% weight)
        skills_score = 0.0
        required_skills = job_requirements.get('required_skills', [])
        student_skills = student_data.get('skills', [])
        
        if required_skills and student_skills:
            # Convert to lowercase for case-insensitive matching
            required_skills_lower = [skill.lower().strip() for skill in required_skills]
            student_skills_lower = [skill.lower().strip() for skill in student_skills]
            
            matched_skills = 0
            for req_skill in required_skills_lower:
                # Check for exact match or partial match
                for student_skill in student_skills_lower:
                    if req_skill in student_skill or student_skill in req_skill:
                        matched_skills += 1
                        break
            
            skills_score = (matched_skills / len(required_skills)) * 100 if required_skills else 0
        
        total_score += skills_score * 0.4
        
        # 2. Education Match (25% weight)
        education_score = 0.0
        required_education = job_eligibility.get('education', [])
        student_education = student_data.get('education', [])
        
        if required_education and student_education:
            # Simple matching - if any education requirement matches student's education
            education_matched = False
            for req_edu in required_education:
                req_edu_lower = req_edu.lower()
                for student_edu in student_education:
                    if isinstance(student_edu, dict):
                        student_edu_str = str(student_edu.get('degree', '') + ' ' + student_edu.get('field', '')).lower()
                    else:
                        student_edu_str = str(student_edu).lower()
                    
                    if req_edu_lower in student_edu_str or any(word in student_edu_str for word in req_edu_lower.split()):
                        education_matched = True
                        break
                if education_matched:
                    break
            
            education_score = 100 if education_matched else 50  # 50 for any degree, 100 for exact match
        elif not required_education:  # No specific education required
            education_score = 100
        else:
            education_score = 0  # No education data for student
        
        total_score += education_score * 0.25
        
        # 3. Experience Match (20% weight) 
        experience_score = 0.0
        required_experience = job_eligibility.get('experience_years', 0)
        student_experience = student_data.get('experience', [])
        
        if required_experience > 0:
            # Calculate student's total experience years
            student_exp_years = 0
            if student_experience:
                # Simple heuristic: count number of experiences and estimate years
                student_exp_years = len(student_experience) * 0.5  # Assume 6 months per experience on average
                
                # Try to extract years from experience descriptions
                for exp in student_experience:
                    exp_str = str(exp).lower()
                    # Look for year patterns
                    year_matches = re.findall(r'(\d+)\s*(?:year|yr)', exp_str)
                    if year_matches:
                        student_exp_years += sum(int(y) for y in year_matches)
            
            if student_exp_years >= required_experience:
                experience_score = 100
            elif student_exp_years >= required_experience * 0.5:  # At least 50% of required experience
                experience_score = 80
            else:
                experience_score = 40  # Some experience but not enough
        else:
            experience_score = 100  # No specific experience required
        
        total_score += experience_score * 0.2
        
        # 4. Academic Performance (10% weight)
        academic_score = 0.0
        required_cgpa = job_eligibility.get('cgpa_minimum', 0)
        student_gpa = student_data.get('gpa')
        
        if required_cgpa > 0 and student_gpa:
            try:
                student_gpa_float = float(student_gpa)
                if student_gpa_float >= required_cgpa:
                    academic_score = 100
                elif student_gpa_float >= required_cgpa * 0.9:  # Within 90% of required
                    academic_score = 80
                else:
                    academic_score = 50
            except (ValueError, TypeError):
                academic_score = 50  # Default if GPA parsing fails
        elif not required_cgpa:  # No minimum GPA required
            academic_score = 100
        else:
            academic_score = 50  # No GPA data
        
        total_score += academic_score * 0.1
        
        # 5. Year Eligibility (5% weight)
        year_score = 0.0
        eligible_years = job_eligibility.get('eligible_years', [])
        student_year = student_data.get('year')
        
        if eligible_years and student_year:
            try:
                student_year_int = int(student_year)
                if student_year_int in eligible_years:
                    year_score = 100
                else:
                    year_score = 0
            except (ValueError, TypeError):
                year_score = 50
        elif not eligible_years:  # No year restriction
            year_score = 100
        else:
            year_score = 50
        
        total_score += year_score * 0.05
        
        # Cap the score between 0 and 100
        final_score = max(0, min(100, total_score))
        
        print(f"Match score breakdown - Skills: {skills_score:.1f}, Education: {education_score:.1f}, Experience: {experience_score:.1f}, Academic: {academic_score:.1f}, Year: {year_score:.1f}, Final: {final_score:.1f}")
        
        return final_score
        
    except Exception as e:
        print(f"Error calculating match score: {e}")
        return 0.0


@app.post("/find-matching-students/{session_id}")
async def find_matching_students(session_id: str, min_score: float = 60.0):
    """
    Find and rank students based on their match with job requirements.
    Automatically populates session_candidates table with matching students.
    """
    try:
        print(f"Finding matching students for session: {session_id}")
        
        # 1. Get the hiring session details
        session_response = supabase.table('hiring_sessions').select('*').eq('id', session_id).execute()
        
        if not session_response.data:
            raise HTTPException(status_code=404, detail="Hiring session not found")
        
        session = session_response.data[0]
        requirements = session.get('requirements', {})
        eligibility_criteria = session.get('eligibility_criteria', {})
        
        print(f"Session requirements: {requirements}")
        print(f"Session eligibility: {eligibility_criteria}")
        
        # 2. Get all students with their data
        students_response = supabase.table('students').select('*').execute()
        
        if not students_response.data:
            return JSONResponse({
                "status": "success",
                "message": "No students found in database",
                "matches": []
            })
        
        students = students_response.data
        print(f"Found {len(students)} total students")
        
        # 3. Calculate match scores for all students
        matches = []
        for student in students:
            try:
                match_score = calculate_student_job_match_score(student, requirements, eligibility_criteria)
                
                if match_score >= min_score:
                    # Get student profile info
                    profile_response = supabase.table('profiles').select('full_name, email').eq('id', student['id']).execute()
                    profile = profile_response.data[0] if profile_response.data else {}
                    
                    match_data = {
                        'student_id': student['id'],
                        'match_score': round(match_score, 2),
                        'student_name': profile.get('full_name', 'Unknown'),
                        'student_email': profile.get('email', 'Unknown'),
                        'skills': student.get('skills', []),
                        'year': student.get('year'),
                        'department': student.get('department'),
                        'gpa': student.get('gpa'),
                        'has_resume': bool(student.get('resume_url'))
                    }
                    matches.append(match_data)
                    
            except Exception as student_error:
                print(f"Error processing student {student.get('id', 'unknown')}: {student_error}")
                continue
        
        # 4. Sort matches by score (highest first)
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        print(f"Found {len(matches)} students above {min_score}% match threshold")
        
        # 5. Clear existing candidates for this session and add new matches
        try:
            # Delete existing candidates
            supabase.table('session_candidates').delete().eq('session_id', session_id).execute()
            
            # Insert new matching candidates
            candidates_to_insert = []
            for match in matches:
                # Determine initial status based on match score
                if match['match_score'] >= 90:
                    initial_status = 'shortlisted'
                elif match['match_score'] >= 80:
                    initial_status = 'shortlisted'
                elif match['match_score'] >= 70:
                    initial_status = 'shortlisted'
                else:
                    initial_status = 'shortlisted'  # All matching students start as shortlisted
                
                candidates_to_insert.append({
                    'session_id': session_id,
                    'student_id': match['student_id'],
                    'match_score': match['match_score'],
                    'status': initial_status,
                    'recruiter_notes': f"Auto-matched with {match['match_score']}% compatibility"
                })
            
            if candidates_to_insert:
                supabase.table('session_candidates').insert(candidates_to_insert).execute()
                print(f"Inserted {len(candidates_to_insert)} candidates into session")
        
        except Exception as db_error:
            print(f"Database error while updating candidates: {db_error}")
            # Continue even if database update fails
        
        return JSONResponse({
            "status": "success",
            "message": f"Found {len(matches)} matching students",
            "session_id": session_id,
            "total_matches": len(matches),
            "min_score_threshold": min_score,
            "matches": matches[:50]  # Return top 50 matches
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error finding matching students: {e}")
        traceback.print_exc()
        return JSONResponse({
            "status": "error",
            "message": f"Failed to find matching students: {str(e)}"
        }, status_code=500)


@app.post("/refresh-session-matches/{session_id}")
async def refresh_session_matches(session_id: str, min_score: float = 60.0):
    """
    Refresh the matching students for a hiring session.
    This is useful when job requirements are updated or new students are added.
    """
    try:
        # Simply call the find_matching_students function
        return await find_matching_students(session_id, min_score)
        
    except Exception as e:
        print(f"Error refreshing session matches: {e}")
        return JSONResponse({
            "status": "error",
            "message": f"Failed to refresh matches: {str(e)}"
        }, status_code=500)


@app.get("/detailed-match-analysis/{session_id}/{student_id}")
async def get_detailed_match_analysis(session_id: str, student_id: str):
    """
    Get detailed match analysis between a specific student and job requirements.
    Returns breakdown of skill matching, education compatibility, experience alignment, etc.
    """
    try:
        # 1. Get the hiring session details
        session_response = supabase.table('hiring_sessions').select('*').eq('id', session_id).execute()
        if not session_response.data:
            raise HTTPException(status_code=404, detail="Hiring session not found")
        
        session = session_response.data[0]
        requirements = session.get('requirements', {})
        eligibility_criteria = session.get('eligibility_criteria', {})
        
        # 2. Get student details
        student_response = supabase.table('students').select('*').eq('id', student_id).execute()
        if not student_response.data:
            raise HTTPException(status_code=404, detail="Student not found")
        
        student = student_response.data[0]
        
        # 3. Get student profile
        profile_response = supabase.table('profiles').select('*').eq('id', student_id).execute()
        profile = profile_response.data[0] if profile_response.data else {}
        
        # 4. Calculate detailed match analysis
        analysis = calculate_detailed_match_analysis(student, requirements, eligibility_criteria)
        
        # 5. Add student and job info to response
        analysis['student_info'] = {
            'name': profile.get('full_name', 'Unknown'),
            'email': profile.get('email', ''),
            'year': student.get('year'),
            'department': student.get('department'),
            'gpa': student.get('gpa'),
            'skills': student.get('skills', []),
            'experience': student.get('experience', []),
            'projects': student.get('projects', []),
            'has_internship': student.get('has_internship', False),
            'ats_score': student.get('ats_score', 0)
        }
        
        analysis['job_info'] = {
            'title': session.get('title'),
            'role': session.get('role'),
            'required_skills': requirements.get('required_skills', []),
            'education_requirements': eligibility_criteria.get('education', []),
            'experience_years': eligibility_criteria.get('experience_years', 0),
            'cgpa_minimum': eligibility_criteria.get('cgpa_minimum', 0),
            'eligible_years': eligibility_criteria.get('eligible_years', [])
        }
        
        return JSONResponse({
            "status": "success",
            "analysis": analysis
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in detailed match analysis: {e}")
        return JSONResponse({
            "status": "error",
            "message": f"Failed to get detailed analysis: {str(e)}"
        }, status_code=500)


def calculate_detailed_match_analysis(student_data: dict, job_requirements: dict, job_eligibility: dict) -> dict:
    """
    Calculate detailed match analysis with breakdown of each component.
    """
    analysis = {
        'overall_score': 0.0,
        'skills_analysis': {},
        'education_analysis': {},
        'experience_analysis': {},
        'academic_analysis': {},
        'year_eligibility_analysis': {},
        'recommendations': []
    }
    
    try:
        # 1. Skills Analysis (40% weight)
        required_skills = job_requirements.get('required_skills', [])
        student_skills = student_data.get('skills', [])
        
        skills_analysis = {
            'weight': 40,
            'score': 0.0,
            'matched_skills': [],
            'missing_skills': [],
            'additional_skills': []
        }
        
        if required_skills and student_skills:
            required_skills_lower = [skill.lower().strip() for skill in required_skills]
            student_skills_lower = [skill.lower().strip() for skill in student_skills]
            
            matched_count = 0
            for req_skill in required_skills:
                req_skill_lower = req_skill.lower().strip()
                matched = False
                for student_skill in student_skills:
                    student_skill_lower = student_skill.lower().strip()
                    if req_skill_lower in student_skill_lower or student_skill_lower in req_skill_lower:
                        skills_analysis['matched_skills'].append({
                            'required': req_skill,
                            'student_has': student_skill
                        })
                        matched_count += 1
                        matched = True
                        break
                
                if not matched:
                    skills_analysis['missing_skills'].append(req_skill)
            
            # Find additional skills student has
            for student_skill in student_skills:
                student_skill_lower = student_skill.lower().strip()
                is_additional = True
                for req_skill_lower in required_skills_lower:
                    if req_skill_lower in student_skill_lower or student_skill_lower in req_skill_lower:
                        is_additional = False
                        break
                if is_additional:
                    skills_analysis['additional_skills'].append(student_skill)
            
            skills_analysis['score'] = (matched_count / len(required_skills)) * 100
        elif not required_skills:
            skills_analysis['score'] = 100
            
        analysis['skills_analysis'] = skills_analysis
        
        # 2. Education Analysis (25% weight)
        education_analysis = {
            'weight': 25,
            'score': 0.0,
            'requirements_met': [],
            'requirements_not_met': [],
            'student_education': student_data.get('education', [])
        }
        
        required_education = job_eligibility.get('education', [])
        student_education = student_data.get('education', [])
        
        if required_education and student_education:
            education_matched = False
            for req_edu in required_education:
                req_edu_lower = req_edu.lower()
                matched = False
                for student_edu in student_education:
                    if isinstance(student_edu, dict):
                        student_edu_str = str(student_edu.get('degree', '') + ' ' + student_edu.get('field', '')).lower()
                    else:
                        student_edu_str = str(student_edu).lower()
                    
                    if req_edu_lower in student_edu_str or any(word in student_edu_str for word in req_edu_lower.split()):
                        education_analysis['requirements_met'].append({
                            'required': req_edu,
                            'student_has': student_edu_str
                        })
                        education_matched = True
                        matched = True
                        break
                
                if not matched:
                    education_analysis['requirements_not_met'].append(req_edu)
            
            education_analysis['score'] = 100 if education_matched else 50
        elif not required_education:
            education_analysis['score'] = 100
            
        analysis['education_analysis'] = education_analysis
        
        # 3. Experience Analysis (20% weight)
        experience_analysis = {
            'weight': 20,
            'score': 0.0,
            'required_years': job_eligibility.get('experience_years', 0),
            'student_experience_years': 0,
            'student_experiences': student_data.get('experience', []),
            'has_internship': student_data.get('has_internship', False)
        }
        
        required_experience = job_eligibility.get('experience_years', 0)
        student_experience = student_data.get('experience', [])
        
        if required_experience > 0:
            student_exp_years = 0
            if student_experience:
                student_exp_years = len(student_experience) * 0.5
                
                for exp in student_experience:
                    exp_str = str(exp).lower()
                    year_matches = re.findall(r'(\d+)\s*(?:year|yr)', exp_str)
                    if year_matches:
                        student_exp_years += sum(int(y) for y in year_matches)
            
            experience_analysis['student_experience_years'] = student_exp_years
            
            if student_exp_years >= required_experience:
                experience_analysis['score'] = 100
            elif student_exp_years >= required_experience * 0.5:
                experience_analysis['score'] = 80
            else:
                experience_analysis['score'] = 40
        else:
            experience_analysis['score'] = 100
            
        analysis['experience_analysis'] = experience_analysis
        
        # 4. Academic Analysis (10% weight)
        academic_analysis = {
            'weight': 10,
            'score': 0.0,
            'required_cgpa': job_eligibility.get('cgpa_minimum', 0),
            'student_gpa': student_data.get('gpa'),
            'meets_requirement': False
        }
        
        required_cgpa = job_eligibility.get('cgpa_minimum', 0)
        student_gpa = student_data.get('gpa')
        
        if required_cgpa > 0 and student_gpa:
            try:
                student_gpa_float = float(student_gpa)
                if student_gpa_float >= required_cgpa:
                    academic_analysis['score'] = 100
                    academic_analysis['meets_requirement'] = True
                elif student_gpa_float >= required_cgpa * 0.9:
                    academic_analysis['score'] = 80
                else:
                    academic_analysis['score'] = 50
            except (ValueError, TypeError):
                academic_analysis['score'] = 50
        elif not required_cgpa:
            academic_analysis['score'] = 100
        else:
            academic_analysis['score'] = 50
            
        analysis['academic_analysis'] = academic_analysis
        
        # 5. Year Eligibility Analysis (5% weight)
        year_analysis = {
            'weight': 5,
            'score': 0.0,
            'eligible_years': job_eligibility.get('eligible_years', []),
            'student_year': student_data.get('year'),
            'is_eligible': False
        }
        
        eligible_years = job_eligibility.get('eligible_years', [])
        student_year = student_data.get('year')
        
        if eligible_years and student_year:
            try:
                student_year_int = int(student_year)
                if student_year_int in eligible_years:
                    year_analysis['score'] = 100
                    year_analysis['is_eligible'] = True
                else:
                    year_analysis['score'] = 0
            except (ValueError, TypeError):
                year_analysis['score'] = 50
        elif not eligible_years:
            year_analysis['score'] = 100
            year_analysis['is_eligible'] = True
        else:
            year_analysis['score'] = 50
            
        analysis['year_eligibility_analysis'] = year_analysis
        
        # Calculate overall score
        overall_score = (
            skills_analysis['score'] * 0.4 +
            education_analysis['score'] * 0.25 +
            experience_analysis['score'] * 0.2 +
            academic_analysis['score'] * 0.1 +
            year_analysis['score'] * 0.05
        )
        
        analysis['overall_score'] = round(max(0, min(100, overall_score)), 2)
        
        # Generate recommendations
        recommendations = []
        
        if skills_analysis['missing_skills']:
            recommendations.append(f"Consider developing skills in: {', '.join(skills_analysis['missing_skills'][:3])}")
        
        if not education_analysis['requirements_met'] and education_analysis['requirements_not_met']:
            recommendations.append(f"Educational background may not fully align with requirements")
        
        if experience_analysis['required_years'] > experience_analysis['student_experience_years']:
            recommendations.append(f"Gain more experience (has {experience_analysis['student_experience_years']} years, needs {experience_analysis['required_years']})")
        
        if not academic_analysis['meets_requirement'] and academic_analysis['required_cgpa'] > 0:
            recommendations.append(f"CGPA requirement not met (has {student_gpa}, needs {academic_analysis['required_cgpa']})")
        
        if not year_analysis['is_eligible'] and year_analysis['eligible_years']:
            recommendations.append(f"Not in eligible academic year (in year {student_year}, eligible: {year_analysis['eligible_years']})")
        
        if len(recommendations) == 0:
            recommendations.append("Strong candidate with good alignment to job requirements!")
        
        analysis['recommendations'] = recommendations
        
        return analysis
        
    except Exception as e:
        print(f"Error in detailed match analysis: {e}")
        return analysis


@app.post("/bulk-update-candidate-status/")
async def bulk_update_candidate_status(request: Request):
    """
    Update status for multiple candidates at once.
    Useful for batch operations like shortlisting multiple candidates.
    """
    try:
        data = await request.json()
        updates = data.get("updates", [])  # List of {candidate_id, status, notes}
        
        if not updates:
            return JSONResponse({
                "status": "error",
                "message": "No updates provided"
            }, status_code=400)
        
        updated_candidates = []
        failed_updates = []
        
        for update in updates:
            candidate_id = update.get("candidate_id")
            new_status = update.get("status")
            notes = update.get("notes", "")
            
            if not candidate_id or not new_status:
                failed_updates.append({"candidate_id": candidate_id, "error": "Missing candidate_id or status"})
                continue
            
            try:
                # Update candidate status
                response = supabase.table('session_candidates').update({
                    'status': new_status,
                    'recruiter_notes': notes,
                    'updated_at': 'now()'
                }).eq('id', candidate_id).execute()
                
                if response.data:
                    updated_candidates.append(candidate_id)
                else:
                    failed_updates.append({"candidate_id": candidate_id, "error": "Update failed"})
                    
            except Exception as e:
                failed_updates.append({"candidate_id": candidate_id, "error": str(e)})
        
        return JSONResponse({
            "status": "success",
            "updated_count": len(updated_candidates),
            "failed_count": len(failed_updates),
            "updated_candidates": updated_candidates,
            "failed_updates": failed_updates
        })
        
    except Exception as e:
        print(f"Error in bulk status update: {e}")
        return JSONResponse({
            "status": "error",
            "message": f"Failed to update candidate statuses: {str(e)}"
        }, status_code=500)


@app.get("/session-analytics/{session_id}")
async def get_session_analytics(session_id: str):
    """
    Get analytics for a hiring session including candidate distribution,
    match score analysis, and recruitment pipeline metrics.
    """
    try:
        # 1. Get session details
        session_response = supabase.table('hiring_sessions').select('*').eq('id', session_id).execute()
        if not session_response.data:
            raise HTTPException(status_code=404, detail="Hiring session not found")
        
        session = session_response.data[0]
        
        # 2. Get all candidates for this session
        candidates_response = supabase.table('session_candidates').select(
            "*,student:students(id,skills,year,department,gpa,has_internship,ats_score)"
        ).eq('session_id', session_id).execute()
        
        candidates = candidates_response.data if candidates_response.data else []
        
        # 3. Calculate analytics
        analytics = {
            'session_info': {
                'title': session.get('title'),
                'role': session.get('role'),
                'target_hires': session.get('target_hires', 0),
                'current_hires': session.get('current_hires', 0)
            },
            'candidate_stats': {
                'total_candidates': len(candidates),
                'status_distribution': {},
                'match_score_distribution': {
                    'excellent': 0,  # 90-100%
                    'good': 0,       # 80-89%
                    'fair': 0,       # 70-79%
                    'poor': 0        # <70%
                },
                'year_distribution': {},
                'department_distribution': {},
                'skills_analysis': {
                    'most_common_skills': {},
                    'average_skill_count': 0
                },
                'academic_stats': {
                    'average_gpa': 0,
                    'average_ats_score': 0,
                    'internship_percentage': 0
                }
            },
            'pipeline_metrics': {
                'conversion_rates': {},
                'top_performers': []
            }
        }
        
        # Status distribution
        status_counts = {}
        match_scores = []
        years = []
        departments = []
        all_skills = []
        gpas = []
        ats_scores = []
        internship_count = 0
        
        for candidate in candidates:
            status = candidate.get('status', 'unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
            
            match_score = candidate.get('match_score', 0)
            match_scores.append(match_score)
            
            # Categorize match scores
            if match_score >= 90:
                analytics['candidate_stats']['match_score_distribution']['excellent'] += 1
            elif match_score >= 80:
                analytics['candidate_stats']['match_score_distribution']['good'] += 1
            elif match_score >= 70:
                analytics['candidate_stats']['match_score_distribution']['fair'] += 1
            else:
                analytics['candidate_stats']['match_score_distribution']['poor'] += 1
            
            # Student data analysis
            student = candidate.get('student', {})
            if student:
                year = student.get('year')
                if year:
                    years.append(year)
                
                dept = student.get('department')
                if dept:
                    departments.append(dept)
                
                skills = student.get('skills', [])
                if skills:
                    all_skills.extend(skills)
                
                gpa = student.get('gpa')
                if gpa:
                    try:
                        gpas.append(float(gpa))
                    except (ValueError, TypeError):
                        pass
                
                ats_score = student.get('ats_score')
                if ats_score:
                    ats_scores.append(ats_score)
                
                if student.get('has_internship'):
                    internship_count += 1
        
        analytics['candidate_stats']['status_distribution'] = status_counts
        
        # Year distribution
        year_counts = {}
        for year in years:
            year_counts[year] = year_counts.get(year, 0) + 1
        analytics['candidate_stats']['year_distribution'] = year_counts
        
        # Department distribution
        dept_counts = {}
        for dept in departments:
            dept_counts[dept] = dept_counts.get(dept, 0) + 1
        analytics['candidate_stats']['department_distribution'] = dept_counts
        
        # Skills analysis
        skill_counts = {}
        for skill in all_skills:
            skill_counts[skill] = skill_counts.get(skill, 0) + 1
        
        # Top 10 most common skills
        top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        analytics['candidate_stats']['skills_analysis']['most_common_skills'] = dict(top_skills)
        analytics['candidate_stats']['skills_analysis']['average_skill_count'] = round(len(all_skills) / max(1, len(candidates)), 1)
        
        # Academic stats
        if gpas:
            analytics['candidate_stats']['academic_stats']['average_gpa'] = round(sum(gpas) / len(gpas), 2)
        if ats_scores:
            analytics['candidate_stats']['academic_stats']['average_ats_score'] = round(sum(ats_scores) / len(ats_scores), 1)
        if candidates:
            analytics['candidate_stats']['academic_stats']['internship_percentage'] = round((internship_count / len(candidates)) * 100, 1)
        
        # Pipeline metrics
        total = len(candidates)
        if total > 0:
            for status, count in status_counts.items():
                analytics['pipeline_metrics']['conversion_rates'][status] = round((count / total) * 100, 1)
        
        # Top performers (highest match scores)
        top_candidates = sorted(candidates, key=lambda x: x.get('match_score', 0), reverse=True)[:5]
        for candidate in top_candidates:
            student = candidate.get('student', {})
            analytics['pipeline_metrics']['top_performers'].append({
                'candidate_id': candidate.get('id'),
                'student_id': candidate.get('student_id'),
                'match_score': candidate.get('match_score', 0),
                'status': candidate.get('status'),
                'skills_count': len(student.get('skills', [])) if student else 0,
                'gpa': student.get('gpa') if student else None,
                'year': student.get('year') if student else None
            })
        
        return JSONResponse({
            "status": "success",
            "analytics": analytics
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting session analytics: {e}")
        return JSONResponse({
            "status": "error",
            "message": f"Failed to get session analytics: {str(e)}"
        }, status_code=500) 

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)