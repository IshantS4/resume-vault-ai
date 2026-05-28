import urllib.request
import json

# Manually read the API key from the .env file
api_key = None
try:
    with open(".env", "r") as f:
        for line in f:
            if line.startswith("GROQ_API_KEY="):
                api_key = line.strip().split("=", 1)[1].strip('"\'')
                break
except FileNotFoundError:
    print("Error: .env file not found.")
    exit()

if not api_key:
    print("Error: GROQ_API_KEY not found in .env")
    exit()

# Ping Groq using built-in urllib
req = urllib.request.Request("https://api.groq.com/openai/v1/models")
req.add_header("Authorization", f"Bearer {api_key}")
req.add_header("Content-Type", "application/json")

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print("--- ACTIVE GROQ MODELS ---")
        for model in data.get("data", []):
            print(model["id"])
except Exception as e:
    print(f"API Error: {e}")