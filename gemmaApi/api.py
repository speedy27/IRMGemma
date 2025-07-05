# api.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from PIL import Image
import torch

app = FastAPI()
model, processor = None, None

class Prompt(BaseModel):
    text: str

@app.on_event("startup")
def startup():
    global model, processor
    from loader import load_model
    model, processor = load_model()

@app.post("/generate")
async def generate(prompt: Prompt, image: UploadFile | None = File(None)):
    if prompt.text is None:
        raise HTTPException(400, "Prompt required")

    content = [{"type": "text", "text": prompt.text}]
    if image:
        img = Image.open(image.file)
        content.append({"type": "image", "image": img})

    messages = [{"role": "user", "content": content}]
    with torch.no_grad():
        out = model.generate(
            **processor(text=messages, return_tensors="pt").to("mps"),
            max_new_tokens=256
        )
    answer = processor.decode(out[0], skip_special_tokens=True)
    return {"response": answer}

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
                max_new_tokens=256
            )
        answer = processor.decode(out[0], skip_special_tokens=True)
        return {"response": answer}
    except Exception as e:
        raise HTTPException(500, f"Error generating response: {str(e)}")

