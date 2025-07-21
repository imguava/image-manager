import io
from typing import BinaryIO, Tuple, Optional
from PIL import Image
import torch
from transformers import AutoProcessor, AutoModelForVision2Seq

from app.core.config import settings

# Global variables for model and processor
model = None
processor = None


async def load_model():
    """
    Load the AI model for image description
    """
    global model, processor
    
    if not settings.USE_AI_DESCRIPTION:
        return
    
    try:
        # Use a pre-trained model for image captioning
        model_name = "microsoft/git-base-coco"
        
        # Override with custom model path if provided
        if settings.AI_MODEL_PATH:
            model_name = settings.AI_MODEL_PATH
        
        print(f"Loading AI model: {model_name}")
        
        # Load processor and model
        processor = AutoProcessor.from_pretrained(model_name)
        model = AutoModelForVision2Seq.from_pretrained(model_name)
        
        print("AI model loaded successfully")
    except Exception as e:
        print(f"Error loading AI model: {e}")
        model = None
        processor = None


async def generate_image_description(image_data: BinaryIO) -> Tuple[Optional[str], float]:
    """
    Generate a description for an image using AI
    """
    if not settings.USE_AI_DESCRIPTION or model is None or processor is None:
        return None, 0.0
    
    try:
        # Load image
        image_data.seek(0)
        image = Image.open(image_data).convert("RGB")
        
        # Process image
        inputs = processor(images=image, return_tensors="pt")
        
        # Generate description
        with torch.no_grad():
            outputs = model.generate(
                pixel_values=inputs.pixel_values,
                max_length=50,
                num_beams=5,
                early_stopping=True
            )
        
        # Decode the generated tokens
        description = processor.decode(outputs[0], skip_special_tokens=True)
        
        # Calculate confidence (simplified)
        confidence = 0.85  # Placeholder for actual confidence calculation
        
        return description, confidence
    except Exception as e:
        print(f"Error generating image description: {e}")
        return None, 0.0