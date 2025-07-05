# loader.py
from transformers import AutoProcessor, AutoModelForImageTextToText
import torch, os

MODEL_ID = "google/medgemma-4b-it"

def load_model():
    # Get Hugging Face token from environment variable
    hf_token = os.environ.get("HF_TOKEN")
    if not hf_token:
        raise ValueError("HF_TOKEN environment variable not set. Please set it with your Hugging Face token.")
    
    # Use float32 for better stability on MPS
    dtype = torch.float32
    model = AutoModelForImageTextToText.from_pretrained(
        MODEL_ID,
        torch_dtype=dtype,
        device_map={"": "mps"},     # sends everything to the Apple GPU
        token=hf_token
    )
    processor = AutoProcessor.from_pretrained(MODEL_ID, token=hf_token)
    return model, processor

