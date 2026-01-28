
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

api_key = os.environ.get("GROQ_API_KEY")
print(f"API Key found: {bool(api_key)}")
if api_key:
    print(f"API Key length: {len(api_key)}")
    print(f"API Key Start: {api_key[:5]}...")

try:
    client = Groq(api_key=api_key)
    print("Client initialized.")
    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": "Hello"}],
        model="llama-3.3-70b-versatile",
    )
    print("Response:", chat_completion.choices[0].message.content)
except Exception as e:
    print("Error:", e)
