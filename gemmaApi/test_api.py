import httpx
import json

url = "http://localhost:8000/generate"

prompt_text = "Analyze this brain MRI (T1 sequence, axial slice) and generate a structured radiology report for medical personnel (radiologists, neurologists, emergency physicians), describing in detail any visible abnormalities (e.g., hemorrhage, mass effect, edema, displacement of structures), their location and severity; also provide (1) an urgency score from 1 (non-urgent) to 5 (life-threatening emergency) with brief justification, (2) a simplified summary understandable by non-specialist professionals (nurses, GPs, family caregivers) explaining the nature and severity of the abnormalities, and (3) use a professional, clear style conforming to hospital standards, structuring the report with the following sections: 'Description', 'Conclusion', 'Urgency Score', and 'Simplified Summary'."

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