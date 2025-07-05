import httpx
import json

url = "http://localhost:8000/generate"

prompt_text = "You are a professional radiologist. Carefully analyze the following MRI scan and provide a detailed, structured report that includes: observed abnormalities, possible diagnoses, and any recommendations for further tests or follow-up. Use clear medical terminology suitable for a clinical context."

# Using httpx which handles multipart better
with open("brainImage.png", "rb") as img_file:
    files = {
        "image": ("brainImage.png", img_file, "image/png")
    }
    data = {
        "prompt": json.dumps({"text": prompt_text})
    }
    
    response = httpx.post(url, files=files, data=data)
    
print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")