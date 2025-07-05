# api.py
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import torch
import json

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
model, processor = None, None

class Prompt(BaseModel):
    text: str

@app.on_event("startup")
def startup():
    global model, processor
    from loader import load_model
    model, processor = load_model()

@app.post("/generate")
async def generate(prompt: str = Form(...), image: UploadFile | None = File(None)):
    # Parse the JSON string from the form data
    try:
        prompt_data = json.loads(prompt)
        prompt_text = prompt_data.get("text")
        if not prompt_text:
            raise HTTPException(400, "Prompt text required")
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid JSON in prompt field")

    if model is None or processor is None:
        raise HTTPException(503, "Model not loaded. Please check HF_TOKEN environment variable.")

    content = [{"type": "text", "text": prompt_text}]
    if image:
        img = Image.open(image.file)
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        content.append({"type": "image", "image": img})

    messages = [{"role": "user", "content": content}]
    
    try:
        with torch.no_grad():
            # Process the messages using the processor's chat template
            text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
            
            if image:
                inputs = processor(text=text, images=img, return_tensors="pt")
            else:
                inputs = processor(text=text, return_tensors="pt")
                
            inputs_mps = {}
            for k, v in inputs.items():
                if hasattr(v, "to"):
                    inputs_mps[k] = v.to("mps")
                else:
                    inputs_mps[k] = v
                    
            out = model.generate(
                **inputs_mps,
                max_new_tokens=256
            )
        answer = processor.decode(out[0], skip_special_tokens=True)
        return {"response": answer}
    except Exception as e:
        raise HTTPException(500, f"Error generating response: {str(e)}")

@app.post("/generate-text")
async def generate_text(prompt: Prompt):
    if not prompt.text:
        raise HTTPException(400, "Prompt text required")
    
    if model is None or processor is None:
        raise HTTPException(503, "Model not loaded. Please check HF_TOKEN environment variable.")
    
    content = [{"type": "text", "text": prompt.text}]
    messages = [{"role": "user", "content": content}]
    
    try:
        with torch.no_grad():
            # Use the processor's apply_chat_template if available
            if hasattr(processor, "apply_chat_template"):
                text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
                inputs = processor(text=text, return_tensors="pt")
            else:
                # Fallback to simple text processing
                inputs = processor(text=prompt.text, return_tensors="pt")
            
            # Move all tensor inputs to MPS device
            inputs_mps = {}
            for k, v in inputs.items():
                if hasattr(v, "to"):
                    inputs_mps[k] = v.to("mps")
                else:
                    inputs_mps[k] = v
            
            out = model.generate(
                **inputs_mps,
                max_new_tokens=10000
            )
        answer = processor.decode(out[0], skip_special_tokens=True)
        return {"response": answer}
    except Exception as e:
        raise HTTPException(500, f"Error generating response: {str(e)}")

